import { BrowserWindow } from 'electron'
import { IpcChannel } from '@shared/types'
import type { DebugEntry } from '@shared/types'
import { logger } from './logger'

const MAX_ENTRIES = 500

const entries: DebugEntry[] = []

export function debugLog(scope: string, message: string, detail?: string): void {
  const entry: DebugEntry = { ts: Date.now(), scope, message, detail }
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) entries.shift()

  logger.info(`[${scope}] ${message}${detail ? ` — ${detail}` : ''}`)
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannel.DebugEntry, entry)
  }
}

export function debugEntries(): DebugEntry[] {
  return [...entries]
}
