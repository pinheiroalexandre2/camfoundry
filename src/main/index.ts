import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { IpcChannel } from '@shared/types'
import type { StreamState } from '@shared/types'
import { JsonStore } from './storage/jsonStore'
import { StreamManager } from './streams/streamManager'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

function broadcastStatus(state: StreamState): void {
  mainWindow?.webContents.send(IpcChannel.StreamStatus, state)
}

const store = new JsonStore()
const streams = new StreamManager(broadcastStatus)

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => (mainWindow = null))

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await streams.init()
  registerIpcHandlers(store, streams)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  await streams.dispose()
})
