import { URL } from 'url'
import { Discovery } from 'onvif'
import type { DiscoveredCamera } from '@shared/types'

function scopeValue(scopes: string[], key: string): string | undefined {
  const prefix = `onvif://www.onvif.org/${key}/`
  const match = scopes.find((s) => s.startsWith(prefix))
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined
}

function parseMatch(data: any): DiscoveredCamera | null {
  const match = data?.probeMatches?.probeMatch
  if (!match?.XAddrs) return null

  const xaddr = String(match.XAddrs).split(' ')[0]
  const scopes = String(match.scopes ?? '').split(' ').filter(Boolean)
  const url = new URL(xaddr)
  const host = url.port ? `${url.hostname}:${url.port}` : url.hostname

  return {
    xaddr,
    host,
    name: scopeValue(scopes, 'name') ?? host,
    manufacturer: scopeValue(scopes, 'mfr') ?? scopeValue(scopes, 'manufacturer') ?? 'Unknown',
    model: scopeValue(scopes, 'hardware') ?? 'Unknown'
  }
}

export function discoverCameras(timeout = 5000): Promise<DiscoveredCamera[]> {
  return new Promise((resolve) => {
    Discovery.probe({ resolve: false, timeout }, (_err, results) => {
      const cameras = new Map<string, DiscoveredCamera>()
      for (const item of results ?? []) {
        const camera = parseMatch(item)
        if (camera) cameras.set(camera.host, camera)
      }
      resolve([...cameras.values()])
    })
  })
}
