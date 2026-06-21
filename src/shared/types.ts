export type StreamQuality = 'hd' | 'sd'

export interface Camera {
  id: string
  name: string
  host: string
  username: string
  password: string
  quality?: StreamQuality
}

export interface DiscoveredCamera {
  name: string
  host: string
  manufacturer: string
  model: string
  xaddr: string
}

export type StreamStatus = 'idle' | 'connecting' | 'live' | 'error'

export interface StreamState {
  cameraId: string
  status: StreamStatus
  url?: string
  error?: string
}

export const IpcChannel = {
  CamerasList: 'cameras:list',
  CamerasSave: 'cameras:save',
  CamerasDelete: 'cameras:delete',
  Discover: 'onvif:discover',
  StreamStart: 'stream:start',
  StreamStop: 'stream:stop',
  StreamRestart: 'stream:restart',
  StreamStatus: 'stream:status',
  Snapshot: 'stream:snapshot',
  PtzCaps: 'ptz:caps',
  PtzMove: 'ptz:move',
  PtzStop: 'ptz:stop'
} as const

export interface PtzCaps {
  pan: boolean
  zoom: boolean
}

export interface OnvifApi {
  listCameras: () => Promise<Camera[]>
  saveCamera: (camera: Camera) => Promise<Camera[]>
  deleteCamera: (id: string) => Promise<Camera[]>
  discover: () => Promise<DiscoveredCamera[]>
  startStream: (id: string) => Promise<StreamState>
  stopStream: (id: string) => Promise<void>
  restartStream: (id: string) => Promise<StreamState>
  snapshot: (id: string) => Promise<string | null>
  ptzCaps: (id: string) => Promise<PtzCaps>
  ptzMove: (id: string, x: number, y: number, zoom?: number) => Promise<void>
  ptzStop: (id: string) => Promise<void>
  onStreamStatus: (cb: (state: StreamState) => void) => () => void
}
