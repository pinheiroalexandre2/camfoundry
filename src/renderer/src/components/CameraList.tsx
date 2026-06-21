import { LayoutGrid, Link, Wifi } from 'lucide-react'
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
            <span className="cam-name">
              {camera.source === 'rtsp' ? (
                <Link size={13} aria-label="RTSP" />
              ) : (
                <Wifi size={13} aria-label="ONVIF" />
              )}
              {camera.name}
            </span>
            <StatusBadge status={statuses[camera.id]?.status ?? 'idle'} />
          </li>
        ))}
      </ul>

      <button
        className={`list-all ${focusedId === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <LayoutGrid size={14} /> All cameras
      </button>
    </div>
  )
}
