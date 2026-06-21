import { useCallback, useEffect, useState } from 'react'
import type { Camera } from '@shared/types'

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([])

  const reload = useCallback(async () => {
    setCameras(await window.api.listCameras())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const save = useCallback(async (camera: Camera) => {
    setCameras(await window.api.saveCamera(camera))
  }, [])

  const remove = useCallback(async (id: string) => {
    await window.api.stopStream(id)
    setCameras(await window.api.deleteCamera(id))
  }, [])

  return { cameras, reload, save, remove }
}
