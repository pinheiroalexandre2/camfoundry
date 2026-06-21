import { useEffect, useState } from 'react'
import type { DiscoveredCamera } from '@shared/types'

interface Props {
  onPick: (camera: DiscoveredCamera) => void
}

export function DiscoveryPanel({ onPick }: Props) {
  const [results, setResults] = useState<DiscoveredCamera[]>([])
  const [scanning, setScanning] = useState(false)

  const discover = async (): Promise<void> => {
    setScanning(true)
    setResults([])
    try {
      setResults(await window.api.discover())
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => {
    discover()
  }, [])

  return (
    <div className="panel">
      <button onClick={discover} disabled={scanning}>
        {scanning ? 'Scanning…' : 'Rescan'}
      </button>

      <ul className="results">
        {scanning && (
          <li className="muted">
            <span className="spinner" /> Scanning network…
          </li>
        )}
        {results.map((camera) => (
          <li key={camera.host}>
            <div>
              <strong>{camera.name}</strong>
              <div className="muted">
                {camera.host} · {camera.manufacturer} {camera.model}
              </div>
            </div>
            <button onClick={() => onPick(camera)}>Add</button>
          </li>
        ))}
        {!scanning && results.length === 0 && <li className="muted">No results yet.</li>}
      </ul>
    </div>
  )
}
