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
  value: number
  startDate?: string
  nextDueDate?: string
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

  async updateCustomer(
    customerId: string,
    data: {
      name: string
      email: string
      mobilePhone: string
    }
  ): Promise<AsaasCustomer> {
    const response = await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_API_KEY || ''
      },
      body: JSON.stringify(data)
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
  },

  /**
   * Cria um cliente no Asaas usando a chave API do ESCRITÓRIO (não a da plataforma).
   * Essa separação é crucial: a chave da plataforma (.env) gerencia assinaturas do software,
   * enquanto a chave do escritório gerencia os clientes do próprio escritório.
   */
  async createClientCustomer(
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
  ): Promise<AsaasCustomer> {
    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey
      },
      body: JSON.stringify({
        ...data,
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ''),
        postalCode: data.postalCode?.replace(/\D/g, ''),
        mobilePhone: data.mobilePhone?.replace(/\D/g, '')
      })
    })

    const result = (await response.json()) as AsaasCustomer & AsaasErrorResponse
    if (result.errors) {
      throw new Error(result.errors[0].description)
    }
    return result
  },

  /**
   * Cria uma cobrança no Asaas usando a chave API do ESCRITÓRIO.
   */
  async createClientPayment(
    apiKey: string,
    data: {
      customer: string
      billingType: string
      value: number
      dueDate: string
      description: string
      split?: {
        walletId: string
        percentualValue?: number
        fixedValue?: number
      }[]
    }
  ): Promise<AsaasPayment> {
    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey
      },
      body: JSON.stringify(data)
    })

    const result = (await response.json()) as AsaasPayment & AsaasErrorResponse
    if (result.errors) {
      throw new Error(result.errors[0].description)
    }
    return result
  },

  /**
   * Lista as cobranças de um escritório.
   */
  async listClientPayments(apiKey: string): Promise<AsaasPayment[]> {
    const response = await fetch(`${ASAAS_API_URL}/payments?limit=100`, {
      headers: {
        access_token: apiKey
      }
    })

    const data = (await response.json()) as AsaasListResponse<AsaasPayment> & AsaasErrorResponse
    if (data.errors) {
      throw new Error(data.errors[0].description)
    }
    return data.data || []
  }
}
