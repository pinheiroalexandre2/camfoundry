import {
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

interface Props {
  cameraId: string
  pan: boolean
  zoomReal: boolean
  onDigitalZoom: (direction: number) => void
}

export function PtzControls({ cameraId, pan, zoomReal, onDigitalZoom }: Props) {
  const move = (x: number, y: number) => ({
    onMouseDown: () => window.api.ptzMove(cameraId, x, y, 0),
    onMouseUp: () => window.api.ptzStop(cameraId),
    onMouseLeave: () => window.api.ptzStop(cameraId)
  })

  const zoom = (z: number) =>
    zoomReal
      ? {
          onMouseDown: () => window.api.ptzMove(cameraId, 0, 0, z),
          onMouseUp: () => window.api.ptzStop(cameraId),
          onMouseLeave: () => window.api.ptzStop(cameraId)
        }
      : { onClick: () => onDigitalZoom(z) }

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

      <button className="ptz-btn zoom-in" title="Zoom in" {...zoom(1)}>
        <ZoomIn size={18} />
      </button>
      <button className="ptz-btn zoom-out" title="Zoom out" {...zoom(-1)}>
        <ZoomOut size={18} />
      </button>
    </div>
  )
}
