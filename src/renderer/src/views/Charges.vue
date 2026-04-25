<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Charge, AppConfig, getWorkDB, closeSession, generateId } from '../database/pouch'
import {
  Home,
  Users,
  Building2,
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-vue-next'
import ChargeModal from '../components/ChargeModal.vue'
import CompanySwitcher from '../components/CompanySwitcher.vue'

const router = useRouter()
const charges = ref<Charge[]>([])
const searchQuery = ref('')
const showModal = ref(false)
const isLoading = ref(false)
const message = ref({ text: '', type: '' as 'success' | 'error' | '' })
const config = ref<AppConfig | null>(null)
const hasApiKey = ref(false)

const showMessage = (text: string, type: 'success' | 'error'): void => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = { text: '', type: '' }
  }, 5000)
}

interface UserSession {
  id: string
  name: string
  role: string
  email: string
}
const user = ref<UserSession | null>(null)

const handleLogout = async (): Promise<void> => {
  await closeSession()
  router.push('/login')
}

const loadConfig = async (): Promise<void> => {
  try {
    const workDB = getWorkDB()
    const doc = await workDB.get<AppConfig>('config:main')
    config.value = doc
    hasApiKey.value = !!doc.asaasApiKey && doc.asaasApiKey.trim().length > 0
  } catch {
    hasApiKey.value = false
  }
}

