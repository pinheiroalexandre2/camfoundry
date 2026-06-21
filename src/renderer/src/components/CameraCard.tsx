import { useEffect, useRef, useState, type MouseEvent } from 'react'
import Hls from 'hls.js'
import { Camera as CameraIcon, Pause, Play, RotateCw, Trash2, Volume2, VolumeX } from 'lucide-react'
import type { Camera, PtzCaps, StreamQuality, StreamState } from '@shared/types'
import { StatusBadge } from './StatusBadge'
import { PtzControls } from './PtzControls'

interface Props {
  camera: Camera
  state?: StreamState
  focused?: boolean
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
  onQuality: (camera: Camera, quality: StreamQuality) => void
  onSnapshot: (id: string) => Promise<string | null>
}

export function CameraCard({
  camera,
  state,
  focused,
  onPlay,
  onPause,
  onRestart,
  onRemove,
  onQuality,
  onSnapshot
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const dragRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [muted, setMuted] = useState(true)
  const [caps, setCaps] = useState<PtzCaps>({ pan: false, zoom: false })
  const [digitalZoom, setDigitalZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const status = state?.status ?? 'idle'
  const active = status === 'live' || status === 'connecting'
  const quality = camera.quality ?? 'hd'

  const snapshot = async (): Promise<void> => {
    setCapturing(true)
    try {
      await onSnapshot(camera.id)
    } finally {
      setCapturing(false)
    }
  }

  const clampPan = (x: number, y: number, zoom: number): { x: number; y: number } => {
    const v = videoRef.current
    const maxX = v ? ((zoom - 1) * v.clientWidth) / 2 : 0
    const maxY = v ? ((zoom - 1) * v.clientHeight) / 2 : 0
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }

  const changeZoom = (direction: number): void => {
    const next = Math.min(4, Math.max(1, digitalZoom + direction * 0.25))
    setDigitalZoom(next)
    setPan((p) => clampPan(p.x, p.y, next))
  }

  const onDragStart = (e: MouseEvent): void => {
    if (digitalZoom <= 1) return
    e.preventDefault()
    dragRef.current = { x: pan.x, y: pan.y, sx: e.clientX, sy: e.clientY }
  }

  const onDragMove = (e: MouseEvent): void => {
    if (!dragRef.current) return
    const next = clampPan(
      dragRef.current.x + (e.clientX - dragRef.current.sx),
      dragRef.current.y + (e.clientY - dragRef.current.sy),
      digitalZoom
    )
    setPan(next)
  }

  const endDrag = (): void => {
    dragRef.current = null
  }

  useEffect(() => {
    if (status !== 'live' || !state?.url || !videoRef.current) return
    const video = videoRef.current
    video.muted = muted

    if (Hls.isSupported()) {
      const hls = new Hls({ liveDurationInfinity: true })
      hls.loadSource(state.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
      return () => hls.destroy()
    }

    video.src = state.url
    video.play().catch(() => {})
  }, [status, state?.url])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  useEffect(() => {
    setDigitalZoom(1)
    setPan({ x: 0, y: 0 })
    if (!focused) {
      setCaps({ pan: false, zoom: false })
      return
    }
    let on = true
    window.api.ptzCaps(camera.id).then((c) => on && setCaps(c))
    return () => {
      on = false
    }
  }, [focused, camera.id])

  const overlay =
    status === 'error' ? (state?.error ?? 'Error') : status === 'idle' ? 'Paused' : 'Connecting…'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{camera.name}</span>
        <StatusBadge status={status} />
      </div>

      <div className="card-video">
        <video
          ref={videoRef}
          playsInline
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${digitalZoom})`,
            cursor: digitalZoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'default'
          }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        />
        {status !== 'live' && <div className="card-overlay">{overlay}</div>}
        {capturing && (
          <div className="card-overlay">
            <span className="spinner" /> Capturing…
          </div>
        )}
        {focused && status === 'live' && (
          <PtzControls
            cameraId={camera.id}
            pan={caps.pan}
            zoomReal={caps.zoom}
            onDigitalZoom={changeZoom}
          />
        )}
      </div>

      <div className="card-actions">
        <span className="card-host">{camera.host}</span>
        <div className="card-buttons">
          <button
            className="icon-btn quality"
            title="Toggle quality"
            onClick={() => onQuality(camera, quality === 'hd' ? 'sd' : 'hd')}
          >
            {quality.toUpperCase()}
          </button>
          <button className="icon-btn" title="Snapshot" onClick={snapshot} disabled={capturing}>
            <CameraIcon size={16} />
          </button>
          <button
            className="icon-btn"
            title={muted ? 'Unmute' : 'Mute'}
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {active ? (
            <>
              <button className="icon-btn" title="Pause" onClick={() => onPause(camera.id)}>
                <Pause size={16} />
              </button>
              <button className="icon-btn" title="Restart" onClick={() => onRestart(camera.id)}>
                <RotateCw size={16} />
              </button>
            </>
          ) : (
            <button className="icon-btn" title="Play" onClick={() => onPlay(camera.id)}>
              <Play size={16} />
            </button>
          )}
          <button
            className="icon-btn danger"
            title="Remove"
            onClick={() => {
              if (window.confirm(`Remove ${camera.name}?`)) onRemove(camera.id)
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
