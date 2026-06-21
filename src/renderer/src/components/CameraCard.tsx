import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import type { Camera, StreamState } from '@shared/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  camera: Camera
  state?: StreamState
  onPlay: (id: string) => void
  onPause: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
}

export function CameraCard({ camera, state, onPlay, onPause, onRestart, onRemove }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const status = state?.status ?? 'idle'
  const active = status === 'live' || status === 'connecting'

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
        <div>
          {active ? (
            <>
              <button onClick={() => onPause(camera.id)}>Pause</button>
              <button onClick={() => onRestart(camera.id)}>Restart</button>
            </>
          ) : (
            <button onClick={() => onPlay(camera.id)}>Play</button>
          )}
          <button className="danger" onClick={() => onRemove(camera.id)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
