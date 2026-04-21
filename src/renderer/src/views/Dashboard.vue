<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AppConfig, getWorkDB, closeSession } from '../database/pouch'
import {
  BarChart3,
  Users2,
  Receipt,
  ArrowUpRight,
  Plus,
  Compass,
  ArrowUpCircle
} from 'lucide-vue-next'

const router = useRouter()

interface UserSession {
  id: string
  name: string
  role: string
  email: string
  company?: string
  subscriptionId?: string
}

const isCancelling = ref(false)
const cancelError = ref('')

const user = ref<UserSession | null>(null)
const config = ref<AppConfig | null>(null)

const handleLogout = async (): Promise<void> => {
  await closeSession()
  router.push('/login')
}

onMounted(async () => {
  const session = localStorage.getItem('cca_session')
  if (session) {
    user.value = JSON.parse(session)
  }

  try {
    const workDB = getWorkDB()
    const doc = await workDB.get<AppConfig>('config:main')
    config.value = doc
  } catch {
    console.warn('Config não encontrada no banco de trabalho')
  }
})

const handleCancelSubscription = async (): Promise<void> => {
  if (!user.value?.subscriptionId) return
  const confirmed = confirm(
    'Tem certeza que deseja cancelar sua assinatura? Você perderá o acesso ao sistema imediatamente após o cancelamento.'
  )
  if (!confirmed) return

  isCancelling.value = true
  cancelError.value = ''

  try {
    const result = await window.api.asaas.cancelSubscription(user.value.subscriptionId)
    if (result.success) {
      alert('Assinatura cancelada com sucesso.')
      handleLogout()
    } else {
      cancelError.value = 'Erro ao cancelar: ' + result.error
    }
  } catch (err) {
    console.error(err)
    cancelError.value = 'Ocorreu um erro inesperado.'
  } finally {
    isCancelling.value = false
  }
}
</script>

<template>
  <div class="h-full bg-slate-50 text-slate-900 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm">
      <div class="mb-10">
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          CCA<span class="text-blue-600">.</span> Split
        </h1>
      </div>

      <nav class="flex-1 space-y-1">
        <div
          class="p-3 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-100 flex items-center gap-3 transition-all cursor-default"
        >
          <Compass :size="18" />
          Panorama Geral
        </div>
        <div
          class="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center gap-3"
        >
          <Users2 :size="18" />
          Clientes
        </div>
        <div
          class="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center gap-3"
        >
          <Receipt :size="18" />
          Time de Especialistas
        </div>
        <div
          class="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center gap-3"
        >
          <BarChart3 :size="18" />
          Gestão de Repasses
        </div>
        <router-link
          to="/dashboard/sales"
          class="p-3 text-blue-600 hover:bg-blue-50 bg-white border border-transparent hover:border-blue-100 rounded-xl transition-all flex items-center gap-3 group"
        >
          <ArrowUpCircle :size="18" class="group-hover:rotate-12 transition-transform" />
          <span class="font-bold">Upgrade & Planos</span>
        </router-link>
      </nav>

      <div class="pt-6 border-t border-slate-100">
        <div
          v-if="user"
          class="flex items-center gap-3 mb-4 p-2 bg-slate-50 rounded-2xl border border-slate-100"
        >
          <div
            class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold"
          >
            {{ user.name.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold truncate text-slate-900">{{ user.name }}</p>
            <p class="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              {{ user.role }}
            </p>
          </div>
        </div>
        <button
          class="w-full text-left p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center font-bold text-xs uppercase tracking-widest border border-transparent hover:border-red-100"
          @click="handleLogout"
        >
          Sair do Sistema
        </button>
        <div
          class="mt-6 text-[9px] uppercase tracking-wider text-slate-400 text-center font-medium leading-relaxed"
        >
          Powered by<br />
          <span class="text-slate-500 font-bold">CCA Contabilidade e RKS Tech Solution</span>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-10 overflow-auto">
      <header class="flex justify-between items-start mb-10">
        <div>
          <h2 class="text-3xl font-bold text-slate-900">Olá, {{ user?.name }}</h2>
          <p class="text-slate-500 mt-1">
            Organização:
            <span class="text-blue-600 font-bold">{{
              config?.companyName || 'Não configurado'
            }}</span>
          </p>
        </div>

        <div class="flex gap-4">
          <div class="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
            <p class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
              Plano Profissional
            </p>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p class="text-sm font-bold text-slate-900">Ativo</p>
            </div>
          </div>
          <button
            :disabled="isCancelling"
            class="bg-white border border-red-100 hover:bg-red-50 text-red-600 px-4 py-3 rounded-2xl shadow-sm text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            @click="handleCancelSubscription"
          >
            <svg
              v-if="isCancelling"
              class="animate-spin h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Cancelar Assinatura
          </button>
        </div>
      </header>

      <div
        v-if="cancelError"
        class="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium animate-shake"
      >
        {{ cancelError }}
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- Stats Cards -->
        <div
          class="relative bg-white border border-slate-200 p-8 rounded-[2.5rem] group hover:border-blue-500/30 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden"
        >
          <div
            class="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-blue-50 transition-colors"
          >
            <ArrowUpRight :size="48" />
          </div>
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 relative z-10">
            Total em Cobranças
          </p>
          <p
            class="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors relative z-10"
          >
            R$ 0,00
          </p>
        </div>

        <div
          class="relative bg-white border border-slate-200 p-8 rounded-[2.5rem] group hover:border-blue-500/30 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden"
        >
          <div
            class="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-blue-50 transition-colors"
          >
            <Receipt :size="48" />
          </div>
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 relative z-10">
            Aguardando Pagamento
          </p>
          <p
            class="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors relative z-10"
          >
            0
          </p>
        </div>

        <div
          class="relative bg-white border border-slate-200 p-8 rounded-[2.5rem] group hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden"
        >
          <div
            class="absolute top-0 right-0 p-6 text-slate-100 group-hover:text-emerald-50 transition-colors"
          >
            <BarChart3 :size="48" />
          </div>
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 relative z-10">
            Próximos Splits
          </p>
          <p
            class="text-4xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors relative z-10"
          >
            R$ 0,00
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div class="mt-10 bg-white border border-slate-200 rounded-3xl p-20 text-center shadow-sm">
        <div
          class="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-300 group-hover:rotate-6 transition-transform"
        >
          <Plus :size="32" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Pronto para escalar seu lucro?</h3>
        <p class="text-slate-500 max-w-sm mx-auto mb-8">
          Comece configurando sua rede de talentos e vincule seus primeiros clientes para
          automatizar as divisões e proteger sua margem.
        </p>
        <button
          class="bg-slate-100 text-slate-400 px-8 py-3 rounded-xl font-bold transition-all opacity-50 cursor-not-allowed border border-slate-200"
        >
          Novo Cliente
        </button>
      </div>
    </main>
  </div>
</template>
