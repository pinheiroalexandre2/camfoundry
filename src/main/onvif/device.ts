import { URL } from 'url'
import { Cam } from 'onvif'
import type { Camera } from '@shared/types'

function withCredentials(uri: string, username: string, password: string): string {
  const url = new URL(uri)
  url.username = encodeURIComponent(username)
  url.password = encodeURIComponent(password)
  return url.toString()
}

export function resolveRtspUrl(camera: Camera): Promise<string> {
  const [hostname, port] = camera.host.split(':')

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

        cam.getStreamUri({ protocol: 'RTSP' }, (uriErr, result) => {
          if (uriErr || !result?.uri) {
            return reject(uriErr ?? new Error('No stream URI returned'))
          }
          resolve(withCredentials(result.uri, camera.username, camera.password))
        })
      }
    )
  })
}
