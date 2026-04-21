import { app } from 'electron'
import { join } from 'path'
import dotenv from 'dotenv'

// Carregando .env manualmente se necessário para o processo principal
dotenv.config({ path: join(app.getAppPath(), '.env') })

const ASAAS_API_KEY = process.env.ASAAS_API_KEY
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3'

if (!ASAAS_API_KEY) {
  console.error('ASAAS_API_KEY não encontrada no ambiente.')
}

export interface AsaasCustomer {
  id: string
  name: string
  cpfCnpj: string
  email: string
}

export interface AsaasSubscription {
  id: string
  invoiceUrl: string
  checkoutUrl?: string
  status: string
}

export interface AsaasPayment {
  id: string
  status: string
  value: number
  netValue: number
  billingType: string
  invoiceUrl: string
  dueDate: string
  paymentDate?: string
}

interface AsaasListResponse<T> {
  data: T[]
  totalCount: number
  hasMore: boolean
}

interface AsaasError {
  code: string
  description: string
}

interface AsaasErrorResponse {
  errors: AsaasError[]
}

interface AsaasDeleteResponse {
  deleted: boolean
  id: string
  errors?: AsaasError[]
}

export const AsaasService = {
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '')
    const response = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpfCnpj}`, {
      headers: {
        access_token: ASAAS_API_KEY || ''
      }
    })

    const data = (await response.json()) as AsaasListResponse<AsaasCustomer>
    if (data.data && data.data.length > 0) {
      return data.data[0]
    }
    return null
  },

  async createCustomer(data: {
    name: string
    cpfCnpj: string
    email: string
    mobilePhone: string
  }): Promise<AsaasCustomer> {
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY || ''
      },
      body: JSON.stringify({
        ...data,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, '')
      })
    })

    const result = (await response.json()) as AsaasCustomer & AsaasErrorResponse
    if (result.errors) {
      throw new Error(result.errors[0].description)
    }
    return result
  },

  async createSubscription(customerId: string): Promise<AsaasSubscription> {
    // Calcular vencimento: Hoje + 3 dias
    const nextDueDate = new Date()
    nextDueDate.setDate(nextDueDate.getDate() + 3)
    const formattedDate = nextDueDate.toISOString().split('T')[0]

    const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY || ''
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: 55,
        nextDueDate: formattedDate,
        cycle: 'MONTHLY',
        description: 'Assinatura Profissional - CCA. Split'
      })
    })

    const result = (await response.json()) as AsaasSubscription & AsaasErrorResponse
    if (result.errors) {
      throw new Error(result.errors[0].description)
    }
    return result
  },

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
      headers: {
        access_token: ASAAS_API_KEY || ''
      }
    })
    const result = (await response.json()) as AsaasSubscription & AsaasErrorResponse
    if (result.errors) {
      throw new Error(result.errors[0].description)
    }
    return result
  },

  async getSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`, {
      headers: {
        access_token: ASAAS_API_KEY || ''
      }
    })
    const data = (await response.json()) as AsaasListResponse<AsaasPayment> & AsaasErrorResponse
    if (data.errors) {
      throw new Error(data.errors[0].description)
    }
    return data.data || []
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${ASAAS_API_URL}/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        access_token: ASAAS_API_KEY || ''
      }
    })

    const result = (await response.json()) as AsaasDeleteResponse
    if (result.deleted === false && result.errors) {
      throw new Error(result.errors[0].description)
    }
  }
}
