import { Cam } from 'onvif'
import type { Camera } from '@shared/types'

const cams = new Map<string, Cam>()

function connect(camera: Camera): Promise<Cam> {
  const cached = cams.get(camera.id)
  if (cached) return Promise.resolve(cached)

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
      (err) => {
        if (err) return reject(err)
        cams.set(camera.id, cam)
        resolve(cam)
      }
    )
  })
}

export interface PtzCaps {
  pan: boolean
  zoom: boolean
}

export async function ptzCapabilities(camera: Camera): Promise<PtzCaps> {
  try {
    const cam = await connect(camera)
    if (!cam.activeSource?.ptz) return { pan: false, zoom: false }

    const nodes = await new Promise<Record<string, PtzNode>>((resolve, reject) => {
      cam.getNodes((err, n) => (err ? reject(err) : resolve(n)))
    })
    const zoom = Object.values(nodes ?? {}).some(
      (node) => node?.supportedPTZSpaces?.continuousZoomVelocitySpace
    )
    return { pan: true, zoom }
  } catch {
    return { pan: false, zoom: false }
  }
}

interface PtzNode {
  supportedPTZSpaces?: { continuousZoomVelocitySpace?: unknown }
}

export async function ptzMove(camera: Camera, x: number, y: number, zoom = 0): Promise<void> {
  const cam = await connect(camera)
  await new Promise<void>((resolve, reject) => {
    cam.continuousMove({ x, y, zoom }, (err) => (err ? reject(err) : resolve()))
  })
}

export async function ptzStop(camera: Camera): Promise<void> {
  const cam = await connect(camera)
  await new Promise<void>((resolve) => {
    cam.stop({ panTilt: true, zoom: true }, () => resolve())
  })
}
