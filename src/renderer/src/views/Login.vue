<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import db, { initializeDB, User, initUserSession } from '../database/pouch'
import { LogIn } from 'lucide-vue-next'
import { PhShieldCheckered, PhChartLineUp, PhCoins } from '@phosphor-icons/vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
)

const router = useRouter()
const email = ref('')
const password = ref('')
import { onMounted, onUnmounted } from 'vue'

const isLoading = ref(false)
const error = ref('')

// Lógica do Carrossel de autoridade
const currentSlide = ref(0)
const slides = [
  {
    id: 1,
    title: 'Escale sem o peso da',
    highlight: 'Bitributação.',
    icon: PhCoins,
    description:
      'A escalabilidade do seu modelo de negócio não deve ser limitada por impostos desnecessários. No modelo tradicional, você tributa o faturamento bruto — inclusive o que repassa. Com o CCA. Split, você opera um hub onde a divisão acontece na fonte, protegendo sua margem real.',
    type: 'chart-economy'
  },
  {
    id: 2,
    title: 'Proteja sua margem com',
    highlight: 'Inteligência.',
    icon: PhChartLineUp,
    description:
      'Não permita que a complexidade operacional drene sua lucratividade. Com a automação obrigatória, cada real da sua operação é rastreado e protegido. Elimine erros manuais e tenha o controle absoluto da saúde financeira do seu Hub em um só lugar.',
    type: 'chart-performance-apex'
  },
  {
    id: 3,
    title: 'Gestão de Especialistas',
    highlight: 'Blindada.',
    icon: PhShieldCheckered,
    description:
      'Garanta segurança jurídica absoluta para sua rede de especialistas parceiros. Nossa estrutura foi desenhada para facilitar o compliance e a transparência total na relação entre Empresa, Parceiro e Cliente Final.',
    type: 'benefits'
  }
]

// Configurações ApexCharts (Dobragem de Possibilidades)
const apexPerformanceOptions = {
  chart: {
    type: 'area',
    toolbar: { show: false },
    sparkline: { enabled: true }
  },
  stroke: { curve: 'smooth', width: 3, colors: ['#facc15'] },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [20, 100, 100, 100]
    }
  },
  tooltip: { enabled: false },
  colors: ['#facc15']
}

const apexPerformanceSeries = [
  {
    name: 'Lucratividade',
    data: [31, 40, 28, 51, 42, 109, 100]
  }
]

// Configurações dos Gráficos
const economyChartData = {
  labels: ['Tradicional', 'CCA. Split'],
  datasets: [
    {
      label: 'Carga Tributária',
      data: [85, 40],
      backgroundColor: ['rgba(148, 163, 184, 0.2)', 'rgba(250, 204, 21, 0.9)'],
      borderRadius: 12,
      borderWidth: 0,
      barThickness: 45
    }
  ]
}

const economyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }
  },
  scales: {
    y: { display: false, grid: { display: false } },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' as const } }
    }
  }
}

let slideInterval: ReturnType<typeof setInterval> | null = null

const startSlideShow = (): void => {
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 10000)
}

const stopSlideShow = (): void => {
  if (slideInterval) clearInterval(slideInterval)
}

const setSlide = (index: number): void => {
  currentSlide.value = index
  stopSlideShow()
  startSlideShow()
}

onMounted(() => {
  startSlideShow()
})

