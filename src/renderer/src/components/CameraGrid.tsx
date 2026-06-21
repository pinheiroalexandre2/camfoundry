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
  onQuality: (camera: Camera, quality: StreamQuality) => void
  onSnapshot: (id: string) => Promise<string | null>
}

export function CameraGrid({
  cameras,
  statuses,
  onPlay,
  onPause,
  onRestart,
  onRemove,
  onQuality,
  onSnapshot
}: Props) {
  if (cameras.length === 0) {
    return <div className="empty">No cameras yet. Discover or add one to get started.</div>
  }

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${columnsFor(cameras.length)}, 1fr)` }}
    >
      {cameras.map((camera) => (
        <CameraCard
          key={camera.id}
          camera={camera}
          state={statuses[camera.id]}
          onPlay={onPlay}
          onPause={onPause}
          onRestart={onRestart}
          onRemove={onRemove}
          onQuality={onQuality}
          onSnapshot={onSnapshot}
        />
      ))}
    </div>
  )
}
