import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      version: string
      getVersion: () => Promise<string>
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}
