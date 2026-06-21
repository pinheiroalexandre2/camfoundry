import { BrowserWindow, Menu, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { IpcChannel } from '@shared/types'
import type { MenuAction } from '@shared/types'

const REPO_URL = 'https://github.com/camfoundry/camfoundry'

function send(action: MenuAction): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IpcChannel.MenuAction, action)
}

export function buildAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const isDev = !!process.env.ELECTRON_RENDERER_URL

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'Camera',
      submenu: [
        { label: 'Add Camera…', accelerator: 'CmdOrCtrl+N', click: () => send('add-camera') },
        { label: 'Capture Snapshot', accelerator: 'CmdOrCtrl+S', click: () => send('snapshot') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        ...(isDev
          ? ([{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }, { type: 'separator' }] as MenuItemConstructorOptions[])
          : []),
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [{ label: 'CamFoundry on GitHub', click: () => shell.openExternal(REPO_URL) }]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