const loadCharges = async (): Promise<void> => {
  isLoading.value = true
  try {
    const workDB = getWorkDB()
    const result = await workDB.allDocs({ include_docs: true })
    charges.value = result.rows
      .map((row) => row.doc as unknown as Charge)
      .filter((doc) => doc.type === 'charge')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (err) {
    console.error('Erro ao carregar cobranças:', err)
  } finally {
    isLoading.value = false
  }
}

const syncCharges = async (): Promise<void> => {
  if (!hasApiKey.value) return
  isLoading.value = true
  try {
    const result = await window.api.asaas.listClientPayments(config.value!.asaasApiKey!)
    if (result.success && result.payments) {
      const workDB = getWorkDB()
      // Atualizar status localmente para cada cobrança que temos
      for (const asaasPay of result.payments) {
        const local = charges.value.find((c) => c.asaasId === asaasPay.id)
        if (local && local.status !== asaasPay.status) {
          const updated = { ...local, status: asaasPay.status, updatedAt: new Date().toISOString() }
          await workDB.put(updated)
        }
      }
      await loadCharges()
      showMessage('Cobranças sincronizadas com o Asaas.', 'success')
    }
  } catch {
    showMessage('Erro ao sincronizar cobranças.', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const session = localStorage.getItem('cca_session')
  if (session) user.value = JSON.parse(session)
  await loadConfig()
  await loadCharges()
})

const handleSaveCharge = async (chargeData: Partial<Charge>): Promise<void> => {
  try {
    const workDB = getWorkDB()
    const now = new Date().toISOString()
    const newCharge: Charge = {
      _id: generateId('charge'),
      ...chargeData,
      createdAt: now,
      updatedAt: now
    } as Charge
    await workDB.put(newCharge)
    showMessage('Cobrança gerada com sucesso!', 'success')
    showModal.value = false
    await loadCharges()
  } catch {
    showMessage('Erro ao salvar cobrança localmente.', 'error')
  }
}

const handleDeleteCharge = async (charge: Charge): Promise<void> => {
  if (
    !confirm(
      'Deseja excluir o registro desta cobrança localmente? Isso não cancela a cobrança no Asaas.'
    )
  )
    return
  try {
    const workDB = getWorkDB()
    await workDB.remove(charge._id, charge._rev!)
    showMessage('Registro excluído.', 'success')
    await loadCharges()
  } catch {
    showMessage('Erro ao excluir registro.', 'error')
  }
}

const getStatusBadge = (status: string): { label: string; class: string; icon: typeof Clock } => {
  switch (status) {
    case 'RECEIVED':
    case 'CONFIRMED':
      return { label: 'Pago', class: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 }
    case 'PENDING':
      return { label: 'Pendente', class: 'bg-amber-50 text-amber-600', icon: Clock }
    case 'OVERDUE':
      return { label: 'Vencido', class: 'bg-red-50 text-red-600', icon: AlertCircle }
    case 'CANCELLED':
      return { label: 'Cancelado', class: 'bg-slate-100 text-slate-500', icon: XCircle }
    default:
      return { label: status, class: 'bg-slate-100 text-slate-500', icon: Clock }
  }
}

const filteredCharges = (): Charge[] => {
  if (!searchQuery.value) return charges.value
  const q = searchQuery.value.toLowerCase()
  return charges.value.filter(
    (c) => c.clientName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  )
}

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div
    class="h-[calc(100vh-48px)] bg-[var(--metronic-bg)] text-slate-900 flex overflow-hidden font-inter"
  >
    <!-- Sidebar -->
    <aside class="w-[280px] bg-[#1e1e2d] flex flex-col z-30 transition-all shrink-0">
      <div class="h-[100px] flex items-center px-9">
        <router-link to="/dashboard" class="flex items-center gap-4">
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
        </router-link>
      </div>

      <CompanySwitcher />

      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-sidebar-scroll">
        <router-link
          to="/dashboard"
          class="flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
        >
          <Home :size="20" class="opacity-50 group-hover:opacity-100" />
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
          <Users :size="20" class="opacity-50 group-hover:opacity-100" />
          <span class="text-[13px] font-bold">Parceiros</span>
        </router-link>

        <router-link
          to="/dashboard/clients"
          class="flex items-center gap-4 px-5 py-3 rounded-xl text-[var(--metronic-sidebar-text)] hover:bg-[#1b1b28] hover:text-white transition-all group"
        >
          <Building2 :size="20" class="opacity-50 group-hover:opacity-100" />
          <span class="text-[13px] font-bold">Clientes</span>
        </router-link>

        <router-link
          to="/dashboard/charges"
          class="flex items-center gap-4 px-5 py-3 rounded-xl bg-[#1b1b28] text-white transition-all group"
        >
          <DollarSign :size="20" class="text-[var(--cca-blue)]" />
          <span class="text-[13px] font-bold">Cobranças</span>
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
          <UserIcon :size="20" class="opacity-50 group-hover:opacity-100" />
          <span class="text-[13px] font-bold">Meu Perfil</span>
        </router-link>
      </nav>

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
            class="p-3 rounded-xl bg-white/5 text-[var(--metronic-sidebar-text)] hover:bg-[var(--metronic-danger)] hover:text-white transition-all shadow-sm"
            @click="handleLogout"
          >
            <RefreshCw v-if="isLoading" :size="18" class="animate-spin" />
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
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
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <!-- Toast Messages -->
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
            <DollarSign :size="14" class="text-slate-300" />
            <span class="text-slate-300 text-xs font-bold">/</span>
            <span class="text-[#1e1e2d] text-xs font-bold">Gestão Financeira</span>
          </div>
          <h2 class="text-[26px] font-black text-[#1e1e2d] tracking-tight leading-none">
            Cobranças & Split
          </h2>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative hidden md:block">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar cobrança..."
              class="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold focus:outline-none focus:border-[var(--cca-blue)] w-64"
            />
          </div>
          <button
            class="p-3.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all"
            title="Sincronizar com Asaas"
            @click="syncCharges"
          >
            <RefreshCw :size="20" :class="{ 'animate-spin': isLoading }" />
          </button>
          <button
            :disabled="!hasApiKey"
            class="bg-[#009ef7] hover:bg-[#008be0] text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40"
            @click="showModal = true"
          >
            <Plus :size="18" />
            Nova Cobrança
          </button>
        </div>
      </header>

      <!-- Content -->
      <div class="flex-1 p-10 overflow-auto">
        <div
          v-if="charges.length === 0 && !isLoading"
          class="h-full flex flex-col items-center justify-center text-center space-y-6"
        >
          <div
            class="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200"
          >
            <DollarSign :size="48" />
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-800">Nenhuma cobrança encontrada</h3>
            <p class="text-slate-400 font-medium max-w-sm mx-auto">
              Gere faturas para seus clientes e configure splits automáticos.
            </p>
          </div>
          <button
            v-if="hasApiKey"
            class="text-[var(--cca-blue)] font-black text-sm uppercase tracking-widest hover:underline"
            @click="showModal = true"
          >
            Gerar minha primeira cobrança
          </button>
        </div>

        <div
          v-else
          class="bg-white rounded-[30px] shadow-[var(--metronic-shadow)] border border-slate-50 overflow-hidden"
        >
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-slate-50 bg-slate-50/50">
                <th
                  class="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400"
                >
                  Cliente
                </th>
                <th
                  class="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400"
                >
                  Descrição / Vencimento
                </th>
                <th
                  class="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center"
                >
                  Split
                </th>
                <th
                  class="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400"
                >
                  Valor
                </th>
                <th
                  class="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400"
                >
                  Status
                </th>
                <th
                  class="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="charge in filteredCharges()"
                :key="charge._id"
                class="group hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div
                      class="w-10 h-10 rounded-xl bg-blue-50 text-[var(--cca-blue)] flex items-center justify-center font-black text-sm"
                    >
                      {{ charge.clientName.charAt(0) }}
                    </div>
                    <span class="text-sm font-black text-slate-800">{{ charge.clientName }}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-600 truncate max-w-[200px]">{{
                      charge.description
                    }}</span>
                    <span
                      class="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1"
                      >Vence em: {{ formatDate(charge.dueDate) }}</span
                    >
                  </div>
                </td>
                <td class="px-8 py-6 text-center">
                  <div
                    v-if="charge.split"
                    class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest"
                  >
                    <Users :size="10" /> Sim
                  </div>
                  <span v-else class="text-slate-200 font-bold text-[10px]">Não</span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex flex-col">
                    <span class="text-sm font-black text-slate-800">{{
                      formatCurrency(charge.value)
                    }}</span>
                    <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">{{
                      charge.billingType
                    }}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div
                    :class="getStatusBadge(charge.status).class"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  >
                    <component :is="getStatusBadge(charge.status).icon" :size="14" />
                    <span class="text-[10px] font-black uppercase tracking-widest">{{
                      getStatusBadge(charge.status).label
                    }}</span>
                  </div>
                </td>
                <td class="px-8 py-6 text-right">
                  <div
                    class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <a
                      v-if="charge.invoiceUrl"
                      :href="charge.invoiceUrl"
                      target="_blank"
                      class="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                      title="Ver no Asaas"
                    >
                      <ExternalLink :size="16" />
                    </a>
                    <button
                      class="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Excluir Registro"
                      @click="handleDeleteCharge(charge)"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <ChargeModal
      :show="showModal"
      :api-key="config?.asaasApiKey || ''"
      @close="showModal = false"
      @save="handleSaveCharge"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
