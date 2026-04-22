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
      asaas: {
        setupPayment: (data: {
          name: string
          email: string
          cpfCnpj: string
          mobilePhone: string
        }) => Promise<{
          success: boolean
          customerId?: string
          subscriptionId?: string
          invoiceUrl?: string
          error?: string
        }>
        getSubscriptionStatus: (id: string) => Promise<{
          success: boolean
          status?: string
          value?: number
          startDate?: string
          nextDueDate?: string
          invoiceUrl?: string
          isPaid?: boolean
          isCancelled?: boolean
          paymentStatus?: string
          error?: string
        }>
        getInvoiceUrl: (id: string) => Promise<{
          success: boolean
          invoiceUrl?: string | null
          error?: string
        }>
        cancelSubscription: (id: string) => Promise<{ success: boolean; error?: string }>
        checkCustomer: (
          cpfCnpj: string
        ) => Promise<{ success: boolean; exists?: boolean; name?: string; error?: string }>
      }
    }
  }
}
