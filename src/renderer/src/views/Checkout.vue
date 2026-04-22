<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import db, { User, getWorkDB, AppConfig } from '../database/pouch'

const router = useRouter()
const session = JSON.parse(localStorage.getItem('cca_session') || '{}')
const invoiceUrl = ref(session.invoiceUrl || '')
const subscriptionId = ref(session.subscriptionId || '')
const isChecking = ref(false)
const isGeneratingLink = ref(false)
const status = ref('pending')
const error = ref('')

let checkInterval: ReturnType<typeof setInterval> | null = null

const generatePaymentLink = async (): Promise<void> => {
  isGeneratingLink.value = true
  error.value = ''

  try {
    const workDB = getWorkDB()
    const config = await workDB.get<AppConfig>('config:main')

    if (!config || !config.cnpj) {
      throw new Error('Dados da empresa não encontrados no banco local.')
    }

    const asaasResult = await window.api.asaas.setupPayment({
      name: session.name,
      email: session.email,
      cpfCnpj: config.cnpj,
      mobilePhone: config.phone || ''
    })

    if (asaasResult.success) {
      // Atualizar Banco Local AuthDB
      const userId = session.id
      const user = await db.get<User>(userId)
      await db.put({
        ...user,
        asaasCustomerId: asaasResult.customerId,
        asaasSubscriptionId: asaasResult.subscriptionId,
        asaasInvoiceUrl: asaasResult.invoiceUrl
      })

      // Atualizar referências e sessão
      subscriptionId.value = asaasResult.subscriptionId
      invoiceUrl.value = asaasResult.invoiceUrl

      session.subscriptionId = asaasResult.subscriptionId
      session.invoiceUrl = asaasResult.invoiceUrl
      localStorage.setItem('cca_session', JSON.stringify(session))

      // Iniciar verificações
      checkPaymentStatus()
      if (checkInterval) clearInterval(checkInterval)
      checkInterval = setInterval(checkPaymentStatus, 10000)
    } else {
      error.value = 'Falha ao conectar com o Asaas: ' + asaasResult.error
    }
  } catch (err: unknown) {
    console.error(err)
    error.value = (err as Error).message || 'Erro ao tentar gerar o link de pagamento.'
  } finally {
    isGeneratingLink.value = false
  }
}

const checkPaymentStatus = async (): Promise<void> => {
  if (!subscriptionId.value) return
  isChecking.value = true
  error.value = ''

  try {
    const result = await window.api.asaas.getSubscriptionStatus(subscriptionId.value)
    if (result.success) {
      status.value = result.paymentStatus?.toLowerCase() || 'pending'

      // Só libera o acesso se o pagamento estiver confirmado/recebido
      if (result.isPaid) {
        // Atualizar Banco Local
        const userId = session.id
        const user = await db.get<User>(userId)
        await db.put({
          ...user,
          paymentStatus: 'paid'
        })

        // Atualizar Sessão
        session.isPaid = true
        session.paymentStatus = 'paid'
        localStorage.setItem('cca_session', JSON.stringify(session))

        // Redirecionar com um pequeno delay para o usuário ver a confirmação
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } else {
      error.value = 'Erro ao verificar status: ' + result.error
    }
  } catch (err) {
    console.error(err)
  } finally {
    isChecking.value = false
  }
}

const openCheckout = (): void => {
  if (invoiceUrl.value) {
    window.open(invoiceUrl.value, '_blank')
  }
}

const handleLogout = async (): Promise<void> => {
  if (checkInterval) clearInterval(checkInterval)
  localStorage.removeItem('cca_session')
  router.push('/login')
}

onMounted(() => {
  if (!subscriptionId.value) {
    error.value =
      'Seu link de pagamento ainda não foi gerado ou houve uma falha de conexão anterior. Clique no botão abaixo para gerar seu acesso ao Asaas.'
    return
  }

  // Verificar imediatamente
  checkPaymentStatus()

  // Polling a cada 10 segundos
  checkInterval = setInterval(checkPaymentStatus, 10000)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>

<template>
  <div class="h-screen bg-slate-950 flex items-center justify-center p-6 selection:bg-blue-500/30">
    <!-- Background Decor -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      <div
        class="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"
      ></div>
    </div>

    <div
      class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in"
    >
      <div class="flex flex-col items-center text-center">
        <!-- Icon -->
        <div
          class="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse-soft"
        >
          <svg
            class="w-10 h-10 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>

        <h2 class="text-2xl font-bold text-white mb-2">Quase lá!</h2>
        <p class="text-slate-400 mb-8">
          Sua conta foi criada com sucesso. Para começar a usar o
          <strong>CCA. Split</strong>, realize o pagamento da primeira mensalidade.
        </p>

        <!-- Status Card -->
        <div class="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 mb-8">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold uppercase tracking-widest text-slate-500"
              >Status do Pagamento</span
            >
            <span
              class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter"
              :class="{
                'bg-amber-500/10 text-amber-500': status === 'pending',
                'bg-blue-500/10 text-blue-500': status === 'confirmed',
                'bg-emerald-500/10 text-emerald-500': status === 'received'
              }"
            >
              {{
                status === 'pending'
                  ? 'Aguardando'
                  : status === 'confirmed'
                    ? 'Confirmado'
                    : status === 'received'
                      ? 'Recebido'
                      : 'Verificando'
              }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-2 h-2 rounded-full animate-pulse"
              :class="{
                'bg-amber-500': status === 'pending',
                'bg-blue-500': status === 'confirmed',
                'bg-emerald-500': status === 'received'
              }"
            ></div>
            <p class="text-sm text-slate-300">
              {{
                status === 'pending'
                  ? 'Buscando confirmação no Asaas...'
                  : status === 'confirmed'
                    ? 'Pagamento identificado! Liberando...'
                    : status === 'received'
                      ? 'Pagamento recebido com sucesso!'
                      : 'Atualizando status...'
              }}
            </p>
          </div>
        </div>

        <div class="w-full space-y-4">
          <button
            v-if="subscriptionId"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            @click="openCheckout"
          >
            Pagar Agora no Asaas
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>

          <button
            v-else
            :disabled="isGeneratingLink"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            @click="generatePaymentLink"
          >
            <svg
              v-if="isGeneratingLink"
              class="animate-spin h-5 w-5 text-white"
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
            <span v-else>Gerar Link de Pagamento Segura</span>
          </button>

          <button
            v-if="subscriptionId"
            :disabled="isChecking"
            class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            @click="checkPaymentStatus"
          >
            <svg
              v-if="isChecking"
              class="animate-spin h-5 w-5 text-slate-400"
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
            <span v-else>Já realizei o pagamento</span>
          </button>
        </div>

        <div v-if="error" class="mt-6 w-full space-y-3">
          <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
            <p class="text-xs text-red-400 font-medium text-center leading-relaxed">
              {{ error }}
            </p>
          </div>
          <button
            class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
            @click="handleLogout"
          >
            Sair e Voltar Novamente
          </button>
        </div>

        <footer class="mt-8 pt-6 border-t border-slate-800 w-full">
          <p class="text-slate-500 text-[10px] uppercase tracking-widest leading-loose">
            Após a confirmação pelo Asaas, seu acesso ao painel será liberado instantaneamente.
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

@keyframes pulse-soft {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

.animate-pulse-soft {
  animation: pulse-soft 3s ease-in-out infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
