import os from 'os'
import { URL } from 'url'
import { Discovery } from 'onvif'
import type { DiscoveredCamera } from '@shared/types'
import { debugLog } from '../debugLog'

// The Discovery emitter fires 'error' for any non-ONVIF reply to the multicast
// probe; without a listener Node turns that into an uncaught exception.
Discovery.on('error', (err) => {
  debugLog('discovery', 'Response error', String(err))
})

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

function externalIPv4Interfaces(): string[] {
  return Object.entries(os.networkInterfaces())
    .filter(([, addrs]) => addrs?.some((a) => a.family === 'IPv4' && !a.internal))
    .map(([name]) => name)
}

function probe(timeout: number, device?: string): Promise<unknown[]> {
  const where = device ?? 'default interface'
  debugLog('discovery', `Probing ${where}`)
  return new Promise((resolve) => {
    Discovery.probe({ resolve: false, timeout, device }, (err, results) => {
      // The lib reports errors and results together; junk replies from
      // non-ONVIF devices should not discard valid matches.
      if (err) debugLog('discovery', `Probe error on ${where}`, String(err))
      debugLog('discovery', `Probe on ${where} got ${results?.length ?? 0} matches`)
      resolve(results ?? [])
    })
  })
}

export async function discoverCameras(timeout = 5000): Promise<DiscoveredCamera[]> {
  // An unbound probe only multicasts on the default-route interface, so probe
  // each external IPv4 interface to reach cameras on other networks.
  const interfaces = externalIPv4Interfaces()
  const probes = interfaces.length
    ? interfaces.map((device) => probe(timeout, device))
    : [probe(timeout)]

  const results = (await Promise.all(probes)).flat()
  const cameras = new Map<string, DiscoveredCamera>()
  for (const item of results) {
    const camera = parseMatch(item)
    if (camera) {
      debugLog('discovery', `Match ${camera.host}`, JSON.stringify(item, null, 2))
      cameras.set(camera.host, camera)
    }
  }
  debugLog('discovery', `Scan finished: ${cameras.size} camera(s)`)
  return [...cameras.values()]
}
