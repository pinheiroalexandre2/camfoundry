import { useEffect, useState } from 'react'
import type { StreamState } from '@shared/types'

export function useStreamStatuses() {
  const [statuses, setStatuses] = useState<Record<string, StreamState>>({})

  useEffect(() => {
    return window.api.onStreamStatus((state) => {
      setStatuses((prev) => ({ ...prev, [state.cameraId]: state }))
    })
  }, [])

  return statuses
}
