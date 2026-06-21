import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { IpcChannel } from '@shared/types'
import type { StreamState } from '@shared/types'
import { JsonStore } from './storage/jsonStore'
import { StreamManager } from './streams/streamManager'
import { registerIpcHandlers } from './ipc'
import { buildAppMenu } from './menu'
import { disposePtz } from './onvif/ptz'
import { logger } from './logger'

let mainWindow: BrowserWindow | null = null

function broadcastStatus(state: StreamState): void {
  mainWindow?.webContents.send(IpcChannel.StreamStatus, state)
}

const store = new JsonStore()
const streams = new StreamManager(broadcastStatus)

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err)
  dialog.showErrorBox('CamFoundry error', err.message)
})
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', reason)
})

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'CamFoundry',
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
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

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(async () => {
    app.setName('CamFoundry')

    try {
      await streams.init()
    } catch (err) {
      logger.error('stream init failed', err)
      dialog.showErrorBox(
        'CamFoundry could not start',
        `Failed to start the local stream server.\n\n${(err as Error).message}`
      )
      app.quit()
      return
    }

    registerIpcHandlers(store, streams)
    buildAppMenu()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async (event) => {
  event.preventDefault()
  // Bound the wait so a hung ffmpeg child can't block quit.
  await Promise.race([streams.dispose(), new Promise((r) => setTimeout(r, 4000))])
  disposePtz()
  app.exit(0)
})
