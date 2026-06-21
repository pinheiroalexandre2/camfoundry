import { spawn, ChildProcess } from 'child_process'
import { mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import ffmpegPath from 'ffmpeg-static'
import type { Camera, StreamState } from '@shared/types'
import { resolveRtspUrl } from '../onvif/device'
import { HlsServer } from './hlsServer'

interface ActiveStream {
  process: ChildProcess
  dir: string
}

export class StreamManager {
  private rootDir = join(tmpdir(), 'onvif-viewer-streams')
  private server = new HlsServer(this.rootDir)
  private streams = new Map<string, ActiveStream>()

  constructor(private onStatus: (state: StreamState) => void) {}

  async init(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true })
    await this.server.start()
  }

  async start(camera: Camera): Promise<StreamState> {
    await this.stop(camera.id)

    this.onStatus({ cameraId: camera.id, status: 'connecting' })

    let rtspUrl: string
    try {
      rtspUrl = await resolveRtspUrl(camera)
    } catch (err) {
      const state: StreamState = {
        cameraId: camera.id,
        status: 'error',
        error: `ONVIF: ${(err as Error).message}`
      }
      this.onStatus(state)
      return state
    }

    const dir = join(this.rootDir, camera.id)
    await mkdir(dir, { recursive: true })

    const process = spawn(ffmpegPath as string, [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-an',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-profile:v', 'baseline',
      '-pix_fmt', 'yuv420p',
      '-g', '30',
      '-f', 'hls',
      '-hls_time', '2',
      '-hls_list_size', '4',
      '-hls_flags', 'delete_segments+omit_endlist',
      join(dir, 'index.m3u8')
    ])

    process.stderr?.on('data', (chunk) => console.error(`[ffmpeg ${camera.name}]`, chunk.toString().trim()))

    this.streams.set(camera.id, { process, dir })

    const playlist = join(dir, 'index.m3u8')
    const ready = setInterval(() => {
      if (existsSync(playlist)) {
        clearInterval(ready)
        this.onStatus({ cameraId: camera.id, status: 'live', url: this.server.urlFor(camera.id) })
      }
    }, 500)

    process.on('exit', (code) => {
      clearInterval(ready)
      if (this.streams.has(camera.id) && code !== 0) {
        this.onStatus({ cameraId: camera.id, status: 'error', error: `ffmpeg exited (${code})` })
      }
    })

    return { cameraId: camera.id, status: 'connecting', url: this.server.urlFor(camera.id) }
  }

  async stop(id: string): Promise<void> {
    const active = this.streams.get(id)
    if (!active) return
    this.streams.delete(id)
    active.process.kill('SIGKILL')
    await rm(active.dir, { recursive: true, force: true })
    this.onStatus({ cameraId: id, status: 'idle' })
  }

  async restart(camera: Camera): Promise<StreamState> {
    await this.stop(camera.id)
    return this.start(camera)
  }

  async dispose(): Promise<void> {
    for (const id of [...this.streams.keys()]) await this.stop(id)
    this.server.stop()
  }
}
