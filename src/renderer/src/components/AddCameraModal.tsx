import { useState } from 'react'
import type { Camera, DiscoveredCamera } from '@shared/types'
import { DiscoveryPanel } from './DiscoveryPanel'
import { CameraForm } from './CameraForm'

interface Props {
  onClose: () => void
  onSave: (camera: Camera) => Promise<void>
}

export function AddCameraModal({ onClose, onSave }: Props) {
  const [prefill, setPrefill] = useState<DiscoveredCamera | null>(null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Camera</h2>
          <button className="close" onClick={onClose}>
            ✕
          </button>
        </div>
        <DiscoveryPanel onPick={setPrefill} />
        <CameraForm prefill={prefill} onSave={onSave} />
      </div>
    </div>
  )
}
