import { useEffect, useState } from 'react'
import type { Camera, DiscoveredCamera } from '@shared/types'

interface Props {
  prefill: DiscoveredCamera | null
  onSave: (camera: Camera) => void
}

export function CameraForm({ prefill, onSave }: Props) {
  const [name, setName] = useState('')
  const [host, setHost] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (prefill) {
      setName(prefill.name)
      setHost(prefill.host)
    }
  }, [prefill])

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name || !host) return
    onSave({ id: crypto.randomUUID(), name, host, username, password })
    setName('')
    setHost('')
    setUsername('')
    setPassword('')
  }

  return (
    <form className="form" onSubmit={submit}>
      <h2>Add Camera</h2>
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        placeholder="Host (192.168.1.10 or 192.168.1.10:8000)"
        value={host}
        onChange={(e) => setHost(e.target.value)}
      />
      <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Save</button>
    </form>
  )
}
