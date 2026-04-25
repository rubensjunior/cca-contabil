<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getWorkDB, Charge, Client, Partner } from '../database/pouch'
import {
  X,
  Save,
  User,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Percent,
  Loader2,
  AlertTriangle,
  ChevronDown
} from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  apiKey: string
}>()

const emit = defineEmits(['close', 'save'])

const form = ref({
  clientId: '',
  clientName: '',
  value: 0,
  dueDate: '',
  description: '',
  billingType: 'BOLETO' as 'BOLETO' | 'CREDIT_CARD' | 'PIX',
  useSplit: false,
  splitPartnerId: '',
  splitPercent: 0
})

const clients = ref<Client[]>([])
const partners = ref<Partner[]>([])
const isSaving = ref(false)
const errorMessage = ref('')

// Carregar dados iniciais
const loadData = async () => {
  try {
    const db = getWorkDB()
    const result = await db.allDocs({ include_docs: true })
    const docs = result.rows.map(row => row.doc as any)
    
    // Buscar Clientes
    clients.value = docs.filter(doc => doc.type === 'client')

    // Buscar Parceiros
    partners.value = docs.filter(doc => doc.type === 'partner')
  } catch (err) {
    console.error('Erro ao carregar dados do modal:', err)
  }
}

watch(() => props.show, (isVisible) => {
  if (isVisible) {
    loadData()
    // Reset form
    form.value = {
      clientId: '',
      clientName: '',
      value: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias pra frente
      description: '',
      billingType: 'BOLETO',
      useSplit: false,
      splitPartnerId: '',
      splitPercent: 0
    }
    errorMessage.value = ''
  }
})

const handleClientChange = () => {
  const selectedClient = clients.value.find(c => c._id === form.value.clientId)
  if (selectedClient) {
    form.value.clientName = selectedClient.name
  }
}

