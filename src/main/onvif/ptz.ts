import { Cam } from 'onvif'
import type { Camera, PtzCaps, PtzZoomMode } from '@shared/types'
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

export async function ptzCapabilities(camera: Camera): Promise<PtzCaps> {
  if (camera.source === 'rtsp' || !camera.host) return { pan: false, zoom: 'none' }
  try {
    const cam = await connect(camera)
    const nodes = await new Promise<Record<string, PtzNode>>((resolve, reject) => {
      cam.getNodes((err, n) => (err ? reject(err) : resolve(n)))
    })
    debugLog('ptz', `PTZ nodes for ${camera.host}`, JSON.stringify(nodes, null, 2))

    // Varifocal cameras often expose zoom without pan/tilt, so zoom is not
    // gated on activeSource.ptz like pan is.
    const spaces = Object.values(nodes ?? {})
      .map((node) => node?.supportedPTZSpaces)
      .filter((s): s is NonNullable<typeof s> => !!s)
    const zoom: PtzZoomMode = spaces.some((s) => s.continuousZoomVelocitySpace)
      ? 'continuous'
      : spaces.some((s) => s.relativeZoomTranslationSpace)
        ? 'relative'
        : 'none'
    const pan = !!cam.activeSource?.ptz

    debugLog('ptz', `Capabilities for ${camera.host}: pan=${pan} zoom=${zoom}`)
    return { pan, zoom }
  } catch (err) {
    debugLog('ptz', `Capability check failed for ${camera.host}`, String(err))
    return { pan: false, zoom: 'none' }
  }
}

interface PtzNode {
  supportedPTZSpaces?: {
    continuousZoomVelocitySpace?: unknown
    relativeZoomTranslationSpace?: unknown
    absoluteZoomPositionSpace?: unknown
  }
}

export async function ptzMove(camera: Camera, x: number, y: number, zoom = 0): Promise<void> {
  const cam = await connect(camera)
  await new Promise<void>((resolve, reject) => {
    cam.continuousMove({ x, y, zoom }, (err) => (err ? reject(err) : resolve()))
  })
}

export async function ptzZoomStep(camera: Camera, direction: number): Promise<void> {
  const cam = await connect(camera)
  await new Promise<void>((resolve, reject) => {
    cam.relativeMove({ zoom: Math.sign(direction) * 0.1 }, (err) => {
      if (err) {
        debugLog('ptz', `Zoom step failed for ${camera.host}`, String(err))
        return reject(err)
      }
      resolve()
    })
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
