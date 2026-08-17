import type { Camera } from '@shared/types'

export interface CameraStorage {
  list(): Promise<Camera[]>
  save(camera: Camera): Promise<Camera[]>
  delete(id: string): Promise<Camera[]>
  reorder(ids: string[]): Promise<Camera[]>
}
