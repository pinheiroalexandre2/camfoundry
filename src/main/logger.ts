import log from 'electron-log/main'

log.initialize()
log.transports.file.level = 'info'
log.transports.console.level = process.env.ELECTRON_RENDERER_URL ? 'debug' : false

export const logger = log
