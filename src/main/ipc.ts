import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { IpcChannel } from '@shared/types'
import type { Camera } from '@shared/types'
import type { CameraStorage } from './storage/storage'
import type { StreamManager } from './streams/streamManager'
import { discoverCameras } from './onvif/discovery'
import { forgetPtz, ptzCapabilities, ptzMove, ptzStop } from './onvif/ptz'
import { captureSnapshot } from './streams/snapshot'
import { debugEntries } from './debugLog'

// Chosen once per app session; reset on next launch so we prompt again.
let sessionSnapshotDir: string | null = null

async function resolveSnapshotDir(): Promise<string | null> {
  if (sessionSnapshotDir) return sessionSnapshotDir

  const options = {
    title: 'Choose where to save snapshots',
    defaultPath: join(app.getPath('pictures'), 'CamFoundry'),
    properties: ['openDirectory' as const, 'createDirectory' as const]
  }
  const window = BrowserWindow.getFocusedWindow()
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  if (result.canceled || !result.filePaths[0]) return null

  sessionSnapshotDir = result.filePaths[0]
  return sessionSnapshotDir
}

export function registerIpcHandlers(store: CameraStorage, streams: StreamManager): void {
  ipcMain.handle(IpcChannel.CamerasList, () => store.list())
  ipcMain.handle(IpcChannel.CamerasSave, (_e, camera: Camera) => {
    forgetPtz(camera.id)
    return store.save(camera)
  })
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

  ipcMain.handle(IpcChannel.Snapshot, async (_e, id: string) => {
    const camera = (await store.list()).find((c) => c.id === id)
    if (!camera) throw new Error('Camera not found')
    const dir = await resolveSnapshotDir()
    if (!dir) return null
    const file = await captureSnapshot(camera, dir, streams.playlistPath(id))
    shell.showItemInFolder(file)
    return file
  })

  const findCamera = async (id: string): Promise<Camera> => {
    const camera = (await store.list()).find((c) => c.id === id)
    if (!camera) throw new Error('Camera not found')
    return camera
  }

  ipcMain.handle(IpcChannel.PtzCaps, async (_e, id: string) => ptzCapabilities(await findCamera(id)))
  ipcMain.handle(IpcChannel.PtzMove, async (_e, id: string, x: number, y: number, zoom: number) =>
    ptzMove(await findCamera(id), x, y, zoom)
  )
  ipcMain.handle(IpcChannel.PtzStop, async (_e, id: string) => ptzStop(await findCamera(id)))

  ipcMain.handle(IpcChannel.DebugList, () => debugEntries())
}
