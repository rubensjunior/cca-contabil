import PouchDB from 'pouchdb'

// Tipos de Documentos
export type DocType = 'user' | 'client' | 'accountant' | 'contract' | 'payment' | 'config'

export interface BaseDoc {
  _id: string
  _rev?: string
  type: DocType
  createdAt: string
  updatedAt: string
}

export interface User extends BaseDoc {
  type: 'user'
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'accountant' | 'clerk'
  status: 'active' | 'inactive'
  asaasCustomerId?: string
  asaasSubscriptionId?: string
  asaasInvoiceUrl?: string
  paymentStatus?: 'pending' | 'paid' | 'overdue'
}

export interface Client extends BaseDoc {
  type: 'client'
  name: string
  cnpj: string
  email: string
  phone?: string
  asaasCustomerId?: string
}

export interface Accountant extends BaseDoc {
  type: 'accountant'
  name: string
  cpfCnpj: string
  email: string
  walletId?: string // Asaas Wallet ID for split
}

export interface Contract extends BaseDoc {
  type: 'contract'
  clientId: string
  accountantId: string
  officePercentage: number
  accountantPercentage: number
  status: 'active' | 'inactive'
}

export interface AppConfig extends BaseDoc {
  type: 'config'
  asaasApiKey?: string
  officeName?: string
  cnpj?: string
  phone?: string
  address?: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
}

// Instância do Banco de Dados
const db = new PouchDB('cca_contabil_db')

// Inicialização (Vazia para banco limpo)
export const initializeDB = async (): Promise<void> => {
  // Reset único do banco de dados solicitado pelo usuário
  if (!localStorage.getItem('db_reset_done')) {
    console.log('Zerando banco de dados para novos testes...')
    await db.destroy()
    localStorage.setItem('db_reset_done', 'true')
    window.location.reload()
    return
  }
  console.log('Database initialized (clean)')
}

// Helper para gerar IDs consistentes
export const generateId = (type: DocType, suffix?: string): string => {
  return `${type}:${suffix || Date.now()}`
}

export default db
