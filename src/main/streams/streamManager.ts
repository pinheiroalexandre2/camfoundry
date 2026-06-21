import { spawn, ChildProcess } from 'child_process'
import { mkdir, rm } from 'fs/promises'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import type { Camera, StreamState } from '@shared/types'
import { cameraStreamUrl } from '../onvif/device'
import { resolveFfmpegPath } from './ffmpeg'
import { logger } from '../logger'
import { HlsServer } from './hlsServer'

interface ActiveStream {
  process: ChildProcess
  dir: string
}

export class StreamManager {
  private rootDir = join(tmpdir(), 'camfoundry-streams')
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
      rtspUrl = await cameraStreamUrl(camera)
    } catch (err) {
      return this.fail(camera.id, (err as Error).message)
    }

    const dir = join(this.rootDir, camera.id)
    await mkdir(dir, { recursive: true })

    // Copy the camera's H.264/AAC streams straight through (low CPU, low
    // latency); only re-encode audio to AAC since HLS/hls.js requires it.
    const process = spawn(resolveFfmpegPath(), [
      '-hide_banner', '-loglevel', 'error', '-nostats',
      '-rtsp_transport', 'tcp',
      '-fflags', 'nobuffer',
      '-i', rtspUrl,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-f', 'hls',
      '-hls_time', '1',
      '-hls_list_size', '3',
      '-hls_flags', 'delete_segments+omit_endlist+independent_segments',
      join(dir, 'index.m3u8')
    ])

    process.stderr?.on('data', (chunk) => logger.error(`[ffmpeg ${camera.name}]`, chunk.toString().trim()))

    this.streams.set(camera.id, { process, dir })

    const playlist = join(dir, 'index.m3u8')
    const ready = setInterval(() => {
      // Only "live" once the playlist exists and a media segment is written.
      if (existsSync(playlist) && readdirSync(dir).some((f) => f.endsWith('.ts'))) {
        clearInterval(ready)
        this.onStatus({ cameraId: camera.id, status: 'live', url: this.server.urlFor(camera.id) })
      }
    }, 500)

    process.on('error', (err) => {
      clearInterval(ready)
      if (this.streams.has(camera.id)) this.fail(camera.id, err.message)
    })

    process.on('exit', (code) => {
      clearInterval(ready)
      if (this.streams.has(camera.id) && code !== 0) {
        this.fail(camera.id, `ffmpeg exited (${code})`)
      }
    })

    return { cameraId: camera.id, status: 'connecting', url: this.server.urlFor(camera.id) }
  }

  private fail(cameraId: string, error: string): StreamState {
    const state: StreamState = { cameraId, status: 'error', error }
    this.onStatus(state)
    return state
  }

  playlistPath(id: string): string | undefined {
    const active = this.streams.get(id)
    if (!active) return undefined
    const playlist = join(active.dir, 'index.m3u8')
    return existsSync(playlist) ? playlist : undefined
  }

  async stop(id: string): Promise<void> {
    const active = this.streams.get(id)
    if (!active) return
    this.streams.delete(id)
    await this.terminate(active.process)
    await rm(active.dir, { recursive: true, force: true })
    this.onStatus({ cameraId: id, status: 'idle' })
  }

  // SIGTERM first, force-kill if ffmpeg doesn't exit within 2s.
  private terminate(proc: ChildProcess): Promise<void> {
    if (proc.exitCode !== null || proc.signalCode !== null) return Promise.resolve()
    return new Promise((resolve) => {
      const force = setTimeout(() => proc.kill('SIGKILL'), 2000)
      proc.once('exit', () => {
        clearTimeout(force)
        resolve()
      })
      proc.kill('SIGTERM')
    })
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
