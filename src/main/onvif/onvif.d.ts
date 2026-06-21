declare module 'onvif' {
  interface CamOptions {
    hostname: string
    username?: string
    password?: string
    port?: number
    path?: string
    timeout?: number
  }

  export class Cam {
    constructor(options: CamOptions, callback: (err: Error | null) => void)
    profiles: { $: { token: string }; name?: string }[]
    getStreamUri(
      options: { protocol?: string; stream?: string; profileToken?: string },
      callback: (err: Error | null, result: { uri: string }) => void
    ): void
    getDeviceInformation(
      callback: (
        err: Error | null,
        info: { manufacturer?: string; model?: string }
      ) => void
    ): void
  }

  interface ProbeOptions {
    resolve?: boolean
    timeout?: number
  }

  export const Discovery: {
    probe(
      options: ProbeOptions,
      callback: (err: Error | Error[] | null, data: unknown[]) => void
    ): void
  }
}
