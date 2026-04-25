<script setup lang="ts">
import { ref, watch } from 'vue'
import { Client, ClientAddress } from '../database/pouch'
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  AlertTriangle,
  Loader2
} from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  client?: Client | null
  apiKey: string
}>()

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  cpfCnpj: '',
  email: '',
  phone: '',
  address: {
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  } as ClientAddress
})

const errorMessage = ref('')
const isSaving = ref(false)

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

watch(
  () => props.client,
  (newClient) => {
    if (newClient) {
      form.value = {
        name: newClient.name,
        cpfCnpj: newClient.cpfCnpj,
        email: newClient.email,
        phone: newClient.phone || '',
        address: newClient.address
          ? { ...newClient.address }
          : { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' }
      }
    } else {
      form.value = {
        name: '',
        cpfCnpj: '',
        email: '',
        phone: '',
        address: { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' }
      }
    }
  },
  { immediate: true }
)

const formatCpfCnpj = (value: string): string => {
  const val = value.replace(/\D/g, '')
  if (val.length <= 11) {
    return val
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14)
  } else {
    return val
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .substring(0, 18)
  }
}

const formatPhone = (value: string): string => {
  const val = value.replace(/\D/g, '')
  if (val.length <= 10) {
    return val
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})/, '$1-$2')
      .substring(0, 14)
  } else {
    return val
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})/, '$1-$2')
      .substring(0, 15)
  }
}

const formatCep = (value: string): string => {
  const val = value.replace(/\D/g, '')
  return val.replace(/(\d{5})(\d{1,3})/, '$1-$2').substring(0, 9)
}

const handleCpfCnpjInput = (e: Event): void => {
  const input = e.target as HTMLInputElement
  form.value.cpfCnpj = formatCpfCnpj(input.value)
}

const handlePhoneInput = (e: Event): void => {
  const input = e.target as HTMLInputElement
  form.value.phone = formatPhone(input.value)
}

const handleCepInput = (e: Event): void => {
  const input = e.target as HTMLInputElement
  form.value.address.cep = formatCep(input.value)
}

const handleSave = async (): Promise<void> => {
  errorMessage.value = ''

  // Validação de campos obrigatórios
  if (!form.value.name || !form.value.cpfCnpj || !form.value.email || !form.value.phone) {
    errorMessage.value = 'Preencha todos os campos obrigatórios (Nome, CPF/CNPJ, E-mail e Telefone).'
    return
  }

  const addr = form.value.address
  if (!addr.cep || !addr.street || !addr.number || !addr.neighborhood || !addr.city || !addr.state) {
    errorMessage.value = 'Preencha todos os campos obrigatórios do endereço.'
    return
  }

  // Se estiver editando, não chamar Asaas novamente
  if (props.client) {
    emit('save', { ...form.value, asaasCustomerId: props.client.asaasCustomerId })
    return
  }

  // Criar no Asaas ao cadastrar novo cliente
  isSaving.value = true
  try {
    const result = await window.api.asaas.createClientCustomer(props.apiKey, {
      name: form.value.name,
      cpfCnpj: form.value.cpfCnpj,
      email: form.value.email,
      mobilePhone: form.value.phone,
      address: addr.street,
      addressNumber: addr.number,
      complement: addr.complement || undefined,
      province: addr.neighborhood,
      postalCode: addr.cep,
      cityName: addr.city,
      state: addr.state
    })

    if (!result.success) {
      errorMessage.value = `Erro Asaas: ${result.error || 'Falha ao criar cliente.'}`
      return
    }

    emit('save', { ...form.value, asaasCustomerId: result.customerId })
  } catch (err) {
    errorMessage.value = `Erro inesperado: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    isSaving.value = false
  }
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
            <h3 class="text-2xl font-black text-[#1e1e2d] tracking-tight">
              {{ client ? 'Editar Cliente' : 'Novo Cliente' }}
            </h3>
            <p class="text-slate-400 text-sm font-bold">
              {{ client ? 'Atualize os dados do cliente.' : 'Cadastre o cliente que receberá a cobrança.' }}
            </p>
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
          <div
            class="bg-red-50 text-red-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <AlertTriangle :size="16" />
            {{ errorMessage }}
          </div>
        </div>

        <!-- Form Body (Scrollable) -->
        <div class="p-8 space-y-6 overflow-y-auto flex-1 custom-modal-scroll">
          <!-- Section: Dados Básicos -->
          <div class="space-y-1 pb-2">
            <h4 class="text-xs font-black uppercase tracking-[0.2em] text-[var(--cca-blue)]">
              Dados Básicos
            </h4>
            <div class="h-0.5 w-8 bg-blue-100 rounded-full"></div>
          </div>

          <div class="space-y-2">
            <label
              class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <User :size="12" /> Nome / Razão Social *
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Ex: Empresa Exemplo Ltda"
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
                class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <FileText :size="12" /> CPF ou CNPJ *
              </label>
              <input
                v-model="form.cpfCnpj"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                type="text"
                placeholder="000.000.000-00"
                @input="handleCpfCnpjInput"
              />
            </div>

            <div class="space-y-2">
              <label
                class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <Mail :size="12" /> E-mail *
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="contato@empresa.com"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <Phone :size="12" /> Telefone *
            </label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="(00) 00000-0000"
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all md:w-1/2"
              @input="handlePhoneInput"
            />
          </div>

          <!-- Divider -->
          <div class="pt-2"></div>

          <!-- Section: Endereço -->
          <div class="space-y-1 pb-2">
            <h4 class="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              <MapPin :size="12" class="inline -mt-0.5 mr-1" /> Endereço
            </h4>
            <div class="h-0.5 w-8 bg-emerald-100 rounded-full"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                CEP *
              </label>
              <input
                v-model="form.address.cep"
                type="text"
                placeholder="00000-000"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                @input="handleCepInput"
              />
            </div>

            <div class="space-y-2 md:col-span-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Rua / Logradouro *
              </label>
              <input
                v-model="form.address.street"
                type="text"
                placeholder="Rua Exemplo"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Número *
              </label>
              <input
                v-model="form.address.number"
                type="text"
                placeholder="123"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <div class="space-y-2 md:col-span-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Complemento
              </label>
              <input
                v-model="form.address.complement"
                type="text"
                placeholder="Sala, Andar, etc. (opcional)"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Bairro *
              </label>
              <input
                v-model="form.address.neighborhood"
                type="text"
                placeholder="Centro"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Cidade *
              </label>
              <input
                v-model="form.address.city"
                type="text"
                placeholder="São Paulo"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[11px] font-black uppercase tracking-widest text-slate-400">
                UF *
              </label>
              <select
                v-model="form.address.state"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione</option>
                <option v-for="uf in brazilianStates" :key="uf" :value="uf">{{ uf }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 shrink-0">
          <button
            class="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            @click="emit('close')"
            :disabled="isSaving"
          >
            Cancelar
          </button>
          <button
            class="bg-[#009ef7] hover:bg-[#008be0] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSave"
            :disabled="isSaving"
          >
            <Loader2 v-if="isSaving" :size="18" class="animate-spin" />
            <Save v-else :size="18" />
            {{ isSaving ? 'Salvando...' : client ? 'Salvar Alterações' : 'Cadastrar Cliente' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
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

.custom-modal-scroll::-webkit-scrollbar {
  width: 4px;
}

.custom-modal-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-modal-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.custom-modal-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