const handleSave = async () => {
  errorMessage.value = ''
  
  if (!form.value.clientId || !form.value.value || !form.value.dueDate || !form.value.description) {
    errorMessage.value = 'Preencha todos os campos obrigatórios.'
    return
  }

  if (form.value.useSplit && (!form.value.splitPartnerId || form.value.splitPercent <= 0)) {
    errorMessage.value = 'Configure os dados do split corretamente.'
    return
  }

  isSaving.value = true
  try {
    const selectedClient = clients.value.find(c => c._id === form.value.clientId)
    if (!selectedClient?.asaasCustomerId) {
      throw new Error('Este cliente não possui um ID do Asaas vinculado.')
    }

    const splitData = []
    if (form.value.useSplit) {
      const partner = partners.value.find(p => p._id === form.value.splitPartnerId)
      if (!partner?.walletId) {
        throw new Error('O parceiro selecionado não possui uma Wallet ID configurada.')
      }
      splitData.push({
        walletId: partner.walletId,
        percentualValue: form.value.splitPercent
      })
    }

    // 1. Criar no Asaas
    const asaasData = {
      customer: selectedClient.asaasCustomerId,
      billingType: form.value.billingType,
      value: form.value.value,
      dueDate: form.value.dueDate,
      description: form.value.description,
      split: splitData.length > 0 ? splitData : undefined
    }

    const result = await window.api.asaas.createClientPayment(props.apiKey, asaasData)

    if (!result.success) {
      throw new Error(result.error || 'Erro ao criar cobrança no Asaas.')
    }

    // 2. Salvar localmente
    const chargeData: Omit<Charge, '_id' | 'createdAt' | 'updatedAt'> = {
      type: 'charge',
      clientId: form.value.clientId,
      clientName: form.value.clientName,
      value: form.value.value,
      dueDate: form.value.dueDate,
      description: form.value.description,
      billingType: form.value.billingType,
      asaasId: result.payment.id,
      invoiceUrl: result.payment.invoiceUrl,
      status: result.payment.status,
      split: splitData.length > 0 ? splitData : undefined
    }

    emit('save', chargeData)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err)
  } finally {
    isSaving.value = false
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        class="bg-white w-full max-w-2xl rounded-[30px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col"
      >
        <!-- Header -->
        <div class="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div class="flex flex-col">
            <h3 class="text-2xl font-black text-[#1e1e2d] tracking-tight">Nova Cobrança</h3>
            <p class="text-slate-400 text-sm font-bold">Gere uma fatura avulsa para seu cliente.</p>
          </div>
          <button
            class="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
            @click="emit('close')"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="px-8 pt-6 pb-0 shrink-0">
          <div class="bg-red-50 text-red-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertTriangle :size="16" />
            {{ errorMessage }}
          </div>
        </div>

        <!-- Form Body -->
        <div class="p-8 space-y-6 overflow-y-auto flex-1 custom-modal-scroll">
          <!-- Cliente -->
          <div class="space-y-2">
            <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <User :size="12" /> Selecione o Cliente *
            </label>
            <div class="relative">
              <select
                v-model="form.clientId"
                @change="handleClientChange"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione um cliente</option>
                <option v-for="client in clients" :key="client._id" :value="client._id">
                  {{ client.name }} ({{ client.cpfCnpj }})
                </option>
              </select>
              <ChevronDown :size="16" class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Valor -->
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <DollarSign :size="12" /> Valor (R$) *
              </label>
              <input
                v-model.number="form.value"
                type="number"
                step="0.01"
                placeholder="0,00"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)]"
              />
            </div>

            <!-- Vencimento -->
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar :size="12" /> Vencimento *
              </label>
              <input
                v-model="form.dueDate"
                type="date"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)]"
              />
            </div>
          </div>

          <!-- Descrição -->
          <div class="space-y-2">
            <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText :size="12" /> Descrição da Cobrança *
            </label>
            <input
              v-model="form.description"
              type="text"
              placeholder="Ex: Honorários Contábeis - Referente a Abril/2024"
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)]"
            />
          </div>

          <!-- Tipo de Pagamento -->
          <div class="space-y-2">
            <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <CreditCard :size="12" /> Forma de Recebimento *
            </label>
            <div class="grid grid-cols-3 gap-4">
              <button
                v-for="type in ['BOLETO', 'PIX', 'CREDIT_CARD']"
                :key="type"
                @click="form.billingType = type"
                :class="[
                  'py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border',
                  form.billingType === type
                    ? 'bg-blue-50 border-[var(--cca-blue)] text-[var(--cca-blue)]'
                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                ]"
              >
                {{ type === 'CREDIT_CARD' ? 'Cartão' : type }}
              </button>
            </div>
          </div>

          <!-- Split Section -->
          <div class="pt-4 border-t border-slate-100">
            <div class="flex items-center justify-between mb-4">
              <div class="flex flex-col">
                <h4 class="text-sm font-black text-[#1e1e2d]">Configuração de Split</h4>
                <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Dividir esta receita com um parceiro</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.useSplit" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--cca-blue)]"></div>
              </label>
            </div>

            <div v-if="form.useSplit" class="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Users :size="12" /> Parceiro
                  </label>
                  <div class="relative">
                    <select
                      v-model="form.splitPartnerId"
                      class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] appearance-none"
                    >
                      <option value="" disabled>Selecione</option>
                      <option v-for="partner in partners" :key="partner._id" :value="partner._id">
                        {{ partner.name }}
                      </option>
                    </select>
                    <ChevronDown :size="16" class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Percent :size="12" /> Percentual do Parceiro
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="form.splitPercent"
                      type="number"
                      placeholder="0"
                      class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] pr-12"
                    />
                    <span class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                  </div>
                </div>
              </div>

              <!-- Resumo do Split -->
              <div v-if="form.splitPercent > 0 && form.value > 0" class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">O parceiro receberá:</span>
                <span class="text-sm font-black text-[var(--cca-blue)]">
                  {{ formatCurrency((form.value * form.splitPercent) / 100) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
          <button
            class="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            @click="emit('close')"
            :disabled="isSaving"
          >
            Cancelar
          </button>
          <button
            class="bg-[#009ef7] hover:bg-[#008be0] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
            @click="handleSave"
            :disabled="isSaving"
          >
            <Loader2 v-if="isSaving" :size="18" class="animate-spin" />
            <Save v-else :size="18" />
            {{ isSaving ? 'Gerando Cobrança...' : 'Confirmar e Gerar' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.custom-modal-scroll::-webkit-scrollbar { width: 4px; }
.custom-modal-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-modal-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>
