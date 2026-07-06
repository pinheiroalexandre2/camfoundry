import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel } from '@shared/types'
import type { Camera, DebugEntry, MenuAction, OnvifApi, StreamState } from '@shared/types'

const api: OnvifApi = {
  listCameras: () => ipcRenderer.invoke(IpcChannel.CamerasList),
  saveCamera: (camera: Camera) => ipcRenderer.invoke(IpcChannel.CamerasSave, camera),
  deleteCamera: (id: string) => ipcRenderer.invoke(IpcChannel.CamerasDelete, id),
  discover: () => ipcRenderer.invoke(IpcChannel.Discover),
  startStream: (id: string) => ipcRenderer.invoke(IpcChannel.StreamStart, id),
  stopStream: (id: string) => ipcRenderer.invoke(IpcChannel.StreamStop, id),
  restartStream: (id: string) => ipcRenderer.invoke(IpcChannel.StreamRestart, id),
  snapshot: (id: string) => ipcRenderer.invoke(IpcChannel.Snapshot, id),
  ptzCaps: (id: string) => ipcRenderer.invoke(IpcChannel.PtzCaps, id),
  ptzMove: (id: string, x: number, y: number, zoom = 0) =>
    ipcRenderer.invoke(IpcChannel.PtzMove, id, x, y, zoom),
  ptzStop: (id: string) => ipcRenderer.invoke(IpcChannel.PtzStop, id),
  onStreamStatus: (cb: (state: StreamState) => void) => {
    const listener = (_e: unknown, state: StreamState): void => cb(state)
    ipcRenderer.on(IpcChannel.StreamStatus, listener)
    return () => ipcRenderer.removeListener(IpcChannel.StreamStatus, listener)
  },
  onMenuAction: (cb: (action: MenuAction) => void) => {
    const listener = (_e: unknown, action: MenuAction): void => cb(action)
    ipcRenderer.on(IpcChannel.MenuAction, listener)
    return () => ipcRenderer.removeListener(IpcChannel.MenuAction, listener)
  },
  debugEntries: () => ipcRenderer.invoke(IpcChannel.DebugList),
  onDebugEntry: (cb: (entry: DebugEntry) => void) => {
    const listener = (_e: unknown, entry: DebugEntry): void => cb(entry)
    ipcRenderer.on(IpcChannel.DebugEntry, listener)
    return () => ipcRenderer.removeListener(IpcChannel.DebugEntry, listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
