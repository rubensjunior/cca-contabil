import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  version: '1.0.0', // Fallback
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  asaas: {
    setupPayment: (data: { name: string; email: string; cpfCnpj: string; mobilePhone: string }) =>
      ipcRenderer.invoke('asaas:setup-payment', data),
    getSubscriptionStatus: (id: string) => ipcRenderer.invoke('asaas:get-subscription-status', id),
    cancelSubscription: (id: string) => ipcRenderer.invoke('asaas:cancel-subscription', id)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
