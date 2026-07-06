import {
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { PtzZoomMode } from '@shared/types'

interface Props {
  cameraId: string
  pan: boolean
  zoomMode: PtzZoomMode
  onDigitalZoom: (direction: number) => void
}

export function PtzControls({ cameraId, pan, zoomMode, onDigitalZoom }: Props) {
  const move = (x: number, y: number) => ({
    onMouseDown: () => window.api.ptzMove(cameraId, x, y, 0),
    onMouseUp: () => window.api.ptzStop(cameraId),
    onMouseLeave: () => window.api.ptzStop(cameraId)
  })

  const zoom = (z: number) => {
    if (zoomMode === 'continuous') {
      return {
        title: `Optical zoom ${z > 0 ? 'in' : 'out'}`,
        onMouseDown: () => window.api.ptzMove(cameraId, 0, 0, z),
        onMouseUp: () => window.api.ptzStop(cameraId),
        onMouseLeave: () => window.api.ptzStop(cameraId)
      }
    }
    if (zoomMode === 'relative') {
      return {
        title: `Optical zoom ${z > 0 ? 'in' : 'out'} (step)`,
        onClick: () => window.api.ptzZoomStep(cameraId, z)
      }
    }
    return {
      title: `Digital zoom ${z > 0 ? 'in' : 'out'}`,
      onClick: () => onDigitalZoom(z)
    }
  }

  return (
    <div className="ptz">
      {pan && (
        <>
          <button className="ptz-btn up" title="Up" {...move(0, 1)}>
            <ChevronsUp size={18} />
          </button>
          <button className="ptz-btn left" title="Left" {...move(-1, 0)}>
            <ChevronsLeft size={18} />
          </button>
          <button className="ptz-btn right" title="Right" {...move(1, 0)}>
            <ChevronsRight size={18} />
          </button>
          <button className="ptz-btn down" title="Down" {...move(0, -1)}>
            <ChevronsDown size={18} />
          </button>
        </>
      )}

      <button className="ptz-btn zoom-in" {...zoom(1)}>
        <ZoomIn size={18} />
      </button>
      <button className="ptz-btn zoom-out" {...zoom(-1)}>
        <ZoomOut size={18} />
      </button>
      {zoomMode === 'none' && <span className="ptz-zoom-label">digital</span>}
    </div>
  )
}
