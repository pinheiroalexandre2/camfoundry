import { createServer, Server } from 'http'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join, normalize } from 'path'

const CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t'
}

export class HlsServer {
  private server: Server
  private port = 0

  constructor(private rootDir: string) {
    this.server = createServer((req, res) => {
      const relative = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]))
      const filePath = join(this.rootDir, relative)

      if (!filePath.startsWith(this.rootDir)) {
        res.writeHead(403).end()
        return
      }

      stat(filePath)
        .then((info) => {
          if (!info.isFile()) throw new Error('not a file')
          const ext = relative.slice(relative.lastIndexOf('.'))
          res.writeHead(200, {
            'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
          })
          createReadStream(filePath).pipe(res)
        })
        .catch(() => res.writeHead(404).end())
    })
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server.address()
        if (address && typeof address === 'object') this.port = address.port
        resolve()
      })
    })
  }

  urlFor(cameraId: string): string {
    return `http://127.0.0.1:${this.port}/${cameraId}/index.m3u8`
  }

  stop(): void {
    this.server.close()
  }
}
