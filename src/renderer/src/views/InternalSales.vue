<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Rocket,
  Crown,
  Gem,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronLeft
} from 'lucide-vue-next'

const router = useRouter()

const goBack = (): void => {
  router.back()
}

const plans = [
  {
    name: 'Starter',
    tagline: 'Ideal para profissionais solo',
    price: 'R$ 55',
    period: '/mês',
    features: [
      'Até 5 parceiros PJ',
      'Split automatizado via Asaas',
      'Dashboard básico de performance',
      'Suporte via e-mail'
    ],
    highlight: false,
    cta: 'Atualizar Plano'
  },
  {
    name: 'Business',
    tagline: 'O salto de performance para Hubs',
    price: 'R$ 149',
    period: '/mês',
    features: [
      'Parceiros ilimitados',
      'Split multi-nível avançado',
      'Dashboards personalizados',
      'Suporte prioritário 24/7',
      'Relatórios de compliance fiscal'
    ],
    highlight: true,
    cta: 'Assinar Business'
  }
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/10">
    <!-- Header Simples de Retorno -->
    <header class="p-6 flex items-center justify-between max-w-7xl mx-auto">
      <button
        class="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm"
        @click="goBack"
      >
        <ChevronLeft :size="18" />
        Voltar ao Painel
      </button>
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold tracking-tight text-slate-900">
          CCA<span class="text-blue-600">.</span> Split
        </h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-12">
      <!-- Hero de Vendas -->
      <section class="mb-24 space-y-6 text-center">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest animate-bounce-slow"
        >
          <Rocket :size="14" />
          Potencialize sua Operação
        </div>
        <h2 class="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Desbloqueie o poder máximo <br />
          do seu <span class="text-blue-600 italic">Hub de Negócios.</span>
        </h2>
        <p class="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
          Leve sua gestão para o próximo nível com ferramentas avançadas de automação, proteção
          fiscal e insights estratégicos em tempo real.
        </p>
      </section>

      <!-- Benefícios Chave -->
      <section class="grid md:grid-cols-3 gap-8 mb-32">
        <div
          class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group"
        >
          <div
            class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform"
          >
            <TrendingUp :size="28" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Escalabilidade Real</h3>
          <p class="text-sm text-slate-500 leading-relaxed font-medium">
            Cresça sua rede de especialistas sem aumentar sua complexidade operacional ou carga
            tributária.
          </p>
        </div>
        <div
          class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group"
        >
          <div
            class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform"
          >
            <ShieldCheck :size="28" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Blindagem 360º</h3>
          <p class="text-sm text-slate-500 leading-relaxed font-medium">
            Sua estrutura protegida juridicamente contra bitributação desnecessária em cada repasse.
          </p>
        </div>
        <div
          class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group"
        >
          <div
            class="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform"
          >
            <Zap :size="28" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Automação Extrema</h3>
          <p class="text-sm text-slate-500 leading-relaxed font-medium">
            Elimine processos manuais de conferência. O software faz o trabalho pesado por você.
          </p>
        </div>
      </section>

      <!-- Grade de Planos (Opcional - Estética de Página de Vendas) -->
      <section class="mb-32">
        <div class="text-center mb-16">
          <h3 class="text-3xl font-black text-slate-900 italic">Evolua seu Plano</h3>
          <div class="w-12 h-1 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div
            v-for="plan in plans"
            :key="plan.name"
            class="relative bg-white p-10 rounded-[2.5rem] border transition-all flex flex-col"
            :class="
              plan.highlight
                ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/5'
                : 'border-slate-100 shadow-sm hover:shadow-md'
            "
          >
            <div
              v-if="plan.highlight"
              class="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg"
            >
              <Crown :size="12" />
              Mais Recomendado
            </div>

            <div class="mb-8">
              <h4 class="text-2xl font-black text-slate-900 mb-1 leading-none">{{ plan.name }}</h4>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {{ plan.tagline }}
              </p>
            </div>

            <div class="flex items-baseline gap-1 mb-8">
              <span class="text-4xl font-black text-slate-900">{{ plan.price }}</span>
              <span class="text-slate-400 font-bold text-sm">{{ plan.period }}</span>
            </div>

            <div class="space-y-4 mb-10 flex-1">
              <div v-for="feat in plan.features" :key="feat" class="flex items-start gap-3">
                <div
                  class="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5"
                >
                  <CheckCircle2 :size="14" class="text-blue-600" />
                </div>
                <span class="text-sm text-slate-600 font-medium leading-tight">{{ feat }}</span>
              </div>
            </div>

            <button
              class="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              :class="
                plan.highlight
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                  : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
              "
            >
              {{ plan.cta }}
              <ArrowRight :size="18" />
            </button>
          </div>
        </div>
      </section>

      <!-- Call to Action Final Interno -->
      <section
        class="bg-slate-950 rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-center group"
      >
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none"
        ></div>
        <div class="relative z-10 space-y-8">
          <div
            class="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto text-blue-400 border border-white/10 group-hover:rotate-12 transition-transform"
          >
            <Gem :size="32" />
          </div>
          <h2 class="text-3xl lg:text-5xl font-black text-white italic">
            Seu Hub merece o melhor.
          </h2>
          <p class="text-slate-400 max-w-xl mx-auto font-medium">
            Dúvidas em como configurar sua operação para escala máxima? Nossos consultores
            especialistas estão prontos para ajudar.
          </p>
          <div class="pt-4">
            <button
              class="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Falar com Consultoria
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer class="py-12 border-t border-slate-100 mt-20">
      <div class="max-w-7xl mx-auto px-6 text-center space-y-4">
        <p class="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
          Desenvolvido com excelência por
        </p>
        <div class="flex items-center justify-center gap-6 opacity-40">
          <span class="text-xs font-black text-slate-900 tracking-tight uppercase"
            >CCA Contabilidade</span
          >
          <div class="w-px h-8 bg-slate-300"></div>
          <span class="text-xs font-black text-blue-600 tracking-tight uppercase"
            >RKS Tech Solution</span
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
