import { useEffect, useRef, useState } from 'react'
import type { Camera, StreamQuality } from '@shared/types'
import { useCameras } from './hooks/useCameras'
import { useStreamStatuses } from './hooks/useStreamStatuses'
import { CameraGrid } from './components/CameraGrid'
import { CameraList } from './components/CameraList'
import { CameraCard } from './components/CameraCard'
import { AddCameraModal } from './components/AddCameraModal'

export default function App() {
  const { cameras, save, remove } = useCameras()
  const statuses = useStreamStatuses()
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const camerasRef = useRef(cameras)
  camerasRef.current = cameras

  // Single view keeps only the focused camera streaming; everything else stops.
  useEffect(() => {
    if (focusedId === null) return
    for (const camera of camerasRef.current) {
      if (camera.id === focusedId) window.api.startStream(camera.id)
      else window.api.stopStream(camera.id)
    }
  }, [focusedId])

  const handleSave = async (camera: Camera): Promise<void> => {
    const existing = cameras.find(
      (c) =>
        (camera.host && c.host === camera.host) || (camera.rtspUrl && c.rtspUrl === camera.rtspUrl)
    )
    await save(existing ? { ...camera, id: existing.id } : camera)
    setShowAdd(false)
    if (existing && focusedId === existing.id) await window.api.restartStream(existing.id)
  }

  const handleRemove = async (id: string): Promise<void> => {
    if (focusedId === id) setFocusedId(null)
    await remove(id)
  }

  const handleQuality = async (camera: Camera, quality: StreamQuality): Promise<void> => {
    await save({ ...camera, quality })
    await window.api.restartStream(camera.id)
  }

  const cardHandlers = {
    onPlay: (id: string) => window.api.startStream(id),
    onPause: (id: string) => window.api.stopStream(id),
    onRestart: (id: string) => window.api.restartStream(id),
    onRemove: handleRemove,
    onQuality: handleQuality,
    onSnapshot: (id: string) => window.api.snapshot(id)
  }

  const focused = cameras.find((c) => c.id === focusedId) ?? null

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>CamFoundry</h1>
        <CameraList
          cameras={cameras}
          statuses={statuses}
          focusedId={focusedId}
          onSelect={setFocusedId}
        />
        <button className="toggle" onClick={() => setShowAdd(true)}>
          ＋ Add camera
        </button>
      </aside>

      <main className="content">
        {focused ? (
          <div className="single">
            <CameraCard camera={focused} state={statuses[focused.id]} focused {...cardHandlers} />
          </div>
        ) : (
          <CameraGrid cameras={cameras} statuses={statuses} {...cardHandlers} />
        )}
      </main>

      {showAdd && <AddCameraModal onClose={() => setShowAdd(false)} onSave={handleSave} />}
    </div>
  )
}
