<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Building2, ChevronDown, Check } from 'lucide-vue-next'
import db, { Company, initUserSession } from '../database/pouch'

const companies = ref<Company[]>([])
const activeCompany = ref<Company | null>(null)
const isDropdownOpen = ref(false)

onMounted(async () => {
  const sessionStr = localStorage.getItem('cca_session')
  if (!sessionStr) return

  const session = JSON.parse(sessionStr)
  const userId = session.id
  const currentTenantId = session.tenantId

  try {
    const allDocs = await db.allDocs({ include_docs: true })
    const userCompanies = allDocs.rows
      .map(row => row.doc as unknown as Company)
      .filter(doc => doc.type === 'company' && doc.userId === userId)

    companies.value = userCompanies
    
    // Set active company based on current session tenantId
    const active = userCompanies.find(c => c.tenantId === currentTenantId)
    if (active) {
      activeCompany.value = active
    } else if (userCompanies.length > 0) {
      // Fallback
      activeCompany.value = userCompanies[0]
    }
  } catch (err) {
    console.error('Erro ao buscar empresas para o switcher:', err)
  }
})

const switchCompany = async (company: Company) => {
  if (activeCompany.value?.tenantId === company.tenantId) {
    isDropdownOpen.value = false
    return
  }

  const sessionStr = localStorage.getItem('cca_session')
  if (sessionStr) {
    const session = JSON.parse(sessionStr)
    session.tenantId = company.tenantId
    session.company = company.name
    session.subscriptionId = company.asaasSubscriptionId || ''
    session.invoiceUrl = company.asaasInvoiceUrl || ''
    session.paymentStatus = company.paymentStatus || 'pending'
    
    localStorage.setItem('cca_session', JSON.stringify(session))
    
    // Reinicializa a sessão para o novo tenant
    initUserSession(company.tenantId)
    
    // Força um reload limpo para recarregar todos os dados do painel atual no novo contexto (WorkDB)
    window.location.reload()
  }
}
</script>

<template>
  <div v-if="companies.length > 0" class="relative mt-4 px-5 z-[100]">
    <button
      @click="isDropdownOpen = !isDropdownOpen"
      class="w-full bg-[#1b1b28] hover:bg-black/20 border border-white/5 rounded-xl p-3 flex items-center justify-between transition-all group"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="w-8 h-8 rounded-lg bg-[var(--cca-blue)]/20 text-[var(--cca-blue)] flex items-center justify-center shrink-0">
          <Building2 :size="16" />
        </div>
        <div class="flex flex-col items-start overflow-hidden text-left">
          <span class="text-white text-xs font-bold truncate w-full">{{ activeCompany?.name || 'Selecione' }}</span>
          <span class="text-slate-500 text-[9px] uppercase tracking-widest font-bold">{{ activeCompany?.cnpj || '' }}</span>
        </div>
      </div>
      <ChevronDown :size="14" class="text-slate-500 transition-transform" :class="isDropdownOpen ? 'rotate-180' : ''" />
    </button>

    <Transition name="dropdown-fade">
      <div
        v-if="isDropdownOpen"
        class="absolute left-5 right-5 top-[calc(100%+8px)] bg-[#1e1e2d] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden z-50"
      >
        <p class="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
          Trocar Empresa
        </p>
        <button
          v-for="company in companies"
          :key="company._id"
          @click="switchCompany(company)"
          class="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left group"
        >
          <div class="flex flex-col">
            <span class="text-sm font-bold text-slate-300 group-hover:text-white transition-colors" :class="company.tenantId === activeCompany?.tenantId ? 'text-[var(--cca-blue)]' : ''">
              {{ company.name }}
            </span>
            <span class="text-[10px] font-medium text-slate-500">{{ company.cnpj }}</span>
          </div>
          <Check v-if="company.tenantId === activeCompany?.tenantId" :size="16" class="text-[var(--cca-blue)]" />
        </button>
      </div>
    </Transition>
    
    <!-- Fechar dropdown ao clicar fora -->
    <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>
  </div>
</template>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
