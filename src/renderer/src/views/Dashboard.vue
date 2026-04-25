<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AppConfig, getWorkDB, closeSession } from '../database/pouch'
import { BarChart3, Building2, Compass, HelpCircle, User, Users } from 'lucide-vue-next'
import OnboardingWizard from '../components/OnboardingWizard.vue'
import CompanySwitcher from '../components/CompanySwitcher.vue'

const router = useRouter()

interface UserSession {
  id: string
  name: string
  role: string
  email: string
  company?: string
  subscriptionId?: string
}
const user = ref<UserSession | null>(null)
const config = ref<AppConfig | null>(null)
const showOnboarding = ref(false)

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

    // Acionar onboarding se for o primeiro acesso
    if (!doc.onboardingCompleted) {
      showOnboarding.value = true
    }
  } catch {
    console.warn('Config não encontrada no banco de trabalho')
  }
})

const handleCompleteOnboarding = async (data: {
  asaasApiKey: string
  businessSegment: string
}): Promise<void> => {
  showOnboarding.value = false
  if (config.value) {
    try {
      const workDB = getWorkDB()
      const updatedConfig = {
        ...config.value,
        asaasApiKey: data.asaasApiKey,
        businessSegment: data.businessSegment,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      }
      await workDB.put(updatedConfig)
      config.value = updatedConfig
    } catch (err) {
      console.error('Erro ao salvar progresso do onboarding:', err)
    }
  }
}

const handleOpenOnboarding = (): void => {
  showOnboarding.value = true
}
</script>

