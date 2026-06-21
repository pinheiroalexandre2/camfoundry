import { spawn } from 'child_process'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import type { Camera } from '@shared/types'
import { cameraStreamUrl } from '../onvif/device'
import { resolveFfmpegPath } from './ffmpeg'
import { logger } from '../logger'

// `source`, when given, is a local HLS playlist from the running stream, so we
// avoid opening a second connection to the camera. Otherwise we pull from RTSP.
export async function captureSnapshot(
  camera: Camera,
  dir: string,
  source?: string
): Promise<string> {
  const input = source ?? (await cameraStreamUrl(camera))
  await mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = join(dir, `${camera.name}-${stamp}.jpg`)

  const quiet = ['-hide_banner', '-loglevel', 'error', '-nostats']
  const args = source
    ? [...quiet, '-i', input, '-frames:v', '1', '-q:v', '2', '-an', '-y', file]
    : [...quiet, '-rtsp_transport', 'tcp', '-i', input, '-frames:v', '1', '-q:v', '2', '-an', '-y', file]

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(resolveFfmpegPath(), args)
    const timer = setTimeout(() => proc.kill('SIGKILL'), 20000)
    proc.stderr?.on('data', (c) => logger.error(`[snapshot ${camera.name}]`, c.toString().trim()))
    proc.on('error', reject)
    proc.on('exit', (code) => {
      clearTimeout(timer)
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited (${code})`))
    })
  })

  return file
}
