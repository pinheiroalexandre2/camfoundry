import type { OnvifApi } from '@shared/types'

declare global {
  interface Window {
    api: OnvifApi
  }
}

export {}
