import { promises as fs } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { Camera } from '@shared/types'
import type { CameraStorage } from './storage'

interface StoreShape {
  cameras: Camera[]
}

export class JsonStore implements CameraStorage {
  private file = join(app.getPath('userData'), 'cameras.json')

  private async read(): Promise<StoreShape> {
    try {
      const raw = await fs.readFile(this.file, 'utf-8')
      const data = JSON.parse(raw) as StoreShape
      return { cameras: data.cameras ?? [] }
    } catch {
      return { cameras: [] }
    }
  }

  private async write(data: StoreShape): Promise<void> {
    await fs.writeFile(this.file, JSON.stringify(data, null, 2), 'utf-8')
  }

  async list(): Promise<Camera[]> {
    return (await this.read()).cameras
  }

  async save(camera: Camera): Promise<Camera[]> {
    const data = await this.read()
    const index = data.cameras.findIndex((c) => c.id === camera.id)
    if (index >= 0) data.cameras[index] = camera
    else data.cameras.push(camera)
    await this.write(data)
    return data.cameras
  }

  async delete(id: string): Promise<Camera[]> {
    const data = await this.read()
    data.cameras = data.cameras.filter((c) => c.id !== id)
    await this.write(data)
    return data.cameras
  }
}
