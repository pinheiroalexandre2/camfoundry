import { useEffect, useRef, useState } from 'react'
import type { Camera, DiscoveredCamera } from '@shared/types'
import { useCameras } from './hooks/useCameras'
import { useStreamStatuses } from './hooks/useStreamStatuses'
import { DiscoveryPanel } from './components/DiscoveryPanel'
import { CameraForm } from './components/CameraForm'
import { CameraGrid } from './components/CameraGrid'

export default function App() {
  const { cameras, save, remove } = useCameras()
  const statuses = useStreamStatuses()
  const [prefill, setPrefill] = useState<DiscoveredCamera | null>(null)
  const started = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const camera of cameras) {
      if (!started.current.has(camera.id)) {
        started.current.add(camera.id)
        window.api.startStream(camera.id)
      }
    }
  }, [cameras])

  const handleSave = async (camera: Camera): Promise<void> => {
    await save(camera)
    setPrefill(null)
  }

  const handleRemove = async (id: string): Promise<void> => {
    started.current.delete(id)
    await remove(id)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>ONVIF Viewer</h1>
        <DiscoveryPanel onPick={setPrefill} />
        <CameraForm prefill={prefill} onSave={handleSave} />
      </aside>

      <main className="content">
        <CameraGrid
          cameras={cameras}
          statuses={statuses}
          onPlay={(id) => window.api.startStream(id)}
          onPause={(id) => window.api.stopStream(id)}
          onRestart={(id) => window.api.restartStream(id)}
          onRemove={handleRemove}
        />
      </main>
    </div>
  )
}
