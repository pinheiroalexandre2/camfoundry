import { URL } from 'url'
import { Cam } from 'onvif'
import type { Camera } from '@shared/types'

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

export function resolveRtspUrl(camera: Camera): Promise<string> {
  const [hostname, port] = (camera.host ?? '').split(':')

  return new Promise((resolve, reject) => {
    const cam = new Cam(
      {
        hostname,
        port: port ? Number(port) : 80,
        username: camera.username,
        password: camera.password,
        timeout: 10000
      },
      (connectErr) => {
        if (connectErr) return reject(connectErr)

        const profiles = cam.profiles ?? []
        const profile = camera.quality === 'sd' ? profiles[profiles.length - 1] : profiles[0]

        cam.getStreamUri({ protocol: 'RTSP', profileToken: profile?.$?.token }, (uriErr, result) => {
          if (uriErr || !result?.uri) {
            return reject(uriErr ?? new Error('No stream URI returned'))
          }
          resolve(withCredentials(result.uri, camera.username, camera.password))
        })
      }
    )
  })
}
