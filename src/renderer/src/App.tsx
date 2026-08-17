import { useEffect, useRef, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, Play } from 'lucide-react'
import type { Camera, StreamQuality } from '@shared/types'
import { useCameras } from './hooks/useCameras'
import { useStreamStatuses } from './hooks/useStreamStatuses'
import { CameraGrid } from './components/CameraGrid'
import { CameraList } from './components/CameraList'
import { CameraCard } from './components/CameraCard'
import { AddCameraModal } from './components/AddCameraModal'
import { DebugPanel } from './components/DebugPanel'

export default function App() {
  const { cameras, save, remove } = useCameras()
  const statuses = useStreamStatuses()
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [modal, setModal] = useState<{ editing?: Camera } | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const camerasRef = useRef(cameras)
  camerasRef.current = cameras

  const focusedIdRef = useRef(focusedId)
  focusedIdRef.current = focusedId

  // Native menu items dispatch here so they reuse the same in-app actions.
  useEffect(() => {
    return window.api.onMenuAction((action) => {
      if (action === 'add-camera') setModal({})
      else if (action === 'debug-log') setShowDebug((prev) => !prev)
      else if (action === 'snapshot' && focusedIdRef.current) {
        window.api.snapshot(focusedIdRef.current)
      }
    })
  }, [])

  // Single view keeps only the focused camera streaming; everything else stops.
  useEffect(() => {
    if (focusedId === null) return
    for (const camera of camerasRef.current) {
      if (camera.id === focusedId) window.api.startStream(camera.id)
      else window.api.stopStream(camera.id)
    }
  }, [focusedId])

  // Save errors propagate to the form so the modal stays open and shows them.
  const handleSave = async (camera: Camera): Promise<void> => {
    const isEdit = cameras.some((c) => c.id === camera.id)
    await save(camera)
    setModal(null)
    const status = statuses[camera.id]?.status
    if (isEdit && (status === 'live' || status === 'connecting')) {
      await window.api.restartStream(camera.id)
    }
  }

  const handleRemove = async (id: string): Promise<void> => {
    if (focusedId === id) setFocusedId(null)
    await remove(id)
  }

  const handleQuality = async (camera: Camera, quality: StreamQuality): Promise<void> => {
    await save({ ...camera, quality })
    await window.api.restartStream(camera.id)
  }

  // Single view only streams the focused camera, so starting everything
  // implies switching back to the grid.
  const handleStartAll = (): void => {
    setFocusedId(null)
    for (const camera of cameras) {
      const status = statuses[camera.id]?.status
      if (status !== 'live' && status !== 'connecting') {
        void window.api.startStream(camera.id)
      }
    }
  }

  const cardHandlers = {
    onPlay: (id: string) => window.api.startStream(id),
    onPause: (id: string) => window.api.stopStream(id),
    onRestart: (id: string) => window.api.restartStream(id),
    onRemove: handleRemove,
    onEdit: (camera: Camera) => setModal({ editing: camera }),
    onQuality: handleQuality,
    onSnapshot: (id: string) => window.api.snapshot(id)
  }

  const focused = cameras.find((c) => c.id === focusedId) ?? null

  return (
    <div className="app">
      <div className="app-main">
        {sidebarOpen ? (
          <aside className="sidebar">
            <div className="sidebar-header">
              <h1>CamFoundry</h1>
              <button
                className="icon-btn"
                title="Collapse sidebar"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            <CameraList
              cameras={cameras}
              statuses={statuses}
              focusedId={focusedId}
              onSelect={setFocusedId}
            />
            <button className="toggle" onClick={handleStartAll} disabled={cameras.length === 0}>
              <Play size={14} /> Start all
            </button>
            <button className="toggle" onClick={() => setModal({})}>
              ＋ Add camera
            </button>
          </aside>
        ) : (
          <div className="sidebar-rail">
            <button
              className="icon-btn"
              title="Expand sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}

        <main className="content">
          {focused ? (
            <div className="single">
              <CameraCard camera={focused} state={statuses[focused.id]} focused {...cardHandlers} />
            </div>
          ) : (
            <CameraGrid cameras={cameras} statuses={statuses} {...cardHandlers} />
          )}
        </main>
      </div>

      {showDebug && <DebugPanel onClose={() => setShowDebug(false)} />}

      {modal && (
        <AddCameraModal editing={modal.editing} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  )
}
