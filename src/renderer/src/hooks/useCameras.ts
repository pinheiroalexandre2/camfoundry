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

  const reorder = useCallback(async (ids: string[]) => {
    setCameras(await window.api.reorderCameras(ids))
  }, [])

  return { cameras, reload, save, remove, reorder }
}
