<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import db, {
  User,
  Company,
  closeSession,
  generateId,
  destroyWorkDB
} from '../database/pouch'
import {
  ShieldCheck,
  CreditCard,
  Trash2,
  Home,
  Save,
  AlertTriangle,
  ExternalLink,
  RefreshCcw,
  Pencil
} from 'lucide-vue-next'
import { PhUser, PhShieldCheck, PhCreditCard, PhTrash } from '@phosphor-icons/vue'
import CompanySwitcher from '../components/CompanySwitcher.vue'

const router = useRouter()

interface UserSession {
  id: string
  name: string
  role: string
  email: string
  tenantId: string
  subscriptionId?: string
  invoiceUrl?: string
}

const userSession = ref<UserSession | null>(null)
const currentUser = ref<User | null>(null)
const isLoading = ref(false)
const message = ref({ text: '', type: '' as 'success' | 'error' | '' })

// Formulário de Dados Pessoais
const personalForm = ref({
  name: '',
  nickname: ''
})

// Formulário de Segurança
const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const activeTab = ref('personal')

// Múltiplas Empresas / Assinaturas
const companies = ref<Company[]>([])
const isAddingCompany = ref(false)
const newCompanyForm = ref({
  name: '',
  cnpj: ''
})

// Controle de Exclusão de Hub
const showDeleteConfirmation = ref(false)

const formatCpfCnpj = (value: string): string => {
  const val = value.replace(/\D/g, '')
  if (val.length <= 11) {
    // CPF: 000.000.000-00
    return val
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  } else {
    // CNPJ: 00.000.000/0000-00
    return val
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }
}

const handleCnpjInput = (e: Event, target: 'new' | 'edit'): void => {
  const input = e.target as HTMLInputElement
  const formatted = formatCpfCnpj(input.value)
  if (target === 'new') {
    newCompanyForm.value.cnpj = formatted
  } else {
    editCompanyForm.value.cnpj = formatted
  }
}

const editingCompanyId = ref<string | null>(null)
const editCompanyForm = ref({
  name: '',
  cnpj: ''
})

onMounted(async () => {
  const session = localStorage.getItem('cca_session')
  if (session) {
    userSession.value = JSON.parse(session)
    if (userSession.value) {
      try {
        const userDoc = await db.get<User>(userSession.value.id)
        currentUser.value = userDoc
        personalForm.value.name = userDoc.name
        personalForm.value.nickname = userDoc.nickname || ''

        const allDocs = await db.allDocs({ include_docs: true })
        let userCompanies = allDocs.rows
          .map((row) => row.doc as unknown as Company)
          .filter((doc) => doc.type === 'company' && doc.userId === userSession.value?.id)

        // Migração para usuários antigos: se não tiver empresa, mas o userDoc tiver asaasSubscriptionId
        if (userCompanies.length === 0 && userDoc.asaasSubscriptionId) {
          const legacyCompany: Company = {
            _id: generateId('company'),
            type: 'company',
            userId: userDoc._id,
            name: userDoc.name + ' (Migrada)',
            cnpj: 'N/A', // Não temos o CNPJ do usuário antigo no userDoc base
            tenantId: userDoc.tenantId,
            asaasCustomerId: userDoc.asaasCustomerId,
            asaasSubscriptionId: userDoc.asaasSubscriptionId,
            asaasInvoiceUrl: userDoc.asaasInvoiceUrl,
            paymentStatus: userDoc.paymentStatus || 'paid',
            createdAt: userDoc.createdAt,
            updatedAt: new Date().toISOString()
          }
          await db.put(legacyCompany)
          userCompanies.push(legacyCompany)
        }

        companies.value = userCompanies

        // Sincronizar status automaticamente ao carregar
        await syncAsaasStatus()
      } catch (err) {
        console.error('Erro ao carregar usuário:', err)
      }
    }
  }
})

