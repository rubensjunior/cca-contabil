<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Client, AppConfig, getWorkDB, closeSession, generateId } from '../database/pouch'
import {
  Building2,
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Home,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Key,
  HelpCircle
} from 'lucide-vue-next'
import ClientModal from '../components/ClientModal.vue'
import CompanySwitcher from '../components/CompanySwitcher.vue'

const router = useRouter()
const clients = ref<Client[]>([])
const searchQuery = ref('')
const showModal = ref(false)
const selectedClient = ref<Client | null>(null)
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
    console.warn('Config não encontrada no banco de trabalho')
    hasApiKey.value = false
  }
}

const loadClients = async (): Promise<void> => {
  isLoading.value = true
  try {
    const workDB = getWorkDB()
    const result = await workDB.allDocs({ include_docs: true })
    clients.value = result.rows
      .map((row) => row.doc as unknown as Client)
      .filter((doc) => doc.type === 'client')
  } catch (err) {
    console.error('Erro ao carregar clientes:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const session = localStorage.getItem('cca_session')
  if (session) {
    user.value = JSON.parse(session)
  }
  await loadConfig()
  await loadClients()
})

const openAddModal = (): void => {
  if (!hasApiKey.value) return
  selectedClient.value = null
  showModal.value = true
}

const openEditModal = (client: Client): void => {
  selectedClient.value = client
  showModal.value = true
}

const handleSaveClient = async (formData: {
  name: string
  cpfCnpj: string
  email: string
  phone: string
  address: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  asaasCustomerId?: string
}): Promise<void> => {
  try {
    const workDB = getWorkDB()
    const now = new Date().toISOString()

    if (selectedClient.value) {
      // Editar
      const updatedClient = {
        ...selectedClient.value,
        ...formData,
        updatedAt: now
      }
      await workDB.put(updatedClient)
      showMessage('Cliente atualizado com sucesso!', 'success')
    } else {
      // Criar
      const newClient: Client = {
        _id: generateId('client'),
        type: 'client',
        ...formData,
        createdAt: now,
        updatedAt: now
      }
      await workDB.put(newClient)
      showMessage('Novo cliente cadastrado e criado no Asaas!', 'success')
    }

    showModal.value = false
    await loadClients()
  } catch (err) {
    console.error('Erro ao salvar cliente:', err)
    showMessage('Erro ao salvar cliente. Tente novamente.', 'error')
  }
}

const handleDeleteClient = async (client: Client): Promise<void> => {
  if (!confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) return

  try {
    const workDB = getWorkDB()
    await workDB.remove(client._id, client._rev!)
    showMessage('Cliente excluído com sucesso.', 'success')
    await loadClients()
  } catch (err) {
    console.error('Erro ao excluir cliente:', err)
    showMessage('Erro ao excluir cliente.', 'error')
  }
}

const filteredClients = (): Client[] => {
  if (!searchQuery.value) return clients.value
  const q = searchQuery.value.toLowerCase()
  return clients.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.cpfCnpj.includes(q) || c.email.toLowerCase().includes(q)
  )
}

const goToOnboarding = (): void => {
  router.push('/dashboard')
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
          class="flex items-center gap-4 px-5 py-3 rounded-xl bg-[#1b1b28] text-white transition-all group"
        >
          <Building2 :size="20" class="text-[var(--cca-blue)]" />
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
      <!-- Success/Error Message Toast -->
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

      <!-- API Key Warning Banner -->
      <div
        v-if="!hasApiKey"
        class="mx-10 mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4"
      >
        <div
          class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"
        >
          <Key :size="24" />
        </div>
        <div class="flex-1">
          <h4 class="text-base font-black text-amber-800 mb-1">
            Chave API do Asaas não configurada
          </h4>
          <p class="text-sm text-amber-600 font-medium leading-relaxed">
            Para cadastrar clientes, é necessário configurar sua Chave de API do Asaas. Acesse o
            <strong>Guia de Início</strong> no painel para configurar.
          </p>
          <button
            class="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
            @click="goToOnboarding"
          >
            <HelpCircle :size="14" />
            Ir para Configuração
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <header
        class="h-[100px] bg-white px-10 flex items-center justify-between shrink-0 border-b border-slate-100"
      >
        <div class="flex flex-col">
          <div class="flex items-center gap-2 mb-1.5">
            <Building2 :size="14" class="text-slate-300" />
            <span class="text-slate-300 text-xs font-bold">/</span>
            <span class="text-[#1e1e2d] text-xs font-bold">Gestão de Clientes</span>
          </div>
          <h2 class="text-[26px] font-black text-[#1e1e2d] tracking-tight leading-none">
            Clientes & Cobranças
          </h2>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative hidden md:block">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar cliente..."
              class="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all w-64"
            />
          </div>
          <button
            class="bg-[#009ef7] hover:bg-[#008be0] text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#009ef7]"
            :disabled="!hasApiKey"
            @click="openAddModal"
          >
            <Plus :size="18" />
            Novo Cliente
          </button>
        </div>
      </header>

      <!-- Content Body -->
      <div class="flex-1 p-10 overflow-auto">
        <div
          v-if="clients.length === 0 && !isLoading"
          class="h-full flex flex-col items-center justify-center text-center space-y-6"
        >
          <div
            class="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200"
          >
            <Building2 :size="48" />
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-800">Nenhum cliente encontrado</h3>
            <p class="text-slate-400 font-medium max-w-sm mx-auto">
              Comece cadastrando os clientes que receberão suas cobranças.
            </p>
          </div>
          <button
            v-if="hasApiKey"
            class="text-[var(--cca-blue)] font-black text-sm uppercase tracking-widest hover:underline"
            @click="openAddModal"
          >
            Cadastrar meu primeiro cliente
          </button>
        </div>

        <div v-else class="space-y-6">
          <!-- Clients Grid -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div
              v-for="client in filteredClients()"
              :key="client._id"
              class="bg-white p-8 rounded-[30px] shadow-[var(--metronic-shadow)] border border-slate-50 flex items-center gap-6 group hover:border-[var(--cca-blue)] transition-all"
            >
              <div
                class="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"
              >
                <span class="text-2xl font-black">{{ client.name.charAt(0) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-black text-slate-800 truncate">{{ client.name }}</h4>
                  <div
                    v-if="client.asaasCustomerId"
                    class="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0"
                  >
                    Asaas ✓
                  </div>
                </div>
                <div
                  class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest mt-1"
                >
                  <span class="flex items-center gap-1.5">
                    <Building2 :size="12" /> {{ client.cpfCnpj }}
                  </span>
                  <span class="hidden sm:block w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span class="truncate">{{ client.email }}</span>
                </div>
                <div
                  v-if="client.address"
                  class="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1.5"
                >
                  <MapPin :size="10" />
                  {{ client.address.city }}/{{ client.address.state }}
                </div>
              </div>

              <div
                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  class="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                  @click="openEditModal(client)"
                >
                  <Pencil :size="18" />
                </button>
                <button
                  class="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  @click="handleDeleteClient(client)"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <ClientModal
      :show="showModal"
      :client="selectedClient"
      :api-key="config?.asaasApiKey || ''"
      @close="showModal = false"
      @save="handleSaveClient"
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
