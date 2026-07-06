import { useEffect, useState } from 'react'
import type { Camera, DiscoveredCamera, StreamSource } from '@shared/types'

interface Props {
  prefill: DiscoveredCamera | null
  camera?: Camera
  onSave: (camera: Camera) => Promise<void>
}

export function CameraForm({ prefill, camera, onSave }: Props) {
  const [source, setSource] = useState<StreamSource>(camera?.source ?? 'onvif')
  const [name, setName] = useState(camera?.name ?? '')
  const [host, setHost] = useState(camera?.host ?? '')
  const [username, setUsername] = useState(camera?.username ?? '')
  const [password, setPassword] = useState(camera?.password ?? '')
  const [rtspUrl, setRtspUrl] = useState(camera?.rtspUrl ?? '')
  const [useSecure, setUseSecure] = useState(camera?.useSecure ?? false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    setUseSecure(false)
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!name) return
    const id = camera?.id ?? crypto.randomUUID()
    const next: Camera =
      source === 'rtsp'
        ? { ...camera, id, name, source, rtspUrl }
        : { ...camera, id, name, source, host, useSecure, username, password }
    if (source === 'rtsp' ? !rtspUrl : !host) return

    setSaving(true)
    setError(null)
    try {
      await onSave(next)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>{camera ? 'Camera details' : 'Or add manually'}</h2>

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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={useSecure}
              onChange={(e) => setUseSecure(e.target.checked)}
            />
            Use HTTPS (defaults to port 443)
          </label>
        </>
      )}

      {error && <div className="form-error">{error}</div>}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
