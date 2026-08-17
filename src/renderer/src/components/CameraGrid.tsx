import { useState } from 'react'
import type { Camera, StreamQuality, StreamState } from '@shared/types'
import { CameraCard } from './CameraCard'

function columnsFor(count: number): number {
  if (count <= 1) return 1
  if (count <= 4) return 2
  if (count <= 9) return 3
  return Math.ceil(Math.sqrt(count))
}

interface Props {
  cameras: Camera[]
  statuses: Record<string, StreamState>
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (camera: Camera) => void
  onQuality: (camera: Camera, quality: StreamQuality) => void
  onSnapshot: (id: string) => Promise<string | null>
  onReorder: (ids: string[]) => void
}

export function CameraGrid({
  cameras,
  statuses,
  onPlay,
  onPause,
  onRestart,
  onRemove,
  onEdit,
  onQuality,
  onSnapshot,
  onReorder
}: Props) {
  // A tile only becomes draggable while its grip handle is held, so dragging
  // never competes with the card buttons or the digital-zoom pan.
  const [armedId, setArmedId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const endDrag = (): void => {
    setArmedId(null)
    setDragId(null)
    setOverId(null)
  }

  const drop = (targetId: string): void => {
    if (dragId && dragId !== targetId) {
      const ids = cameras.map((c) => c.id)
      // Target index is taken before removing the dragged id, so dragging down
      // lands after the target and dragging up lands before it.
      const to = ids.indexOf(targetId)
      const [moved] = ids.splice(ids.indexOf(dragId), 1)
      ids.splice(to, 0, moved)
      onReorder(ids)
    }
    endDrag()
  }

  if (cameras.length === 0) {
    return <div className="empty">No cameras yet. Discover or add one to get started.</div>
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${columnsFor(cameras.length)}, 1fr)` }}
    >
      {cameras.map((camera) => (
        <div
          key={camera.id}
          className={`grid-item${dragId === camera.id ? ' dragging' : ''}${
            overId === camera.id ? ' drag-over' : ''
          }`}
          draggable={armedId === camera.id}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move'
            setDragId(camera.id)
          }}
          onDragEnd={endDrag}
          onDragOver={(e) => {
            if (!dragId) return
            e.preventDefault()
            setOverId(camera.id)
          }}
          onDragLeave={() => setOverId((prev) => (prev === camera.id ? null : prev))}
          onDrop={(e) => {
            e.preventDefault()
            drop(camera.id)
          }}
        >
          <CameraCard
            camera={camera}
            state={statuses[camera.id]}
            onPlay={onPlay}
            onPause={onPause}
            onRestart={onRestart}
            onRemove={onRemove}
            onEdit={onEdit}
            onQuality={onQuality}
            onSnapshot={onSnapshot}
            onDragHandleDown={() => setArmedId(camera.id)}
          />
        </div>
      ))}
    </div>
  )
}
