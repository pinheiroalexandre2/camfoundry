import { app } from 'electron'
import { existsSync } from 'fs'
import ffmpegStatic from 'ffmpeg-static'

let cached: string | null = null

export function resolveFfmpegPath(): string {
  if (cached) return cached
  if (!ffmpegStatic) throw new Error('ffmpeg-static did not resolve a binary path')

  // Packaged builds unpack the binary out of the asar (see electron-builder.yml).
  const path = app.isPackaged
    ? ffmpegStatic.replace('app.asar', 'app.asar.unpacked')
    : ffmpegStatic

  if (!existsSync(path)) throw new Error(`FFmpeg binary not found at ${path}`)

  cached = path
  return path
}
