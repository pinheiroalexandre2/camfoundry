import { ipcMain } from 'electron'
import { IpcChannel } from '@shared/types'
import type { Camera } from '@shared/types'
import type { CameraStorage } from './storage/storage'
import type { StreamManager } from './streams/streamManager'
import { discoverCameras } from './onvif/discovery'

export function registerIpcHandlers(store: CameraStorage, streams: StreamManager): void {
  ipcMain.handle(IpcChannel.CamerasList, () => store.list())
  ipcMain.handle(IpcChannel.CamerasSave, (_e, camera: Camera) => store.save(camera))
  ipcMain.handle(IpcChannel.CamerasDelete, (_e, id: string) => store.delete(id))

  ipcMain.handle(IpcChannel.Discover, () => discoverCameras())

  ipcMain.handle(IpcChannel.StreamStart, async (_e, id: string) => {
    const camera = (await store.list()).find((c) => c.id === id)
    if (!camera) throw new Error('Camera not found')
    return streams.start(camera)
  })

  ipcMain.handle(IpcChannel.StreamStop, (_e, id: string) => streams.stop(id))

  ipcMain.handle(IpcChannel.StreamRestart, async (_e, id: string) => {
    const camera = (await store.list()).find((c) => c.id === id)
    if (!camera) throw new Error('Camera not found')
    return streams.restart(camera)
  })
}
