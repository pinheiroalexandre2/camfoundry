import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from '@shared/types'
import type { Camera, OnvifApi, StreamState } from '@shared/types'

const api: OnvifApi = {
  listCameras: () => ipcRenderer.invoke(IpcChannel.CamerasList),
  saveCamera: (camera: Camera) => ipcRenderer.invoke(IpcChannel.CamerasSave, camera),
  deleteCamera: (id: string) => ipcRenderer.invoke(IpcChannel.CamerasDelete, id),
  discover: () => ipcRenderer.invoke(IpcChannel.Discover),
  startStream: (id: string) => ipcRenderer.invoke(IpcChannel.StreamStart, id),
  stopStream: (id: string) => ipcRenderer.invoke(IpcChannel.StreamStop, id),
  restartStream: (id: string) => ipcRenderer.invoke(IpcChannel.StreamRestart, id),
  onStreamStatus: (cb: (state: StreamState) => void) => {
    const listener = (_e: unknown, state: StreamState): void => cb(state)
    ipcRenderer.on(IpcChannel.StreamStatus, listener)
    return () => ipcRenderer.removeListener(IpcChannel.StreamStatus, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