onUnmounted(() => {
  stopSlideShow()
})

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

      // Simular sessão local com dados de pagamento
      localStorage.setItem(
        'cca_session',
        JSON.stringify({
          id: user._id,
          tenantId: user.tenantId,
          name: user.name,
          role: user.role,
          email: user.email,
          subscriptionId: user.asaasSubscriptionId,
          invoiceUrl: user.asaasInvoiceUrl,
          paymentStatus: user.paymentStatus || 'pending',
          isPaid: user.paymentStatus === 'paid'
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
  <div
    class="min-h-[calc(100vh-48px)] flex-1 bg-white flex selection:bg-[#009ef7]/30 overflow-hidden"
  >
    <!-- Lado Esquerdo: Formulário -->
    <div
      class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:px-24 bg-white relative overflow-hidden"
    >
      <div class="w-full max-w-md flex flex-col items-center animate-fade-in-up">
        <!-- Logo Typography Corporate -->
        <div class="mb-8 text-center flex flex-col items-center">
          <router-link
            to="/"
            class="inline-flex items-center justify-center mb-4 transition-opacity hover:opacity-80"
          >
            <h1 class="text-4xl brand-logo tracking-tight text-slate-900">
              CCA<span class="text-blue-600">.</span> Split
            </h1>
          </router-link>
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Bem-vindo de volta</h2>
          <p class="text-slate-500 mt-1">Acesse sua plataforma de gestão colaborativa</p>
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
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#009ef7] focus:ring-4 focus:ring-[#009ef7]/10 transition-all placeholder:text-slate-400"
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
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-[#009ef7] focus:ring-4 focus:ring-[#009ef7]/10 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full h-14 bg-[#009ef7] hover:bg-[#008be0] disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-[#009ef7]/20 flex items-center justify-center gap-3 mt-8 outline-none"
          >
            <span v-if="!isLoading" class="flex items-center gap-2">
              Acessar Painel
              <LogIn :size="20" />
            </span>
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
        <div class="max-w-lg min-h-[500px] flex flex-col justify-center">
          <div class="w-12 h-1 bg-blue-500 mb-6 rounded-full"></div>

          <transition-group name="slide-fade" mode="out-in">
            <div :key="currentSlide" class="space-y-8">
              <div class="space-y-4">
                <h3 class="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
                  {{ slides[currentSlide].title }} <br />
                  <span class="text-blue-400 font-black italic">{{
                    slides[currentSlide].highlight
                  }}</span>
                </h3>
                <p class="text-slate-300 text-base leading-relaxed font-medium max-w-md">
                  {{ slides[currentSlide].description }}
                </p>
              </div>

              <!-- Conteúdo Visual Dinâmico por Slide (Upgrade Chart.js) -->
              <div v-if="slides[currentSlide].type === 'chart-economy'" class="space-y-4">
                <div
                  class="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-xl shadow-2xl"
                >
                  <div class="h-40 w-full">
                    <Bar :data="economyChartData" :options="economyChartOptions" />
                  </div>
                  <div class="mt-6 pt-6 border-t border-slate-700/50 flex items-center gap-3">
                    <p class="text-[10px] text-slate-400 leading-relaxed font-bold">
                      Economia média de
                      <span class="text-yellow-400 font-bold">15% a 35%</span> na carga tributária
                      total da operação.
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="slides[currentSlide].type === 'chart-performance-apex'" class="space-y-4">
                <div
                  class="bg-blue-600/5 border border-blue-500/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                >
                  <div class="flex items-center justify-between mb-8">
                    <div class="space-y-1">
                      <p class="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">
                        Lucratividade Média (Apex)
                      </p>
                      <p class="text-3xl font-black text-white">+24.8%</p>
                    </div>
                  </div>
                  <div class="h-32 w-full">
                    <apexchart
                      width="100%"
                      height="100%"
                      :options="apexPerformanceOptions"
                      :series="apexPerformanceSeries"
                    ></apexchart>
                  </div>
                  <div class="mt-6 pt-6 border-t border-blue-500/10 space-y-3">
                    <div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-yellow-500 w-[75%] rounded-full animate-pulse"></div>
                    </div>
                    <p class="text-[10px] text-slate-500 flex justify-between font-bold">
                      <span>MÁXIMA POSSIBILIDADE</span>
                      <span>ALTO DESEMPENHO</span>
                    </p>
                  </div>
                </div>
              </div>

              <div v-if="slides[currentSlide].type === 'benefits'" class="space-y-6">
                <div
                  class="group flex items-start gap-5 p-4 rounded-2xl bg-slate-800/20 border border-transparent hover:border-blue-500/20 transition-all"
                >
                  <div class="w-1.5 h-12 bg-blue-500/20 rounded-full shrink-0"></div>
                  <div class="space-y-1">
                    <p class="text-white font-bold">Blindagem Fiscal</p>
                    <p class="text-sm text-slate-300 leading-relaxed">
                      Estrutura jurídica desenhada para evitar a bitributação em repasses de
                      honorários.
                    </p>
                  </div>
                </div>
                <div
                  class="group flex items-start gap-5 p-4 rounded-2xl bg-slate-800/20 border border-transparent hover:border-blue-500/20 transition-all"
                >
                  <div class="w-1.5 h-12 bg-blue-500/20 rounded-full shrink-0"></div>
                  <div class="space-y-1">
                    <p class="text-white font-bold">Gestão de Talentos</p>
                    <p class="text-sm text-slate-300 leading-relaxed">
                      Monitoramento em tempo real de produtividade e repasses para sua rede PJ/PF.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>

          <!-- Indicadores do Carrossel -->
          <div class="mt-12 flex gap-3">
            <button
              v-for="(_, index) in slides"
              :key="index"
              class="w-2.5 h-2.5 rounded-full transition-all duration-300"
              :class="
                currentSlide === index ? 'bg-blue-500 w-8' : 'bg-slate-700 hover:bg-slate-600'
              "
              @click="setSlide(index)"
            ></button>
          </div>
        </div>
      </div>
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
  transition: all 0.3s ease;
}

/* Animações do Carrossel */
.slide-fade-enter-active {
  transition: all 0.6s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.6s ease-in;
  position: absolute;
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
