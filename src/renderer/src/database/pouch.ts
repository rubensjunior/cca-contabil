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

// Inicialização (Seed)
export const initializeDB = async (): Promise<void> => {
  try {
    const adminId = 'user:admin@cca.com'
    try {
      await db.get(adminId)
    } catch (err: unknown) {
      if ((err as { status: number }).status === 404) {
        const adminUser: User = {
          _id: adminId,
          type: 'user',
          name: 'Administrador',
          email: 'admin@cca.com',
          passwordHash: 'admin123', // Em um app real, usaríamos bcrypt/argon2
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await db.put(adminUser)
        console.log('Admin user created defaults')
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error)
  }
}

// Helper para gerar IDs consistentes
export const generateId = (type: DocType, suffix?: string): string => {
  return `${type}:${suffix || Date.now()}`
}

export default db
