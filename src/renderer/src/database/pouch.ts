import PouchDB from 'pouchdb'

// Tipos de Documentos
export type DocType = 'user' | 'client' | 'partner' | 'contract' | 'payment' | 'config'

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
  role: 'admin' | 'partner' | 'clerk'
  status: 'active' | 'inactive'
  tenantId: string // ID imutável para vincular ao banco de dados do escritório
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

export interface Partner extends BaseDoc {
  type: 'partner'
  name: string
  cpfCnpj: string
  email: string
  walletId?: string // Asaas Wallet ID for split
}

export interface Contract extends BaseDoc {
  type: 'contract'
  clientId: string
  partnerId: string
  hubPercentage: number
  partnerPercentage: number
  status: 'active' | 'inactive'
}

export interface AppConfig extends BaseDoc {
  type: 'config'
  asaasApiKey?: string
  companyName?: string
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
  onboardingCompleted?: boolean
  businessSegment?: string
}

// Bancos de Dados
const authDB = new PouchDB('cca_auth_db')
let workDB: PouchDB.Database | null = null

// Inicialização e Gerenciamento de Sessão
export const getAuthDB = (): PouchDB.Database => authDB

export const getWorkDB = (): PouchDB.Database => {
  if (!workDB) {
    // Tentar restaurar da sessão se existir
    const session = localStorage.getItem('cca_session')
    if (session) {
      const { tenantId } = JSON.parse(session)
      if (tenantId) {
        workDB = new PouchDB(`cca_work_db_${tenantId}`)
        return workDB
      }
    }
    throw new Error('Sessão não inicializada. Por favor, faça login novamente.')
  }
  return workDB
}

/**
 * Inicializa a sessão do usuário e abre o banco de dados de trabalho específico.
 */
export const initUserSession = (tenantId: string): void => {
  if (workDB) {
    console.log('Trocando banco de dados de trabalho...')
  }
  workDB = new PouchDB(`cca_work_db_${tenantId}`)
  console.log(`Banco de dados de trabalho inicializado: cca_work_db_${tenantId}`)
}

/**
 * Limpa a sessão e desvincula o banco de dados atual.
 */
export const closeSession = async (): Promise<void> => {
  console.log('Finalizando sessão e limpando bases temporárias...')
  if (workDB) {
    try {
      // Opcional: fechar conexões ativas se o pouch suportar
      workDB = null
    } catch (e) {
      console.error('Erro ao fechar workDB:', e)
    }
  }
  localStorage.removeItem('cca_session')
}

// Inicialização Global
export const initializeDB = async (): Promise<void> => {
  // Reset único solicitado anteriormente (agora aplicado ao authDB se necessário)
  if (!localStorage.getItem('db_reset_v2_done')) {
    console.log('Limpando sistemas para nova arquitetura de isolamento...')
    // Em Electron + PouchDB local, não temos allDbs facilmente sem plugins específicos,
    // então vamos destruir sistematicamente o que conhecemos.
    await authDB.destroy()
    await new PouchDB('cca_contabil_db').destroy()

    localStorage.setItem('db_reset_v2_done', 'true')
    window.location.reload()
    return
  }

  // Tentar reconectar sessão existente
  const session = localStorage.getItem('cca_session')
  if (session) {
    try {
      const parsedSession = JSON.parse(session)
      if (parsedSession.tenantId) {
        initUserSession(parsedSession.tenantId)
      }
    } catch (e) {
      console.error('Erro ao restaurar sessão:', e)
    }
  }
}

// Helper para gerar IDs consistentes
export const generateId = (type: DocType, suffix?: string): string => {
  return `${type}:${suffix || Date.now()}`
}

// Exportação padrão agora é o AuthDB por segurança de retrocompatibilidade no Login/Signup
export default authDB
