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
    getInvoiceUrl: (id: string) => ipcRenderer.invoke('asaas:get-invoice-url', id),
    cancelSubscription: (id: string) => ipcRenderer.invoke('asaas:cancel-subscription', id),
    checkCustomer: (cpfCnpj: string) => ipcRenderer.invoke('asaas:check-customer', cpfCnpj),
    createClientCustomer: (
      apiKey: string,
      data: {
        name: string
        cpfCnpj: string
        email: string
        mobilePhone?: string
        address?: string
        addressNumber?: string
        complement?: string
        province?: string
        postalCode?: string
        cityName?: string
        state?: string
      }
    ) => ipcRenderer.invoke('asaas:create-client-customer', apiKey, data),
    createClientPayment: (apiKey: string, data: any) =>
      ipcRenderer.invoke('asaas:create-client-payment', apiKey, data),
    listClientPayments: (apiKey: string) => ipcRenderer.invoke('asaas:list-client-payments', apiKey)
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
