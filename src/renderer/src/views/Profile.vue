<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import db, { User, getWorkDB, closeSession } from '../database/pouch'
import {
  ShieldCheck,
  CreditCard,
  Trash2,
  Home,
  Save,
  AlertTriangle,
  ExternalLink
} from 'lucide-vue-next'
import { PhUser, PhShieldCheck, PhCreditCard, PhTrash } from '@phosphor-icons/vue'

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
      } catch (err) {
        console.error('Erro ao carregar usuário:', err)
      }
    }
  }
})

const showMessage = (text: string, type: 'success' | 'error'): void => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 5000)
}

const handleSavePersonal = async (): Promise<void> => {
  if (!currentUser.value) return
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

const handleCancelSubscription = async (): Promise<void> => {
  if (!currentUser.value?.asaasSubscriptionId) return

  if (
    !confirm(
      'Tem certeza que deseja cancelar sua assinatura? O acesso ao sistema será interrompido após o período atual.'
    )
  )
    return

  isLoading.value = true
  try {
    const result = await window.api.asaas.cancelSubscription(currentUser.value.asaasSubscriptionId)
    if (result.success) {
      const updatedUser = {
        ...currentUser.value,
        status: 'inactive' as const,
        updatedAt: new Date().toISOString()
      }
      await db.put(updatedUser)
      currentUser.value = updatedUser
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

  const confirmation = prompt(
    'ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os dados do seu Hub (clientes, contratos, pagamentos) serão apagados permanentemente. Digite "EXCLUIR" para confirmar:'
  )

  if (confirmation !== 'EXCLUIR') return

  isLoading.value = true
  try {
    // 1. Destruir banco de dados de trabalho (workDB)
    const workDB = getWorkDB()
    await workDB.destroy()

    // 2. Tentar cancelar assinatura se existir
    if (currentUser.value.asaasSubscriptionId) {
      await window.api.asaas.cancelSubscription(currentUser.value.asaasSubscriptionId)
    }

    // 3. Remover usuário do AuthDB
    if (currentUser.value?._id && currentUser.value?._rev) {
      await db.remove(currentUser.value._id, currentUser.value._rev)
    }

    // 4. Limpar sessão e sair
    await closeSession()
    router.push('/login')
  } catch (err) {
    console.error('Erro ao excluir Hub:', err)
    showMessage('Erro crítico ao excluir Hub. Entre em contato com o suporte.', 'error')
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
            <span class="text-white brand-logo text-xl tracking-tight leading-4"
              >CCA.SPLIT</span
            >
            <span
              class="text-[10px] text-[var(--metronic-sidebar-text)] font-bold uppercase tracking-[0.2em] opacity-40 mt-1"
              >HUB CORPORATIVO</span
            >
          </div>
        </router-link>
      </div>

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
            activeTab === 'danger'
              ? 'bg-[#1b1b28] text-white'
              : 'text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white'
          "
          @click="activeTab = 'danger'"
        >
          <PhTrash :size="20" :weight="activeTab === 'danger' ? 'fill' : 'bold'" />
          <span class="text-[13px] font-bold">Zona de Perigo</span>
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
              <div>
                <h4 class="text-xl font-black text-slate-800 tracking-tight">Sua Assinatura</h4>
                <p class="text-slate-400 text-sm font-medium">
                  Gerencie seu plano e pagamentos via Asaas.
                </p>
              </div>

              <div
                class="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div class="flex items-center gap-6">
                  <div
                    class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white"
                  >
                    <CreditCard :size="32" />
                  </div>
                  <div>
                    <p
                      class="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 inline-block mb-1"
                    >
                      Plano Profissional
                    </p>
                    <p class="text-2xl font-black text-slate-900">
                      R$ 55,00<span class="text-xs font-bold text-slate-400 ml-1">/mês</span>
                    </p>
                    <p class="text-sm font-bold text-slate-500 mt-1">
                      Status:
                      <span class="text-[var(--metronic-success)] uppercase text-xs">{{
                        currentUser?.status === 'active' ? 'Ativo' : 'Inativo'
                      }}</span>
                    </p>
                  </div>
                </div>

                <div class="flex flex-col gap-3 w-full md:w-auto">
                  <a
                    v-if="currentUser?.asaasInvoiceUrl"
                    :href="currentUser.asaasInvoiceUrl"
                    target="_blank"
                    class="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Ver Fatura Atual
                    <ExternalLink :size="16" />
                  </a>
                  <button
                    :disabled="isLoading || currentUser?.status !== 'active'"
                    class="text-[var(--metronic-danger)] hover:bg-[var(--metronic-danger-light)] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-[var(--metronic-danger)]"
                    @click="handleCancelSubscription"
                  >
                    Cancelar Assinatura
                  </button>
                </div>
              </div>
            </div>

            <!-- Tab: Danger Zone -->
            <div v-else-if="activeTab === 'danger'" class="p-10 space-y-8 animate-fade-in">
              <div class="border-b border-red-50 pb-6">
                <h4 class="text-xl font-black text-red-600 tracking-tight flex items-center gap-2">
                  <AlertTriangle :size="24" />
                  Zona de Perigo
                </h4>
                <p class="text-slate-400 text-sm font-medium mt-1">
                  Ações destrutivas e irreversíveis para o seu negócio.
                </p>
              </div>

              <div
                class="flex flex-col md:flex-row items-center justify-between p-8 rounded-3xl bg-red-50 border border-red-100 gap-6"
              >
                <div class="space-y-1 text-center md:text-left">
                  <h5 class="text-lg font-black text-red-900">Excluir Hub Permanentemente</h5>
                  <p class="text-sm text-red-700/60 font-medium max-w-md">
                    Isso apagará todos os clientes, contatos, dados financeiros e sua conta de
                    acesso. Não há como desfazer esta ação.
                  </p>
                </div>
                <button
                  :disabled="isLoading"
                  class="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center gap-3 whitespace-nowrap"
                  @click="handleDeleteHub"
                >
                  <Trash2 :size="18" />
                  Apagar Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
