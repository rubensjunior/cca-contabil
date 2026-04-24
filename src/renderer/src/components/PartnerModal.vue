<script setup lang="ts">
import { ref, watch } from 'vue'
import { Partner } from '../database/pouch'
import { X, Save, User, Mail, CreditCard, FileText, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  partner?: Partner | null
}>()

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  cpfCnpj: '',
  email: '',
  walletId: ''
})

watch(
  () => props.partner,
  (newPartner) => {
    if (newPartner) {
      form.value = {
        name: newPartner.name,
        cpfCnpj: newPartner.cpfCnpj,
        email: newPartner.email,
        walletId: newPartner.walletId || ''
      }
    } else {
      form.value = { name: '', cpfCnpj: '', email: '', walletId: '' }
    }
  },
  { immediate: true }
)

const formatCpfCnpj = (value: string): string => {
  const val = value.replace(/\D/g, '')
  if (val.length <= 11) {
    // CPF: 000.000.000-00
    return val
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14)
  } else {
    // CNPJ: 00.000.000/0000-00
    return val
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .substring(0, 18)
  }
}

const handleInput = (e: Event): void => {
  const input = e.target as HTMLInputElement
  form.value.cpfCnpj = formatCpfCnpj(input.value)
}

const errorMessage = ref('')

const handleSave = (): void => {
  errorMessage.value = ''
  if (!form.value.name || !form.value.cpfCnpj || !form.value.email || !form.value.walletId) {
    errorMessage.value = 'Por favor, preencha todos os campos obrigatórios, incluindo o Wallet ID.'
    return
  }
  emit('save', { ...form.value })
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
    >
      <div
        class="bg-white w-full max-w-xl rounded-[30px] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300"
      >
        <!-- Header -->
        <div class="p-8 border-b border-slate-100 flex items-center justify-between">
          <div class="flex flex-col">
            <h3 class="text-2xl font-black text-[#1e1e2d] tracking-tight">
              {{ partner ? 'Editar Parceiro' : 'Novo Parceiro' }}
            </h3>
            <p class="text-slate-400 text-sm font-bold">
              Preencha os dados para o split de receitas.
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
        <div v-if="errorMessage" class="px-8 pt-6 pb-0">
          <div
            class="bg-red-50 text-red-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <AlertTriangle :size="16" />
            {{ errorMessage }}
          </div>
        </div>

        <!-- Form Body -->
        <div class="p-8 space-y-6">
          <div class="space-y-2">
            <label
              class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <User :size="12" /> Nome Completo
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Ex: João da Silva"
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
                class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <FileText :size="12" /> CPF ou CNPJ
              </label>
              <input
                v-model="form.cpfCnpj"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
                type="text"
                placeholder="000.000.000-00"
                @input="handleInput"
              />
            </div>

            <div class="space-y-2">
              <label
                class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
              >
                <Mail :size="12" /> E-mail
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="joao@email.com"
                class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"
            >
              <CreditCard :size="12" /> Wallet ID (Asaas)
            </label>
            <input
              v-model="form.walletId"
              type="text"
              placeholder="ID da carteira para split automático (Obrigatório)"
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:border-[var(--cca-blue)] focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
          <button
            class="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            class="bg-[#009ef7] hover:bg-[#008be0] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3"
            @click="handleSave"
          >
            <Save :size="18" />
            {{ partner ? 'Salvar Alterações' : 'Cadastrar Parceiro' }}
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
</style>
