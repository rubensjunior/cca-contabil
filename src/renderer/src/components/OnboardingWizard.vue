<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Rocket,
  Key,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  Loader2
} from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  initialData?: {
    asaasApiKey?: string
    businessSegment?: string
  }
}>()

const emit = defineEmits(['close', 'complete'])

const currentStep = ref(0)
const asaasApiKey = ref(props.initialData?.asaasApiKey || '')
const businessSegment = ref(props.initialData?.businessSegment || '')
const isValidating = ref(false)
const error = ref('')

const segments = [
  { id: 'saude', label: 'Saúde & Bem-estar', icon: '🩺' },
  { id: 'tecnologia', label: 'Tecnologia & SaaS', icon: '💻' },
  { id: 'educacao', label: 'Educação & Cursos', icon: '🎓' },
  { id: 'estetica', label: 'Estética & Beleza', icon: '✨' },
  { id: 'servicos', label: 'Serviços Profissionais', icon: '🤝' },
  { id: 'outro', label: 'Outro Segmento', icon: '🏢' }
]

const steps = [
  {
    title: 'Bem-vindo ao Futuro',
    subtitle: 'CCA. Split',
    description:
      'Você acaba de entrar no ecossistema mais avançado para gestão de repasses contábeis. Vamos configurar seu Hub para máxima eficiência.',
    icon: Sparkles,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    type: 'content'
  },
  {
    title: 'Cérebro Financeiro',
    subtitle: 'Conexão Asaas',
    description:
      'Para automatizar seus repasses, precisamos da sua Chave de API do Asaas. Ela permite que o sistema identifique pagamentos em tempo real.',
    icon: Key,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    type: 'form-api'
  },
  {
    title: 'Perfil da Operação',
    subtitle: 'Segmento de Negócio',
    description:
      'Qual o foco principal do seu Hub? Isso nos ajuda a personalizar suas métricas e categorias de faturamento.',
    icon: Briefcase,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    type: 'form-segment'
  },
  {
    title: 'O Motor de Split',
    subtitle: 'Gestão Blindada',
    description:
      'Nossa tecnologia divide os lucros na fonte. Adicione especialistas, defina percentuais e deixe que o CCA faça o resto, sem bitributação.',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    type: 'content'
  },
  {
    title: 'Tudo Pronto!',
    subtitle: 'Próximos Passos',
    description:
      'Sua infraestrutura básica está configurada. Agora, cadastre seu primeiro especialista para ver a mágica do split acontecer.',
    icon: Rocket,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    type: 'content'
  }
]

const next = async (): Promise<void> => {
  error.value = ''

  if (currentStep.value === 1) {
    if (asaasApiKey.value) {
      // Simulação de validação (Premium feel) apenas se preenchido
      isValidating.value = true
      await new Promise((resolve) => setTimeout(resolve, 800))
      isValidating.value = false
    }
  }

  if (currentStep.value === 2) {
    if (!businessSegment.value) {
      error.value = 'Selecione um segmento para continuar.'
      return
    }
  }

  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  } else {
    emit('complete', {
      asaasApiKey: asaasApiKey.value,
      businessSegment: businessSegment.value
    })
  }
}

const prev = (): void => {
  if (currentStep.value > 0) {
    currentStep.value--
    error.value = ''
  }
}

const progress = computed(() => ((currentStep.value + 1) / steps.length) * 100)
</script>