<template>
  <div
    class="h-[calc(100vh-48px)] bg-[var(--metronic-bg)] text-slate-900 flex overflow-hidden font-inter"
  >
    <!-- Sidebar (Metronic Style) -->
    <aside class="w-[280px] bg-[#1e1e2d] flex flex-col z-30 transition-all shrink-0">
      <!-- Logo Area -->
      <div class="h-[100px] flex items-center px-9">
        <div class="flex items-center gap-4">
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
        </div>
      </div>

      <CompanySwitcher />

      <!-- Scrollable Menu -->
      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-sidebar-scroll">
        <router-link
          to="/dashboard"
          class="flex items-center gap-4 px-5 py-3 rounded-xl bg-[#1b1b28] text-white transition-all group"
        >
          <Compass :size="20" class="text-[var(--cca-blue)]" />
          <span class="text-[13px] font-bold">Painel Geral</span>
        </router-link>

        <div class="pt-6 pb-2 px-5">
          <p
            class="text-[10px] font-black text-[var(--metronic-sidebar-text)] uppercase tracking-[0.2em] opacity-20"
          >
            Gestão
          </p>
        </div>

        <router-link
          to="/dashboard/partners"
          class="flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
        >
          <Users :size="20" class="opacity-50 group-hover:opacity-100 transition-colors" />
          <span class="text-[13px] font-bold">Parceiros</span>
        </router-link>

        <router-link
          to="/dashboard/clients"
          class="flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
        >
          <Building2 :size="20" class="opacity-50 group-hover:opacity-100 transition-colors" />
          <span class="text-[13px] font-bold">Clientes</span>
        </router-link>

        <div class="pt-6 pb-2 px-5">
          <p
            class="text-[10px] font-black text-[var(--metronic-sidebar-text)] uppercase tracking-[0.2em] opacity-20"
          >
            Configurações
          </p>
        </div>

        <router-link
          to="/profile"
          class="flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
        >
          <User :size="20" class="opacity-50 group-hover:opacity-100 transition-colors" />
          <span class="text-[13px] font-bold">Meu Perfil</span>
        </router-link>

        <button
          class="w-full flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
          @click="handleOpenOnboarding"
        >
          <HelpCircle :size="20" class="opacity-50 group-hover:opacity-100 transition-colors" />
          <span class="text-[13px] font-bold">Guia de Início</span>
        </button>
      </nav>

      <!-- Sidebar Footer (Avatar & Logout) -->
      <div class="p-8 border-t border-white/5">
        <div class="flex items-center justify-between">
          <router-link to="/profile" class="flex items-center gap-3 group">
            <div
              class="w-10 h-10 rounded-xl bg-[var(--cca-blue-soft)] flex items-center justify-center border border-white/10 overflow-hidden group-hover:border-blue-500/50 transition-colors"
            >
              <span class="text-white font-black text-sm">{{ user?.name.charAt(0) }}</span>
            </div>
            <div class="flex flex-col">
              <span
                class="text-white text-[12px] font-black truncate w-24 group-hover:text-blue-400 transition-colors"
                >{{ user?.name }}</span
              >
              <span
                class="text-[10px] text-[var(--metronic-sidebar-text)] font-bold opacity-40 uppercase truncate w-24"
                >{{ user?.role }}</span
              >
            </div>
          </router-link>
          <button
            class="p-3 rounded-xl bg-white/5 text-[var(--metronic-sidebar-text)] hover:bg-[var(--metronic-danger)] hover:text-white transition-all group shadow-sm"
            @click="handleLogout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="group-hover:rotate-12 transition-transform"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Toolbar (Metronic 1:1 Style) -->
      <header
        class="h-[100px] bg-white px-10 flex items-center justify-between shrink-0 border-b border-slate-100"
      >
        <div class="flex flex-col">
          <!-- Breadcrumbs -->
          <div class="flex items-center gap-2 mb-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span class="text-slate-300 text-xs font-bold">/</span>
            <span
              class="text-[#94a3b8] text-xs font-bold hover:text-[var(--cca-blue)] cursor-pointer transition-colors leading-none"
              >Dashboards</span
            >
          </div>
          <h2 class="text-[26px] font-black text-[#1e1e2d] tracking-tight leading-none">
            Panorama Geral
          </h2>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex flex-col items-end mr-2">
            <span class="text-xs font-black text-slate-900">{{ user?.name }}</span>
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {{ config?.companyName || 'Hub Corporativo' }}
            </span>
          </div>
          <button
            class="bg-[#009ef7] hover:bg-[#008be0] text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            Criar Novo
          </button>
        </div>
      </header>

      <!-- Dashboard Body -->
      <div class="flex-1 p-10 overflow-auto space-y-10">
        <!-- 6 Column KPI Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          <!-- Card 1 -->
          <div
            class="bg-white p-7 rounded-[20px] shadow-[var(--metronic-shadow)] border border-slate-50 flex flex-col items-start min-h-[180px]"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                />
              </svg>
            </div>
            <span class="text-3xl font-black text-[#1e1e2d] mb-1">327</span>
            <span class="text-[13px] font-bold text-slate-400 mb-4 leading-none">Projetos</span>
            <div
              class="bg-[var(--metronic-success-light)] text-[var(--metronic-success)] text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              2.1%
            </div>
          </div>

          <!-- Card 2 -->
          <div
            class="bg-white p-7 rounded-[20px] shadow-[var(--metronic-shadow)] border border-slate-50 flex flex-col items-start min-h-[180px]"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400"
            >
              <BarChart3 :size="24" stroke-width="3" />
            </div>
            <span class="text-3xl font-black text-[#1e1e2d] mb-1">27,5M</span>
            <span class="text-[13px] font-bold text-slate-400 mb-4 leading-none">Vendas Qty</span>
            <div
              class="bg-[var(--metronic-success-light)] text-[var(--metronic-success)] text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              2.1%
            </div>
          </div>

          <!-- Card 3 -->
          <div
            class="bg-white p-7 rounded-[20px] shadow-[var(--metronic-shadow)] border border-slate-50 flex flex-col items-start min-h-[180px]"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span class="text-3xl font-black text-[#1e1e2d] mb-1">149M</span>
            <span class="text-[13px] font-bold text-slate-400 mb-4 leading-none">
              Valor em Estoque
            </span>
            <div
              class="bg-[var(--metronic-danger-light)] text-[var(--metronic-danger)] text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              0.47%
            </div>
          </div>

          <!-- Card 4 -->
          <div
            class="bg-white p-7 rounded-[20px] shadow-[var(--metronic-shadow)] border border-slate-50 flex flex-col items-start min-h-[180px]"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span class="text-3xl font-black text-[#1e1e2d] mb-1">89M</span>
            <span class="text-[13px] font-bold text-slate-400 mb-4 leading-none">CAPEX Hub</span>
            <div
              class="bg-[var(--metronic-success-light)] text-[var(--metronic-success)] text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              2.1%
            </div>
          </div>

          <!-- Card 5 -->
          <div
            class="bg-white p-7 rounded-[20px] shadow-[var(--metronic-shadow)] border border-slate-50 flex flex-col items-start min-h-[180px]"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m16 8-8 8" />
                <path d="m8 8 8 8" />
              </svg>
            </div>
            <span class="text-3xl font-black text-[#1e1e2d] mb-1">72.4%</span>
            <span class="text-[13px] font-bold text-slate-400 mb-4 leading-none">OPEX Margin</span>
            <div
              class="bg-[var(--metronic-danger-light)] text-[var(--metronic-danger)] text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              0.647%
            </div>
          </div>

          <!-- Card 6 -->
          <div
            class="bg-white p-7 rounded-[20px] shadow-[var(--metronic-shadow)] border border-slate-50 flex flex-col items-start min-h-[180px]"
          >
            <div
              class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <span class="text-3xl font-black text-[#1e1e2d] mb-1">106M</span>
            <span class="text-[13px] font-bold text-slate-400 mb-4 leading-none">
              Economia Real
            </span>
            <div
              class="bg-[var(--metronic-success-light)] text-[var(--metronic-success)] text-[11px] font-black px-2.5 py-1 rounded-md flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
              2.1%
            </div>
          </div>
        </div>

        <!-- Charts Row (Reference Placeholder) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10">
          <div
            class="bg-white p-10 rounded-[30px] shadow-[var(--metronic-shadow)] border border-slate-50"
          >
            <h3
              class="text-lg font-black text-slate-800 mb-2 leading-none uppercase tracking-tight"
            >
              Análise Setorial
            </h3>
            <p class="text-slate-400 text-sm font-bold mb-10 leading-none">
              Distribuição de fluxos por empresa
            </p>

            <!-- Radial Chart Mockup -->
            <div
              class="h-64 bg-slate-50 rounded-3xl flex items-center justify-center border border-dashed border-slate-200"
            >
              <span class="text-slate-300 font-black text-xs uppercase tracking-widest"
                >Módulo de Gráficos Radiais</span
              >
            </div>
          </div>

          <div
            class="bg-white p-10 rounded-[30px] shadow-[var(--metronic-shadow)] border border-slate-50"
          >
            <div class="flex justify-between items-start mb-10 leading-none">
              <div class="flex flex-col">
                <h3 class="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">
                  Performance Mensal
                </h3>
                <p class="text-slate-400 text-sm font-bold">Volume processado em milhões</p>
              </div>
              <div
                class="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100"
              >
                <span class="text-xs font-black text-slate-600 uppercase">Período Fiscal</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="opacity-30"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>

            <!-- Bar Chart Mockup -->
            <div
              class="h-64 bg-slate-50 rounded-3xl flex items-center justify-center border border-dashed border-slate-200"
            >
              <span class="text-slate-300 font-black text-xs uppercase tracking-widest"
                >Módulo de Histograma Corporativo</span
              >
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Onboarding Layer -->
    <OnboardingWizard
      :show="showOnboarding"
      :initial-data="{
        asaasApiKey: config?.asaasApiKey,
        businessSegment: config?.businessSegment
      }"
      @close="showOnboarding = false"
      @complete="handleCompleteOnboarding"
    />
  </div>
</template>
