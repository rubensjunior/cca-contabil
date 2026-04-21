<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import db, { initializeDB, User, initUserSession } from '../database/pouch'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

const handleLogin = async (): Promise<void> => {
  isLoading.value = true
  error.value = ''

  try {
    // Garantir que o admin padrão exista para testes
    await initializeDB()

    const userId = `user:${email.value}`
    const user = await db.get<User>(userId)

    if (user && user.passwordHash === password.value) {
      if (user.status !== 'active') {
        error.value = 'Esta conta está inativa.'
        return
      }

      // Inicializar banco de dados do Tenant
      initUserSession(user.tenantId)

      // Simular sessão local
      localStorage.setItem(
        'cca_session',
        JSON.stringify({
          id: user._id,
          tenantId: user.tenantId,
          name: user.name,
          role: user.role,
          email: user.email
        })
      )

      router.push('/dashboard')
    } else {
      error.value = 'Credenciais inválidas.'
    }
  } catch (err: unknown) {
    const errorMsg = err as { status?: number }
    if (errorMsg.status === 404) {
      error.value = 'Usuário não encontrado.'
    } else {
      error.value = 'Erro ao realizar login. Tente novamente.'
    }
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="h-full bg-white flex selection:bg-blue-500/30 overflow-hidden">
    <!-- Lado Esquerdo: Formulário -->
    <div
      class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:px-24 bg-white relative overflow-hidden"
    >
      <div class="w-full max-w-md flex flex-col items-center animate-fade-in-up">
        <!-- Logo Typography Corporate -->
        <div class="mb-8 text-center flex flex-col items-center">
          <div class="inline-flex items-center justify-center mb-4">
            <h1 class="text-4xl font-bold tracking-tight text-slate-900">
              CCA<span class="text-blue-600">.</span> Split
            </h1>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Bem-vindo de volta</h2>
          <p class="text-slate-500 mt-1">Acesse sua plataforma de contabilidade digital</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div
            v-if="error"
            class="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm text-center font-medium"
          >
            {{ error }}
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
              >E-mail Corporativo</label
            >
            <input
              v-model="email"
              type="email"
              required
              placeholder="seu@email.com"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
            />
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center px-1">
              <label class="text-xs font-bold uppercase tracking-widest text-slate-400"
                >Senha</label
              >
              <a
                href="#"
                class="text-[10px] uppercase tracking-widest text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >Esqueceu?</a
              >
            </div>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 flex items-center justify-center gap-3 mt-8"
          >
            <span v-if="!isLoading">Acessar Painel</span>
            <span v-else class="flex items-center gap-2">
              <svg
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
              Autenticando...
            </span>
          </button>
        </form>

        <footer class="mt-8 pt-6 border-t border-slate-100">
          <p class="text-slate-500 text-sm text-center">
            Ainda não tem acesso?
            <router-link
              to="/signup"
              class="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1"
            >
              Solicite uma conta
            </router-link>
          </p>
        </footer>
      </div>

      <!-- Branding Footer Highlighted -->
      <div class="mt-12 pt-8 border-t border-slate-50 w-full flex flex-col items-center">
        <p class="text-[8px] uppercase tracking-[0.3em] text-slate-400 mb-4 font-bold">
          Desenvolvido e mantido por
        </p>
        <div class="flex items-center gap-8 opacity-80 hover:opacity-100 transition-opacity">
          <div class="flex flex-col items-center">
            <span class="text-xs font-black text-slate-900 tracking-tight">CCA CONTABILIDADE</span>
          </div>
          <div class="w-px h-4 bg-slate-200"></div>
          <div class="flex flex-col items-center">
            <span class="text-xs font-black text-blue-600 tracking-tight">RKS TECH SOLUTION</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lado Direito: Conteúdo / Visual -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-indigo-500/20 to-blue-400/30 animate-gradient"
      ></div>
      <div
        class="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"
      ></div>
      <div
        class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed"
      ></div>

      <div class="relative z-10 w-full flex flex-col justify-center px-16 xl:px-24">
        <div class="max-w-lg">
          <div class="w-12 h-1 bg-blue-500 mb-8 rounded-full"></div>
          <h3 class="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Gestão inteligente para sua <br />
            <span class="text-blue-400">contabilidade digital.</span>
          </h3>
          <p class="text-slate-400 mt-6 text-lg leading-relaxed">
            Controle cobranças, automatize splits de pagamentos e gerencie seu escritório com a
            eficiência que a tecnologia proporciona.
          </p>

          <div class="mt-12 grid grid-cols-2 gap-8">
            <div class="space-y-2">
              <div class="text-blue-400 font-bold text-2xl">99.9%</div>
              <div class="text-slate-500 text-xs uppercase tracking-widest font-semibold">
                Disponibilidade
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-blue-400 font-bold text-2xl">24/7</div>
              <div class="text-slate-500 text-xs uppercase tracking-widest font-semibold">
                Monitoramento
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overlays ou Elementos Decorativos -->
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

@keyframes pulse-soft {
  0%,
  100% {
    opacity: 0.05;
  }
  50% {
    opacity: 0.15;
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 8s ease-in-out infinite;
  animation-delay: 2s;
}

.animate-pulse-soft {
  animation: pulse-soft 4s ease-in-out infinite;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 300% 300%;
  animation: gradientBG 12s ease infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #f1f5f9;
  -webkit-box-shadow: 0 0 0px 1000px #020617 inset;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
