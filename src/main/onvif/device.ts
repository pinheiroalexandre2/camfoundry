import { URL } from 'url'
import { Cam } from 'onvif'
import type { Camera } from '@shared/types'
import { debugLog } from '../debugLog'

function withCredentials(uri: string, username = '', password = ''): string {
  const url = new URL(uri)
  if (username) url.username = encodeURIComponent(username)
  if (password) url.password = encodeURIComponent(password)
  return url.toString()
}

// Resolves the RTSP URL for a camera regardless of its source: a manual RTSP
// camera uses its URL directly, an ONVIF camera resolves it via the device.
export async function cameraStreamUrl(camera: Camera): Promise<string> {
  if (camera.source === 'rtsp') {
    if (!camera.rtspUrl) throw new Error('No RTSP URL set')
    return withCredentials(camera.rtspUrl, camera.username, camera.password)
  }
  return resolveRtspUrl(camera)
}

export function connectCam(camera: Camera): Promise<Cam> {
  const [hostname, port] = (camera.host ?? '').split(':')
  const secure = !!camera.useSecure
  const resolvedPort = port ? Number(port) : secure ? 443 : 80
  const target = `${secure ? 'https' : 'http'}://${hostname}:${resolvedPort}`
  debugLog('onvif', `Connecting to ${target}`)

  return new Promise((resolve, reject) => {
    const cam = new Cam(
      {
        hostname,
        port: resolvedPort,
        username: camera.username,
        password: camera.password,
        useSecure: secure,
        // Cameras almost universally ship self-signed certificates.
        secureOpts: secure ? { rejectUnauthorized: false } : undefined,
        timeout: 10000
      },
      (err) => {
        if (err) {
          debugLog('onvif', `Connect to ${target} failed`, String(err))
          return reject(err)
        }
        const profiles = (cam.profiles ?? []).map((p) => p.name ?? p.$?.token).join(', ')
        debugLog('onvif', `Connected to ${target}`, `Profiles: ${profiles || 'none'}`)
        resolve(cam)
      }
    )
  })
}

export async function resolveRtspUrl(camera: Camera): Promise<string> {
  const cam = await connectCam(camera)
  const profiles = cam.profiles ?? []
  const profile = camera.quality === 'sd' ? profiles[profiles.length - 1] : profiles[0]

  return new Promise((resolve, reject) => {
    cam.getStreamUri({ protocol: 'RTSP', profileToken: profile?.$?.token }, (uriErr, result) => {
      if (uriErr || !result?.uri) {
        debugLog('onvif', `GetStreamUri failed for ${camera.host}`, String(uriErr ?? 'No URI returned'))
        return reject(uriErr ?? new Error('No stream URI returned'))
      }
      debugLog('onvif', `GetStreamUri for ${camera.host}`, result.uri)
      resolve(withCredentials(result.uri, camera.username, camera.password))
    })
  })
}
