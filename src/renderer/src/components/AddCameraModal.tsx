import { useState } from 'react'
import type { Camera, DiscoveredCamera } from '@shared/types'
import { DiscoveryPanel } from './DiscoveryPanel'
import { CameraForm } from './CameraForm'

interface Props {
  editing?: Camera
  onClose: () => void
  onSave: (camera: Camera) => Promise<void>
}

export function AddCameraModal({ editing, onClose, onSave }: Props) {
  const [prefill, setPrefill] = useState<DiscoveredCamera | null>(null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editing ? 'Edit Camera' : 'Add Camera'}</h2>
          <button className="close" onClick={onClose}>
            ✕
          </button>
        </div>
        {!editing && <DiscoveryPanel onPick={setPrefill} />}
        <CameraForm prefill={prefill} camera={editing} onSave={onSave} />
      </div>
    </div>
  )
}