<template>
  <Transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
    >
      <Transition name="scale-fade" appear>
        <div
          class="w-full max-w-4xl bg-white rounded-[3rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 relative"
        >
          <!-- Progress Bar -->
          <div class="absolute top-0 left-0 w-full h-1.5 bg-slate-100/50">
            <div
              class="h-full bg-blue-600 transition-all duration-700 ease-in-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>

          <button
            class="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
            @click="emit('close')"
          >
            <X :size="20" />
          </button>

          <div class="flex flex-col md:flex-row h-full min-h-[550px]">
            <!-- Visual Section -->
            <div
              class="w-full md:w-5/12 bg-slate-50 p-12 flex flex-col items-center justify-center relative overflow-hidden border-r border-slate-100"
            >
              <div class="absolute inset-0 opacity-20 pointer-events-none">
                <div
                  class="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px] animate-pulse"
                ></div>
                <div
                  class="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full translate-x-1/2 translate-y-1/2 blur-[100px] animate-pulse"
                  style="animation-delay: 2s"
                ></div>
              </div>

              <Transition name="slide-up" mode="out-in">
                <div
                  :key="currentStep"
                  class="flex flex-col items-center text-center relative z-10"
                >
                  <div
                    :class="[steps[currentStep].bg, steps[currentStep].color]"
                    class="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/10 border border-white relative group"
                  >
                    <div
                      class="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 rounded-[2.5rem] transition-opacity duration-500"
                    ></div>
                    <component :is="steps[currentStep].icon" :size="56" class="animate-float" />
                  </div>
                  <h4 class="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                    {{ steps[currentStep].subtitle }}
                  </h4>
                  <div class="h-1.5 w-12 bg-blue-100 rounded-full mx-auto mt-4 overflow-hidden">
                    <div class="h-full bg-blue-600 animate-loading-bar"></div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Content Section -->
            <div class="w-full md:w-7/12 p-14 flex flex-col justify-between bg-white relative">
              <Transition name="slide-fade" mode="out-in">
                <div :key="currentStep" class="flex-1">
                  <h2 class="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                    {{ steps[currentStep].title }}
                  </h2>

                  <p class="text-slate-500 leading-relaxed text-lg mb-8">
                    {{ steps[currentStep].description }}
                  </p>

                  <!-- Dynamic Forms -->
                  <div v-if="steps[currentStep].type === 'form-api'" class="space-y-6">
                    <div class="space-y-2">
                      <label
                        class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 ml-1"
                        >Chave de API de Produção</label
                      >
                      <div class="relative group">
                        <input
                          v-model="asaasApiKey"
                          type="password"
                          placeholder="$asaas_live_..."
                          class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all placeholder:text-slate-300 font-mono text-sm"
                        />
                        <div
                          class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"
                        >
                          <Key :size="20" />
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <a
                        href="https://www.asaas.com/customer/config"
                        target="_blank"
                        class="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-xl"
                      >
                        <ExternalLink :size="14" />
                        Como obter minha chave?
                      </a>
                      <button
                        type="button"
                        class="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 underline underline-offset-4"
                        @click="next"
                      >
                        Pular esta etapa
                      </button>
                    </div>
                  </div>

                  <div
                    v-if="steps[currentStep].type === 'form-segment'"
                    class="grid grid-cols-2 gap-3"
                  >
                    <button
                      v-for="segment in segments"
                      :key="segment.id"
                      class="flex flex-col items-center p-4 rounded-3xl border-2 transition-all text-center group"
                      :class="[
                        businessSegment === segment.id
                          ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-600/10'
                          : 'border-slate-100 hover:border-slate-300 bg-white'
                      ]"
                      @click="businessSegment = segment.id"
                    >
                      <span class="text-3xl mb-3 group-hover:scale-110 transition-transform">{{
                        segment.icon
                      }}</span>
                      <span class="text-xs font-bold text-slate-700">{{ segment.label }}</span>
                    </button>
                  </div>

                  <div
                    v-if="error"
                    class="mt-6 flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-shake"
                  >
                    <span class="font-bold text-sm">{{ error }}</span>
                  </div>
                </div>
              </Transition>

              <div class="flex items-center justify-between mt-12 pt-8 border-t border-slate-50">
                <div class="flex gap-2">
                  <div
                    v-for="(_, index) in steps"
                    :key="index"
                    class="h-1.5 rounded-full transition-all duration-500"
                    :class="[
                      currentStep === index
                        ? 'w-10 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                        : 'w-1.5 bg-slate-200'
                    ]"
                  ></div>
                </div>

                <div class="flex gap-4">
                  <button
                    v-if="currentStep > 0"
                    class="p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all font-bold flex items-center gap-2"
                    @click="prev"
                  >
                    <ChevronLeft :size="24" />
                  </button>
                  <button
                    class="bg-slate-900 hover:bg-blue-700 text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center gap-3 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                    :disabled="isValidating"
                    @click="next"
                  >
                    <template v-if="!isValidating">
                      {{ currentStep === steps.length - 1 ? 'Iniciar Operação' : 'Próximo' }}
                      <ChevronRight v-if="currentStep < steps.length - 1" :size="22" />
                      <CheckCircle2 v-else :size="22" />
                    </template>
                    <template v-else>
                      Validando...
                      <Loader2 :size="22" class="animate-spin" />
                    </template>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

.animate-loading-bar {
  animation: loading 2s linear infinite;
  width: 40%;
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-fade-enter-active {
  transition: all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(40px);
}

.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.4s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-up-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(40px) rotate(5deg);
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
