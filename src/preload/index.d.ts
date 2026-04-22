import { ElectronAPI } from '@electron-toolkit/preload'

export interface SetupPaymentData {
  name: string
  email: string
  cpfCnpj: string
  mobilePhone: string
}

export interface SetupPaymentResponse {
  success: boolean
  customerId?: string
  subscriptionId?: string
  invoiceUrl?: string
  error?: string
}

export interface SubscriptionStatusResponse {
  success: boolean
  status?: string
  invoiceUrl?: string
  isPaid?: boolean
  isCancelled?: boolean
  paymentStatus?: string
  value?: number
  startDate?: string
  nextDueDate?: string
  error?: string
}

export interface InvoiceUrlResponse {
  success: boolean
  invoiceUrl?: string | null
  error?: string
}

export interface Api {
  version: string
  getVersion: () => Promise<string>
  minimize: () => void
  maximize: () => void
  close: () => void
  asaas: {
    setupPayment: (data: SetupPaymentData) => Promise<SetupPaymentResponse>
    getSubscriptionStatus: (id: string) => Promise<SubscriptionStatusResponse>
    getInvoiceUrl: (id: string) => Promise<InvoiceUrlResponse>
    cancelSubscription: (id: string) => Promise<{ success: boolean; error?: string }>
    checkCustomer: (
      cpfCnpj: string
    ) => Promise<{ success: boolean; exists?: boolean; name?: string; error?: string }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
