import { Cam } from 'onvif'
import type { Camera } from '@shared/types'
import { debugLog } from '../debugLog'
import { connectCam } from './device'

const cams = new Map<string, Cam>()

async function connect(camera: Camera): Promise<Cam> {
  const cached = cams.get(camera.id)
  if (cached) return cached

  const cam = await connectCam(camera)
  cams.set(camera.id, cam)
  return cam
}

export interface PtzCaps {
  pan: boolean
  zoom: boolean
}

export async function ptzCapabilities(camera: Camera): Promise<PtzCaps> {
  if (camera.source === 'rtsp' || !camera.host) return { pan: false, zoom: false }
  try {
    const cam = await connect(camera)
    if (!cam.activeSource?.ptz) return { pan: false, zoom: false }

    const nodes = await new Promise<Record<string, PtzNode>>((resolve, reject) => {
      cam.getNodes((err, n) => (err ? reject(err) : resolve(n)))
    })
    debugLog('ptz', `PTZ nodes for ${camera.host}`, JSON.stringify(nodes, null, 2))
    const zoom = Object.values(nodes ?? {}).some(
      (node) => node?.supportedPTZSpaces?.continuousZoomVelocitySpace
    )
    debugLog('ptz', `Capabilities for ${camera.host}: pan=true zoom=${zoom}`)
    return { pan: true, zoom }
  } catch (err) {
    debugLog('ptz', `Capability check failed for ${camera.host}`, String(err))
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

// Drop the cached connection so edited host/credentials take effect.
export function forgetPtz(id: string): void {
  cams.delete(id)
}

export function disposePtz(): void {
  cams.clear()
}
