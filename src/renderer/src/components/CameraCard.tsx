import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { Pause, Play, RotateCw, Trash2 } from 'lucide-react'
import type { Camera, StreamQuality, StreamState } from '@shared/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  camera: Camera
  state?: StreamState
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
  onQuality: (camera: Camera, quality: StreamQuality) => void
}

export function CameraCard({
  camera,
  state,
  onPlay,
  onPause,
  onRestart,
  onRemove,
  onQuality
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const status = state?.status ?? 'idle'
  const active = status === 'live' || status === 'connecting'
  const quality = camera.quality ?? 'hd'

  useEffect(() => {
    if (status !== 'live' || !state?.url || !videoRef.current) return
    const video = videoRef.current

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

  const overlay =
    status === 'error' ? (state?.error ?? 'Error') : status === 'idle' ? 'Paused' : 'Connecting…'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{camera.name}</span>
        <StatusBadge status={status} />
      </div>

      <div className="card-video">
        <video ref={videoRef} muted playsInline />
        {status !== 'live' && <div className="card-overlay">{overlay}</div>}
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
            onClick={() => onRemove(camera.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
