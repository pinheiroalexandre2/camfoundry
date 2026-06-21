import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Camera as CameraIcon, Pause, Play, RotateCw, Trash2, Volume2, VolumeX } from 'lucide-react'
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
  onSnapshot: (id: string) => Promise<string | null>
}

export function CameraCard({
  camera,
  state,
  onPlay,
  onPause,
  onRestart,
  onRemove,
  onQuality,
  onSnapshot
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [capturing, setCapturing] = useState(false)
  const [muted, setMuted] = useState(true)
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

  const overlay =
    status === 'error' ? (state?.error ?? 'Error') : status === 'idle' ? 'Paused' : 'Connecting…'

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{camera.name}</span>
        <StatusBadge status={status} />
      </div>

      <div className="card-video">
        <video ref={videoRef} playsInline />
        {status !== 'live' && <div className="card-overlay">{overlay}</div>}
        {capturing && (
          <div className="card-overlay">
            <span className="spinner" /> Capturing…
          </div>
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
            onClick={() => onRemove(camera.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
