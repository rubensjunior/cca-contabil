<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AppConfig, getWorkDB, closeSession } from '../database/pouch'

const router = useRouter()

interface UserSession {
  id: string
  name: string
  role: string
  email: string
  office?: string
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
          class="p-3 bg-blue-50 text-blue-700 rounded-xl font-bold border border-blue-100 flex items-center gap-3 transition-all"
        >
          <div class="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          Dashboard
        </div>
        <div
          class="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center gap-3"
        >
          <div class="w-1.5 h-6 bg-transparent"></div>
          Clientes
        </div>
        <div
          class="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center gap-3"
        >
          <div class="w-1.5 h-6 bg-transparent"></div>
          Contadores
        </div>
        <div
          class="p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center gap-3"
        >
          <div class="w-1.5 h-6 bg-transparent"></div>
          Pagamentos
        </div>
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
          class="w-full text-left p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2 font-medium"
          @click="handleLogout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clip-rule="evenodd"
            />
          </svg>
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
            Escritório:
            <span class="text-blue-600 font-bold">{{
              config?.officeName || 'Não configurado'
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
          class="bg-white border border-slate-200 p-8 rounded-3xl group hover:border-blue-500/30 transition-all shadow-sm hover:shadow-md"
        >
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            Total em Cobranças
          </p>
          <p class="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            R$ 0,00
          </p>
        </div>
        <div
          class="bg-white border border-slate-200 p-8 rounded-3xl group hover:border-blue-500/30 transition-all shadow-sm hover:shadow-md"
        >
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            Aguardando Pagamento
          </p>
          <p class="text-3xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            0
          </p>
        </div>
        <div
          class="bg-white border border-slate-200 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md"
        >
          <p class="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            Próximos Splits
          </p>
          <p
            class="text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors"
          >
            R$ 0,00
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div class="mt-10 bg-white border border-slate-200 rounded-3xl p-20 text-center shadow-sm">
        <div
          class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2">Inicie configurando um cliente</h3>
        <p class="text-slate-500 max-w-sm mx-auto mb-8">
          Para começar a gerenciar os repasses (splits), você precisa cadastrar seus clientes e
          vincular contadores responsáveis.
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