const syncAsaasStatus = async (): Promise<void> => {
  if (companies.value.length === 0) return

  isLoading.value = true
  try {
    let sessionUpdated = false
    const sessionStr = localStorage.getItem('cca_session')
    const session = sessionStr ? JSON.parse(sessionStr) : {}

    for (const company of companies.value) {
      if (company.asaasSubscriptionId) {
        const statusResult = await window.api.asaas.getSubscriptionStatus(
          company.asaasSubscriptionId
        )
        if (statusResult.success) {
          // Determina o status real: cancelada > inadimplente > paga
          const res = statusResult
          const realStatus: 'pending' | 'paid' | 'overdue' | 'cancelled' = res.isCancelled
            ? 'cancelled'
            : res.isPaid
              ? 'paid'
              : 'overdue'

          let changed = false
          if (company.paymentStatus !== realStatus) {
            company.paymentStatus = realStatus
            changed = true
          }
          // Se cancelada, limpa a URL de fatura (não há mais cobrança ativa)
          const newInvoiceUrl = res.isCancelled ? undefined : statusResult.invoiceUrl
          if (company.asaasInvoiceUrl !== newInvoiceUrl) {
            company.asaasInvoiceUrl = newInvoiceUrl
            changed = true
          }
          if (statusResult.value !== undefined && company.value !== statusResult.value) {
            company.value = statusResult.value
            changed = true
          }
          if (statusResult.startDate && company.startDate !== statusResult.startDate) {
            company.startDate = statusResult.startDate
            changed = true
          }
          if (statusResult.nextDueDate && company.nextDueDate !== statusResult.nextDueDate) {
            company.nextDueDate = statusResult.nextDueDate
            changed = true
          }
          if (changed) {
            await db.put(company)

            // Se for a empresa ativa na sessão, atualiza o localStorage
            if (session.tenantId === company.tenantId) {
              session.paymentStatus = realStatus
              session.invoiceUrl = company.asaasInvoiceUrl
              session.value = company.value
              session.startDate = company.startDate
              session.nextDueDate = company.nextDueDate
              sessionUpdated = true
            }
          }
        }
      }
    }

    if (sessionUpdated) {
      localStorage.setItem('cca_session', JSON.stringify(session))
    }

    if (activeTab.value === 'subscription') {
      showMessage('Status das assinaturas sincronizados com o Asaas.', 'success')
    }
  } catch (err) {
    console.error('Erro na sincronização manual:', err)
    if (activeTab.value === 'subscription') {
      showMessage('Erro ao sincronizar com Asaas.', 'error')
    }
  } finally {
    isLoading.value = false
  }
}

const showMessage = (text: string, type: 'success' | 'error'): void => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 5000)
}

