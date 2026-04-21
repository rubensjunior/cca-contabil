<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Users2,
  Globe2,
  Lock
} from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (): void => {
  router.push('/login')
}
const navigateToSignup = (): void => {
  router.push('/signup')
}

const features = [
  {
    icon: ShieldCheck,
    title: 'Segurança Absoluta',
    description: 'Blindagem jurídica e fiscal desenhada para proteger sua rede de especialistas.'
  },
  {
    icon: Zap,
    title: 'Split Automático',
    description: 'Divisão de honorários na fonte, eliminando a bitributação e erros manuais.'
  },
  {
    icon: BarChart3,
    title: 'Dashboards em Tempo Real',
    description: 'Controle absoluto do seu Hub de negócios com métricas precisas e atualizadas.'
  }
]
</script>

<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 selection:text-white font-sans overflow-x-hidden"
  >
    <!-- Efeitos de Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"
      ></div>
      <div
        class="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow-delayed"
      ></div>
      <div
        class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"
      ></div>
    </div>

    <!-- Header / Navbar -->
    <header class="relative z-50 border-b border-white/5 backdrop-blur-md sticky top-0">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold tracking-tight text-white">
            CCA<span class="text-blue-500">.</span> Split
          </h1>
        </div>

        <nav class="hidden md:flex items-center gap-8">
          <a href="#" class="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >Funcionalidades</a
          >
          <a href="#" class="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >Segurança</a
          >
          <a href="#" class="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >Sobre</a
          >
        </nav>

        <div class="flex items-center gap-4">
          <button
            class="text-sm font-bold text-white hover:text-blue-400 transition-colors px-4"
            @click="navigateToLogin"
          >
            Entrar
          </button>
          <button
            class="hidden sm:flex bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-600/20 items-center gap-2"
            @click="navigateToSignup"
          >
            Começar Agora
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative z-10 pt-24 pb-32 px-6 overflow-hidden">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8 animate-fade-in-left">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4"
          >
            <Zap :size="14" />
            Nova Geração de Split Contábil
          </div>

          <h2 class="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Escale seu Hub <br />
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic"
            >
              sem bitributação.
            </span>
          </h2>

          <p class="text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
            A plataforma definitiva para gestores que buscam eficiência máxima no repasse de
            honorários e segurança jurídica absoluta na gestão de especialistas.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              class="group bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-lg transition-all hover:bg-blue-50 active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-white/5"
              @click="navigateToSignup"
            >
              Criar minha conta
              <ArrowRight class="group-hover:translate-x-1 transition-transform" :size="20" />
            </button>
            <button
              class="px-8 py-4 rounded-2xl font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3"
              @click="navigateToLogin"
            >
              Acesso portal
            </button>
          </div>

          <div class="flex items-center gap-6 pt-10 text-slate-500 border-t border-white/5">
            <div class="flex flex-col">
              <span class="text-white font-bold text-xl">+R$ 2.4M</span>
              <span class="text-[10px] uppercase tracking-widest font-bold">Processados/mês</span>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="flex flex-col">
              <span class="text-white font-bold text-xl">100%</span>
              <span class="text-[10px] uppercase tracking-widest font-bold">Segurança Fiscal</span>
            </div>
          </div>
        </div>

        <!-- Hero Visual -->
        <div class="relative animate-fade-in-right">
          <div
            class="relative z-20 bg-slate-900/40 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden group"
          >
            <!-- Glassmorphism Card Mockup -->
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <div class="space-y-1">
                  <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Performance do Hub
                  </p>
                  <p class="text-3xl font-black text-white">R$ 54.290,00</p>
                </div>
                <div
                  class="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400"
                >
                  <BarChart3 :size="24" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p class="text-[10px] text-slate-500 font-bold uppercase">Repasses Efetuados</p>
                  <p class="text-xl font-bold text-emerald-400">R$ 12.400</p>
                </div>
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p class="text-[10px] text-slate-500 font-bold uppercase">Taxa de Eficiência</p>
                  <p class="text-xl font-bold text-blue-400">98.4%</p>
                </div>
              </div>

              <!-- Abstract Chart Line -->
              <div class="h-32 w-full mt-4 flex items-end gap-1">
                <div
                  v-for="h in [40, 70, 45, 90, 65, 80, 100, 85, 95]"
                  :key="h"
                  :style="{ height: h + '%' }"
                  class="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
              </div>
            </div>

            <!-- Floating Decorative Elements -->
            <div
              class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"
            ></div>
            <div
              class="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
            ></div>
          </div>

          <!-- Badge flutuante -->
          <div
            class="absolute -bottom-6 -right-6 lg:right-10 z-30 bg-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-slow"
          >
            <div
              class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"
            >
              <Users2 :size="20" />
            </div>
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase">Novos Parceiros</p>
              <p class="text-sm font-black text-slate-900">+12 esta semana</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="relative z-10 py-32 bg-white/5 backdrop-blur-sm border-y border-white/5">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center space-y-4 mb-20">
          <h2 class="text-4xl font-black text-white italic">Diferenciais Estratégicos</h2>
          <div class="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
          <p class="text-slate-400 max-w-2xl mx-auto font-medium">
            Controle total da sua operação com ferramentas pensadas para o crescimento contínuo.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all group"
          >
            <div
              class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform"
            >
              <component :is="feature.icon" :size="28" />
            </div>
            <h3 class="text-xl font-bold text-white mb-3">{{ feature.title }}</h3>
            <p class="text-slate-400 leading-relaxed text-sm font-medium">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final Section -->
    <section class="relative z-10 py-32 px-6">
      <div
        class="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 lg:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl"
      >
        <!-- Decorative patterns -->
        <div class="absolute top-0 right-0 p-8 opacity-20 rotate-12">
          <Globe2 :size="200" />
        </div>
        <div class="absolute bottom-0 left-0 p-8 opacity-20 -rotate-12">
          <Lock :size="150" />
        </div>

        <h2 class="text-4xl lg:text-5xl font-black text-white leading-tight">
          Pronto para revolucionar <br />
          seu modelo de negócio?
        </h2>
        <p class="text-blue-100 text-lg max-w-xl mx-auto font-medium">
          Junte-se a centenas de gestores que já automatizaram seus repasses e escalaram sua
          operação com o CCA. Split.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            class="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-xl hover:bg-slate-100 transition-all active:scale-95 shadow-xl"
            @click="navigateToSignup"
          >
            Começar Agora Grátis
          </button>
          <button
            class="bg-blue-700/50 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-2xl font-black text-xl hover:bg-blue-700/70 transition-all active:scale-95"
            @click="navigateToLogin"
          >
            Falar com Especialista
          </button>
        </div>
      </div>
    </section>

    <!-- Branding Footer -->
    <footer class="relative z-10 py-12 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <h2 class="text-xl font-bold text-white mb-8">
          CCA<span class="text-blue-500">.</span> Split
        </h2>
        <div class="flex flex-col items-center">
          <p class="text-[8px] uppercase tracking-[0.3em] text-slate-500 mb-4 font-bold">
            Desenvolvido e mantido por
          </p>
          <div class="flex items-center gap-8 opacity-60">
            <span class="text-[10px] font-black text-white tracking-tight uppercase"
              >CCA Contabilidade</span
            >
            <div class="w-px h-4 bg-white/20"></div>
            <span class="text-[10px] font-black text-blue-500 tracking-tight uppercase"
              >RKS Tech Solution</span
            >
          </div>
        </div>
        <p class="mt-12 text-slate-600 text-[10px] font-medium tracking-wider">
          © 2026 CCA Split. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.15;
    transform: scale(1.1);
  }
}

@keyframes pulse-slow-delayed {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(1.1);
  }
  50% {
    opacity: 0.15;
    transform: scale(1);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 10s ease-in-out infinite;
}

.animate-pulse-slow-delayed {
  animation: pulse-slow-delayed 10s ease-in-out infinite;
  animation-delay: 5s;
}

.animate-fade-in-left {
  animation: fadeInLeft 1s ease-out forwards;
}

.animate-fade-in-right {
  animation: fadeInRight 1s ease-out forwards;
  animation-delay: 0.2s;
}

.animate-bounce-slow {
  animation: float 4s ease-in-out infinite;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #020617;
}

::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>
