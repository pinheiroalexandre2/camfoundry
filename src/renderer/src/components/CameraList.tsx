import type { Camera, StreamState } from '@shared/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  cameras: Camera[]
  statuses: Record<string, StreamState>
  focusedId: string | null
  onSelect: (id: string | null) => void
}

export function CameraList({ cameras, statuses, focusedId, onSelect }: Props) {
  return (
    <div className="camera-list">
      <ul>
        {cameras.map((camera) => (
          <li
            key={camera.id}
            className={focusedId === camera.id ? 'active' : ''}
            onClick={() => onSelect(camera.id)}
          >
            <span>{camera.name}</span>
            <StatusBadge status={statuses[camera.id]?.status ?? 'idle'} />
          </li>
        ))}
      </ul>

      <button
        className={`list-all ${focusedId === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        ▦ All cameras
      </button>
    </div>
  )
}