const handleSavePersonal = async (): Promise<void> => {
  if (!currentUser.value) return

  if (!personalForm.value.name.trim()) {
    showMessage('O nome completo é obrigatório.', 'error')
    return
  }

  const noChanges =
    currentUser.value.name === personalForm.value.name &&
    (currentUser.value.nickname || '') === personalForm.value.nickname
  if (noChanges) {
    showMessage('Nenhuma alteração foi feita.', 'error')
    return
  }

  isLoading.value = true
  try {
    const updatedUser = {
      ...currentUser.value,
      name: personalForm.value.name,
      nickname: personalForm.value.nickname,
      updatedAt: new Date().toISOString()
    }
    await db.put(updatedUser)
    currentUser.value = updatedUser

    // Atualizar sessão local
    if (userSession.value) {
      const newSession = {
        ...userSession.value,
        name: personalForm.value.name
      }
      localStorage.setItem('cca_session', JSON.stringify(newSession))
      userSession.value = newSession
    }

    showMessage('Dados atualizados com sucesso!', 'success')
  } catch (err) {
    console.error('Erro ao salvar dados pessoais:', err)
    showMessage('Erro ao salvar alterações.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleUpdatePassword = async (): Promise<void> => {
  if (!currentUser.value) return

  if (securityForm.value.newPassword.length < 8) {
    showMessage('A nova senha deve ter pelo menos 8 caracteres.', 'error')
    return
  }

  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    showMessage('As novas senhas não coincidem.', 'error')
    return
  }

  if (securityForm.value.currentPassword !== currentUser.value.passwordHash) {
    showMessage('Senha atual incorreta.', 'error')
    return
  }

  isLoading.value = true
  try {
    const updatedUser = {
      ...currentUser.value,
      passwordHash: securityForm.value.newPassword,
      updatedAt: new Date().toISOString()
    }
    await db.put(updatedUser)
    currentUser.value = updatedUser

    securityForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    showMessage('Senha alterada com sucesso!', 'success')
  } catch (err) {
    console.error('Erro ao alterar senha:', err)
    showMessage('Erro ao processar alteração de senha.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleAddCompany = async (): Promise<void> => {
  if (!newCompanyForm.value.name || !newCompanyForm.value.cnpj) {
    showMessage('Preencha o nome e CNPJ da nova empresa.', 'error')
    return
  }

  isLoading.value = true
  try {
    const tenantId = crypto.randomUUID()
    const companyId = generateId('company')

    const newCompany: Company = {
      _id: companyId,
      type: 'company',
      userId: currentUser.value!._id,
      name: newCompanyForm.value.name,
      cnpj: newCompanyForm.value.cnpj,
      tenantId: tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'pending'
    }

    // Tentar criar no Asaas
    const asaasResult = await window.api.asaas.setupPayment({
      name: currentUser.value!.name, // owner name
      email: currentUser.value!.email,
      cpfCnpj: newCompanyForm.value.cnpj,
      mobilePhone: '' // Pegar de algum lugar se necessário, ou vazio
    })

    if (asaasResult.success) {
      newCompany.asaasCustomerId = asaasResult.customerId
      newCompany.asaasSubscriptionId = asaasResult.subscriptionId
      newCompany.asaasInvoiceUrl = asaasResult.invoiceUrl
    } else {
      console.error('Falha ao registrar no Asaas, salvando apenas local.', asaasResult.error)
      showMessage(
        'Nova empresa adicionada, mas houve um erro ao gerar a cobrança (Asaas).',
        'error'
      )
    }

    await db.put(newCompany)
    companies.value.push(newCompany)

    isAddingCompany.value = false
    newCompanyForm.value = { name: '', cnpj: '' }
    if (asaasResult.success) {
      showMessage('Nova empresa adicionada com sucesso!', 'success')
    }
  } catch (err) {
    console.error('Erro ao adicionar empresa:', err)
    showMessage('Erro ao adicionar a nova empresa.', 'error')
  } finally {
    isLoading.value = false
  }
}

const startEditCompany = (company: Company): void => {
  editingCompanyId.value = company._id
  editCompanyForm.value = {
    name: company.name,
    cnpj: company.cnpj
  }
}

const handleUpdateCompany = async (): Promise<void> => {
  if (!editingCompanyId.value) return
  if (!editCompanyForm.value.name || !editCompanyForm.value.cnpj) {
    showMessage('Nome e CNPJ são obrigatórios.', 'error')
    return
  }

  isLoading.value = true
  try {
    const company = companies.value.find((c) => c._id === editingCompanyId.value)
    if (company) {
      company.name = editCompanyForm.value.name
      company.cnpj = editCompanyForm.value.cnpj
      company.updatedAt = new Date().toISOString()
      await db.put(company)

      // Atualiza sessão se for a atual
      const session = JSON.parse(localStorage.getItem('cca_session') || '{}')
      if (session.tenantId === company.tenantId) {
        session.company = company.name
        localStorage.setItem('cca_session', JSON.stringify(session))
      }

      showMessage('Dados da empresa atualizados.', 'success')
      editingCompanyId.value = null
    }
  } catch (err) {
    console.error('Erro ao atualizar empresa:', err)
    showMessage('Erro ao salvar alterações.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleCancelSubscription = async (subscriptionId?: string): Promise<void> => {
  if (!subscriptionId) return

  if (
    !confirm(
      'Tem certeza que deseja cancelar esta assinatura? O acesso ao sistema para esta empresa será interrompido após o período atual.'
    )
  )
    return

  isLoading.value = true
  try {
    const result = await window.api.asaas.cancelSubscription(subscriptionId)
    if (result.success) {
      // Encontrar a referência reativa da empresa
      const companyRef = companies.value.find((c) => c.asaasSubscriptionId === subscriptionId)
      if (companyRef) {
        // Busca o doc mais recente para garantir _rev correto
        const freshDoc = await db.get<Company>(companyRef._id)
        const updatedCompany: Company = {
          ...freshDoc,
          paymentStatus: 'overdue',
          updatedAt: new Date().toISOString()
        }
        await db.put(updatedCompany)

        // Atualiza o objeto reativo
        companyRef.paymentStatus = 'overdue'
        companyRef._rev = updatedCompany._rev
        companyRef.updatedAt = updatedCompany.updatedAt
      }
      showMessage('Assinatura cancelada com sucesso.', 'success')
    } else {
      throw new Error(result.error)
    }
  } catch (err) {
    console.error('Erro ao cancelar assinatura:', err)
    showMessage('Erro ao cancelar assinatura: ' + (err as Error).message, 'error')
  } finally {
    isLoading.value = false
  }
}

const handleDeleteHub = async (): Promise<void> => {
  if (!currentUser.value) return

  showDeleteConfirmation.value = true
}

const confirmDeleteHub = async (): Promise<void> => {
  if (!currentUser.value) return

  isLoading.value = true
  showDeleteConfirmation.value = false
  try {
    // 1. Buscar todas as empresas vinculadas ao usuário para limpeza total
    const allDocs = await db.allDocs({ include_docs: true })
    const userCompanies = allDocs.rows
      .map((row) => row.doc as unknown as Company)
      .filter((doc) => doc.type === 'company' && doc.userId === currentUser.value?._id)

    // 2. Iterar sobre cada empresa para limpeza profunda
    for (const company of userCompanies) {
      console.log(`Limpando dados da empresa: ${company.name} (${company._id})`)

      // 2.1 Tentar cancelar assinatura se existir
      if (company.asaasSubscriptionId) {
        try {
          await window.api.asaas.cancelSubscription(company.asaasSubscriptionId)
          console.log(`Assinatura ${company.asaasSubscriptionId} cancelada.`)
        } catch (err) {
          console.warn(`Falha ao cancelar assinatura ${company.asaasSubscriptionId}:`, err)
        }
      }

      // 2.2 Destruir o banco de dados de trabalho da empresa
      if (company.tenantId) {
        try {
          await destroyWorkDB(company.tenantId)
        } catch (err) {
          console.warn(`Falha ao destruir workDB para tenant ${company.tenantId}:`, err)
        }
      }

      // 2.3 Remover o documento da empresa do AuthDB
      try {
        await db.remove(company._id, company._rev)
      } catch (err) {
        console.warn(`Falha ao remover doc da empresa ${company._id}:`, err)
      }
    }

    // 3. Remover usuário do AuthDB
    if (currentUser.value?._id && currentUser.value?._rev) {
      await db.remove(currentUser.value._id, currentUser.value._rev)
    }

    // 4. Limpar sessão e sair
    await closeSession()
    router.push('/login')
  } catch (err) {
    console.error('Erro crítico ao excluir Hub:', err)
    showMessage('Erro crítico ao excluir Hub. Alguns dados podem ter permanecido.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleLogout = async (): Promise<void> => {
  await closeSession()
  router.push('/login')
}
</script>

<template>
  <div
    class="h-[calc(100vh-48px)] bg-[var(--metronic-bg)] text-slate-900 flex overflow-hidden font-inter"
  >
    <!-- Sidebar (Metronic Style - Reutilizada) -->
    <aside class="w-[280px] bg-[#1e1e2d] flex flex-col z-30 transition-all shrink-0">
      <div class="h-[100px] flex items-center px-9">
        <router-link to="/dashboard" class="flex items-center gap-4">
          <div
            class="w-11 h-11 bg-[var(--cca-blue)] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <span class="text-white text-2xl font-black">C</span>
          </div>
          <div class="flex flex-col">
            <span class="text-white brand-logo text-xl tracking-tight leading-4">CCA.SPLIT</span>
            <span
              class="text-[10px] text-[var(--metronic-sidebar-text)] font-bold uppercase tracking-[0.2em] opacity-40 mt-1"
              >HUB CORPORATIVO</span
            >
          </div>
        </router-link>
      </div>

      <CompanySwitcher />

      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-sidebar-scroll">
        <router-link
          to="/dashboard"
          class="flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
        >
          <Home :size="20" class="opacity-50 group-hover:opacity-100" />
          <span class="text-[13px] font-bold">Voltar ao Painel</span>
        </router-link>

        <div class="pt-6 pb-2 px-5">
          <p
            class="text-[10px] font-black text-[var(--metronic-sidebar-text)] uppercase tracking-[0.2em] opacity-20"
          >
            Configurações
          </p>
        </div>

        <button
          class="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all group"
          :class="
            activeTab === 'personal'
              ? 'bg-[#1b1b28] text-white'
              : 'text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white'
          "
          @click="activeTab = 'personal'"
        >
          <PhUser :size="20" :weight="activeTab === 'personal' ? 'fill' : 'bold'" />
          <span class="text-[13px] font-bold">Dados Pessoais</span>
        </button>

        <button
          class="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all group"
          :class="
            activeTab === 'security'
              ? 'bg-[#1b1b28] text-white'
              : 'text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white'
          "
          @click="activeTab = 'security'"
        >
          <PhShieldCheck :size="20" :weight="activeTab === 'security' ? 'fill' : 'bold'" />
          <span class="text-[13px] font-bold">Segurança</span>
        </button>

        <button
          v-if="userSession?.role === 'admin'"
          class="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all group"
          :class="
            activeTab === 'subscription'
              ? 'bg-[#1b1b28] text-white'
              : 'text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white'
          "
          @click="activeTab = 'subscription'"
        >
          <PhCreditCard :size="20" :weight="activeTab === 'subscription' ? 'fill' : 'bold'" />
          <span class="text-[13px] font-bold">Assinatura</span>
        </button>

        <button
          v-if="userSession?.role === 'admin'"
          class="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all group"
          :class="
            activeTab === 'account'
              ? 'bg-[#1b1b28] text-white'
              : 'text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white'
          "
          @click="activeTab = 'account'"
        >
          <PhTrash :size="20" :weight="activeTab === 'account' ? 'fill' : 'bold'" />
          <span class="text-[13px] font-bold">Encerrar Conta</span>
        </button>
      </nav>

      <div class="p-8 border-t border-white/5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-[var(--cca-blue-soft)] flex items-center justify-center border border-white/10"
            >
              <span class="text-white font-black text-sm">{{ userSession?.name.charAt(0) }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-white text-[12px] font-black truncate w-24">{{
                userSession?.name
              }}</span>
            </div>
          </div>
          <button
            class="p-3 rounded-xl bg-white/5 text-[var(--metronic-sidebar-text)] hover:bg-[var(--metronic-danger)] hover:text-white transition-all shadow-sm"
            @click="handleLogout"
          >
            <PhTrash :size="18" weight="bold" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <!-- Success/Error Message Toast -->
      <transition name="fade">
        <div
          v-if="message.text"
          class="absolute top-10 left-1/2 -translate-x-1/2 z-[100] min-w-[300px]"
        >
          <div
            :class="
              message.type === 'success'
                ? 'bg-[var(--metronic-success)]'
                : 'bg-[var(--metronic-danger)]'
            "
            class="text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-subtle"
          >
            <ShieldCheck v-if="message.type === 'success'" :size="20" />
            <AlertTriangle v-else :size="20" />
            <span class="font-bold text-sm">{{ message.text }}</span>
          </div>
        </div>
      </transition>

      <!-- Toolbar -->
      <header
        class="h-[100px] bg-white px-10 flex items-center justify-between shrink-0 border-b border-slate-100"
      >
        <div class="flex flex-col">
          <div class="flex items-center gap-2 mb-1.5">
            <Home :size="14" class="text-slate-300" />
            <span class="text-slate-300 text-xs font-bold">/</span>
            <span
              class="text-[#94a3b8] text-xs font-bold hover:text-[var(--cca-blue)] cursor-pointer transition-colors"
              >Configurações</span
            >
            <span class="text-slate-300 text-xs font-bold">/</span>
            <span class="text-[#1e1e2d] text-xs font-bold">Perfil do Usuário</span>
          </div>
          <h2 class="text-[26px] font-black text-[#1e1e2d] tracking-tight leading-none">
            Meu Perfil
          </h2>
        </div>
      </header>

      <!-- Page Body -->
      <div class="flex-1 p-10 overflow-auto">
        <div class="max-w-4xl mx-auto space-y-10">
          <!-- Banner de Usuário -->
          <div
            class="bg-white rounded-[30px] p-10 shadow-[var(--metronic-shadow)] border border-slate-50 relative overflow-hidden flex flex-col md:flex-row items-center gap-8"
          >
            <div
              class="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[var(--cca-blue)] to-indigo-600 opacity-[0.03]"
            ></div>

            <div
              class="relative z-10 w-32 h-32 rounded-[2.5rem] bg-[var(--cca-blue)] flex items-center justify-center border-4 border-white shadow-xl"
            >
              <span class="text-white text-5xl font-black">{{ personalForm.name.charAt(0) }}</span>
            </div>

            <div class="flex-1 flex flex-col items-center md:items-start z-10">
              <h3 class="text-3xl font-black text-[#1e1e2d] tracking-tight mb-1">
                {{ personalForm.name }}
              </h3>
              <p class="text-slate-400 font-bold flex items-center gap-2">
                {{ userSession?.email }} <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                <span
                  class="bg-slate-100 text-slate-500 text-[10px] uppercase px-2 py-0.5 rounded-md"
                  >{{ userSession?.role }}</span
                >
              </p>
            </div>
          </div>

          <!-- Abas de Conteúdo -->
          <div
            class="bg-white rounded-[30px] shadow-[var(--metronic-shadow)] border border-slate-50 overflow-hidden"
          >
            <!-- Tab: Dados Pessoais -->
            <div v-if="activeTab === 'personal'" class="p-10 space-y-8 animate-fade-in">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xl font-black text-slate-800 tracking-tight">Dados Pessoais</h4>
                  <p class="text-slate-400 text-sm font-medium">
                    As informações básicas da sua conta corporativa.
                  </p>
                </div>
                <button
                  :disabled="isLoading"
                  class="bg-[#009ef7] hover:bg-[#008be0] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                  @click="handleSavePersonal"
                >
                  <Save :size="16" />
                  Salvar Alterações
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-3">
                  <label class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >Nome Completo</label
                  >
                  <input
                    v-model="personalForm.name"
                    type="text"
                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div class="space-y-3">
                  <label class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >Apelido (Como quer ser chamado)</label
                  >
                  <input
                    v-model="personalForm.nickname"
                    type="text"
                    placeholder="Ex: João"
                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div class="space-y-3">
                  <label class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >E-mail (Permanente)</label
                  >
                  <div
                    class="w-full bg-slate-100/50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-400 font-bold flex items-center justify-between"
                  >
                    {{ userSession?.email }}
                    <ShieldCheck :size="16" class="opacity-30" />
                  </div>
                  <p class="text-[10px] text-slate-300 italic">
                    O e-mail é o seu identificador único e não pode ser alterado.
                  </p>
                </div>
              </div>
            </div>

            <!-- Tab: Segurança -->
            <div v-else-if="activeTab === 'security'" class="p-10 space-y-8 animate-fade-in">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xl font-black text-slate-800 tracking-tight">
                    Segurança da Conta
                  </h4>
                  <p class="text-slate-400 text-sm font-medium">
                    Troque sua senha regularmente para manter seu hub protegido.
                  </p>
                </div>
                <button
                  :disabled="isLoading"
                  class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center gap-2"
                  @click="handleUpdatePassword"
                >
                  <ShieldCheck :size="16" />
                  Atualizar Senha
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="space-y-3">
                  <label class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >Senha Atual</label
                  >
                  <input
                    v-model="securityForm.currentPassword"
                    type="password"
                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div class="space-y-3">
                  <label class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >Nova Senha</label
                  >
                  <input
                    v-model="securityForm.newPassword"
                    type="password"
                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
                <div class="space-y-3">
                  <label class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >Confirmar Nova Senha</label
                  >
                  <input
                    v-model="securityForm.confirmPassword"
                    type="password"
                    class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <!-- Tab: Assinatura -->
            <div v-else-if="activeTab === 'subscription'" class="p-10 space-y-8 animate-fade-in">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-2xl font-black text-slate-900 tracking-tight">
                    Suas Assinaturas e Empresas
                  </h3>
                  <p class="text-slate-500 font-medium mt-1">
                    Gerencie os planos e pagamentos (via Asaas) de todas as empresas sob sua gestão.
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    :disabled="isLoading"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-xs disabled:opacity-60"
                    title="Sincronizar com Asaas"
                    @click="syncAsaasStatus"
                  >
                    <RefreshCcw :size="16" :class="{ 'animate-spin': isLoading }" />
                    Sincronizar Status
                  </button>
                  <button
                    v-if="!isAddingCompany"
                    class="bg-[#009ef7] hover:bg-[#008be0] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                    @click="isAddingCompany = true"
                  >
                    <CreditCard :size="16" />
                    + Adicionar Empresa
                  </button>
                </div>
              </div>

              <!-- Formulário de Nova Empresa (Inline Modal) -->
              <div
                v-if="isAddingCompany"
                class="bg-blue-50/50 rounded-3xl p-8 border border-blue-100 flex flex-col gap-6 animate-fade-in"
              >
                <div class="mb-8">
                  <h3 class="text-xl font-black text-slate-900">
                    Cadastre uma nova empresa e gere a assinatura.
                  </h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-3">
                    <label class="text-xs font-black uppercase tracking-widest text-slate-400">
                      Razão Social / Nome
                    </label>
                    <input
                      v-model="newCompanyForm.name"
                      type="text"
                      class="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                  </div>
                  <div class="space-y-3">
                    <label class="text-xs font-black uppercase tracking-widest text-slate-400">
                      CNPJ / CPF
                    </label>
                    <input
                      v-model="newCompanyForm.cnpj"
                      class="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                      type="text"
                      maxlength="18"
                      @input="handleCnpjInput($event, 'new')"
                    />
                  </div>
                </div>
                <div class="flex gap-4 justify-end mt-2">
                  <button
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                    @click="isAddingCompany = false"
                  >
                    Cancelar
                  </button>
                  <button
                    :disabled="isLoading"
                    class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all flex items-center gap-2"
                    @click="handleAddCompany"
                  >
                    Confirmar e Gerar Assinatura
                  </button>
                </div>
              </div>

              <!-- Lista de Empresas -->
              <div class="space-y-6">
                <div
                  v-for="company in companies"
                  :key="company._id"
                  class="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div class="flex items-center gap-6">
                    <div
                      class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0"
                    >
                      <CreditCard :size="32" />
                    </div>
                    <div v-if="editingCompanyId === company._id" class="flex-1 space-y-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1">
                          <label class="text-[10px] font-black uppercase text-slate-400">
                            Nome da Empresa
                          </label>
                          <input
                            v-model="editCompanyForm.name"
                            type="text"
                            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                          />
                        </div>
                        <div class="space-y-1">
                          <label class="text-[10px] font-black uppercase text-slate-400">
                            CNPJ
                          </label>
                          <input
                            v-model="editCompanyForm.cnpj"
                            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                            type="text"
                            maxlength="18"
                            @input="handleCnpjInput($event, 'edit')"
                          />
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button
                          class="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest"
                          @click="handleUpdateCompany"
                        >
                          Salvar
                        </button>
                        <button
                          class="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest"
                          @click="editingCompanyId = null"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                    <div v-else class="flex-1">
                      <div class="flex items-center gap-3">
                        <p
                          class="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 inline-block mb-1"
                        >
                          {{ company.cnpj }}
                        </p>
                        <button
                          class="text-slate-300 hover:text-blue-500 transition-colors"
                          title="Editar Dados"
                          @click="startEditCompany(company)"
                        >
                          <Pencil :size="12" />
                        </button>
                      </div>
                      <h4 class="text-xl font-black text-slate-900">{{ company.name }}</h4>
                      <div class="flex items-center gap-3 mt-1">
                        <span class="text-[var(--metronic-primary)] font-black italic">
                          CCA.SPLIT
                        </span>
                        <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <p class="text-sm font-bold text-slate-900">
                          {{
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(company.value || 55)
                          }}
                        </p>
                        <span class="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                        <p class="text-sm font-bold text-slate-500">
                          Status:
                          <span
                            class="uppercase text-xs"
                            :class="
                              company.paymentStatus === 'paid'
                                ? 'text-[var(--metronic-success)]'
                                : (company.paymentStatus as string) === 'cancelled'
                                  ? 'text-[var(--metronic-danger)]'
                                  : 'text-amber-500'
                            "
                          >
                            {{
                              company.paymentStatus === 'paid'
                                ? 'Ativo'
                                : (company.paymentStatus as string) === 'cancelled'
                                  ? 'Cancelada'
                                  : 'Pendente'
                            }}
                          </span>
                        </p>
                      </div>
                      <div class="flex items-center gap-6 mt-3">
                        <div v-if="company.startDate" class="flex flex-col">
                          <span
                            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                          >
                            Início
                          </span>
                          <span class="text-xs font-bold text-slate-700">
                            {{ new Date(company.startDate).toLocaleDateString('pt-BR') }}
                          </span>
                        </div>
                        <div v-if="company.nextDueDate" class="flex flex-col">
                          <span
                            class="text-[10px] font-black text-slate-400 uppercase tracking-widest"
                          >
                            Próximo Vencimento
                          </span>
                          <span class="text-xs font-bold text-blue-600">
                            {{ new Date(company.nextDueDate).toLocaleDateString('pt-BR') }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3 w-full md:w-auto">
                    <a
                      v-if="company.asaasInvoiceUrl && company.paymentStatus !== 'cancelled'"
                      :href="company.asaasInvoiceUrl"
                      target="_blank"
                      class="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      Pagar Fatura Asaas
                      <ExternalLink :size="16" />
                    </a>
                    <button
                      v-if="company.asaasSubscriptionId && company.paymentStatus !== 'cancelled'"
                      :disabled="isLoading"
                      class="text-[var(--metronic-danger)] hover:bg-[var(--metronic-danger-light)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-[var(--metronic-danger)]"
                      @click="handleCancelSubscription(company.asaasSubscriptionId)"
                    >
                      Cancelar Assinatura
                    </button>
                    <span
                      v-if="company.paymentStatus === 'cancelled'"
                      class="text-[var(--metronic-danger)] bg-red-50 border border-red-100 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-center"
                    >
                      Assinatura Cancelada
                    </span>
                  </div>
                </div>
                <div
                  v-if="companies.length === 0"
                  class="text-center p-10 border border-dashed border-slate-200 rounded-3xl"
                >
                  <p class="text-slate-400 font-bold">Nenhuma empresa encontrada.</p>
                </div>
              </div>
            </div>

            <!-- Tab: Encerrar Conta -->
            <div v-else-if="activeTab === 'account'" class="p-10 space-y-8 animate-fade-in">
              <div class="border-b border-red-50 pb-6">
                <h4 class="text-xl font-black text-red-600 tracking-tight flex items-center gap-2">
                  <AlertTriangle :size="24" />
                  Encerrar Conta
                </h4>
                <p class="text-slate-400 text-sm font-medium mt-1">
                  Gerenciamento de encerramento de conta e exclusão permanente de dados.
                </p>
              </div>

              <div
                class="flex flex-col md:flex-row items-center justify-between p-8 rounded-3xl bg-red-50 border border-red-100 gap-6"
              >
                <div class="space-y-1 text-center md:text-left">
                  <h5 class="text-lg font-black text-red-900">Encerrar Hub Corporativo</h5>
                  <p class="text-sm text-red-700/60 font-medium max-w-md">
                    Ao confirmar o encerramento, todos os seus dados (clientes, contratos e
                    histórico) serão removidos permanentemente. Esta ação não pode ser desfeita.
                  </p>
                </div>
                <button
                  :disabled="isLoading"
                  class="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center gap-3 whitespace-nowrap"
                  @click="handleDeleteHub"
                >
                  <Trash2 :size="18" />
                  Confirmar Encerramento
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de Confirmação de Exclusão -->
    <transition name="fade">
      <div
        v-if="showDeleteConfirmation"
        class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
      >
        <div
          class="bg-white rounded-[30px] w-full max-w-md p-10 shadow-2xl animate-fade-in border border-red-50"
        >
          <div class="flex flex-col items-center text-center space-y-6">
            <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle :size="40" class="text-red-600" />
            </div>

            <div class="space-y-2">
              <h3 class="text-2xl font-black text-slate-900">Confirmar Encerramento</h3>
              <p class="text-slate-500 text-sm font-medium">
                Esta ação é **irreversível**. Tem certeza que deseja apagar todos os seus dados
                permanentemente?
              </p>
            </div>

            <div class="flex flex-col w-full gap-3 mt-6">
              <button
                :disabled="isLoading"
                class="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95"
                @click="confirmDeleteHub"
              >
                Sim, Encerrar Permanentemente
              </button>
              <button
                class="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                @click="showDeleteConfirmation = false"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-bounce-subtle {
  animation: bounceSubtle 0.5s ease-out;
}

@keyframes bounceSubtle {
  0% {
    transform: translate(-50%, -20px);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, 5px);
  }
  100% {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
