import { useEffect, useState } from 'react'
import type { Camera, DiscoveredCamera, StreamSource } from '@shared/types'

interface Props {
  prefill: DiscoveredCamera | null
  onSave: (camera: Camera) => void
}

export function CameraForm({ prefill, onSave }: Props) {
  const [source, setSource] = useState<StreamSource>('onvif')
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rtspUrl, setRtspUrl] = useState('')

  useEffect(() => {
    if (prefill) {
      setSource('onvif')
      setName(prefill.name)
      setHost(prefill.host)
    }
  }, [prefill])

  const reset = (): void => {
    setName('')
    setHost('')
    setUsername('')
    setPassword('')
    setRtspUrl('')
  }

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name) return
    if (source === 'rtsp') {
      if (!rtspUrl) return
      onSave({ id: crypto.randomUUID(), name, source, rtspUrl })
    } else {
      if (!host) return
      onSave({ id: crypto.randomUUID(), name, source, host, username, password })
    }
    reset()
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>Or add manually</h2>

      <div className="segmented">
        <button
          type="button"
          className={source === 'onvif' ? 'active' : ''}
          onClick={() => setSource('onvif')}
        >
          ONVIF
        </button>
        <button
          type="button"
          className={source === 'rtsp' ? 'active' : ''}
          onClick={() => setSource('rtsp')}
        >
          RTSP URL
        </button>
      </div>

      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />

      {source === 'rtsp' ? (
        <input
          placeholder="rtsp://user:pass@192.168.1.10:554/stream1"
          value={rtspUrl}
          onChange={(e) => setRtspUrl(e.target.value)}
        />
      ) : (
        <>
          <input
            placeholder="Host (192.168.1.10 or 192.168.1.10:8000)"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </>
      )}

      <button type="submit">Save</button>
    </form>
  )
}
