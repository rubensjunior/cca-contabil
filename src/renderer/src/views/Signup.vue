<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import db, { User, AppConfig, initUserSession, getWorkDB } from '../database/pouch'

const router = useRouter()

const name = ref('')
const officeName = ref('')
const cpfCnpj = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')

// Campos de Endereço
const cep = ref('')
const street = ref('')
const number = ref('')
const complement = ref('')
const neighborhood = ref('')
const city = ref('')
const state = ref('')

const isSearchingCep = ref(false)

const states = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO'
]

const isValidEmail = (e: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

const currentStep = ref(1)
const showCpfAlert = ref(false)
const isCheckingCpf = ref(false)
const existingCustomerName = ref('')

const checkCpfDuplicity = async (): Promise<void> => {
  if (cpfCnpj.value.length < 14) return // Mínimo para um CPF formatado

  isCheckingCpf.value = true
  try {
    const result = await window.api.asaas.checkCustomer(cpfCnpj.value)
    if (result.success && result.exists) {
      existingCustomerName.value = result.name || ''
      showCpfAlert.value = true
    } else {
      currentStep.value++
    }
  } catch (err) {
    console.error('Erro ao verificar CPF:', err)
    currentStep.value++ // Se falhar a checagem, permite prosseguir (fail-safe)
  } finally {
    isCheckingCpf.value = false
  }
}

const handleNewBusiness = (): void => {
  showCpfAlert.value = false
  currentStep.value++
}

const nextStep = (): void => {
  error.value = ''
  // Validação básica por step
  if (currentStep.value === 1) {
    if (!name.value || !email.value || !password.value) {
      error.value = 'Preencha os dados de acesso para continuar.'
      return
    }
    if (!isValidEmail(email.value)) {
      error.value = 'Por favor, insira um e-mail válido.'
      return
    }
  }
  if (currentStep.value === 2) {
    if (!officeName.value || !cpfCnpj.value || !phone.value) {
      error.value = 'Preencha os dados do escritório para continuar.'
      return
    }
    // Verificação inteligente de CPF
    checkCpfDuplicity()
    return // O avanço real acontece dentro de checkCpfDuplicity se não houver duplicidade
  }
  currentStep.value++
}

const prevStep = (): void => {
  error.value = ''
  currentStep.value--
}

const fetchAddressByCep = async (): Promise<void> => {
  const cleanCep = cep.value.replace(/\D/g, '')
  if (cleanCep.length !== 8) return

  isSearchingCep.value = true
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    const data = await response.json()

    if (!data.erro) {
      street.value = data.logradouro
      neighborhood.value = data.bairro
      city.value = data.localidade
      state.value = data.uf
    }
  } catch (err) {
    console.error('Erro ao buscar CEP:', err)
  } finally {
    isSearchingCep.value = false
  }
}

const isLoading = ref(false)
const error = ref('')

const handleSignup = async (): Promise<void> => {
  isLoading.value = true
  error.value = ''

  try {
    // 1. Verificar se o e-mail já existe
    const userId = `user:${email.value}`
    try {
      await db.get(userId)
      error.value = 'Este e-mail já está cadastrado.'
      isLoading.value = false
      return
    } catch (err: unknown) {
      if ((err as { status?: number }).status !== 404) throw err
    }

    // 2. Gerar Tenant ID único e imutável
    const tenantId = crypto.randomUUID()

    // 3. Criar Documento do Usuário (Admin) no AuthDB
    const newUser: User = {
      _id: userId,
      type: 'user',
      name: name.value,
      email: email.value,
      passwordHash: password.value, // Simplificado para MVP
      role: 'admin',
      status: 'active',
      tenantId: tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'pending'
    }

    // 4. Inicializar Sessão de Trabalho do Tenant
    initUserSession(tenantId)
    const workDB = getWorkDB()

    // 5. Criar Documento de Configuração do Escritório no WorkDB
    const configId = 'config:main'
    const newConfig: AppConfig = {
      _id: configId,
      type: 'config',
      officeName: officeName.value,
      cnpj: cpfCnpj.value,
      phone: phone.value,
      address: {
        cep: cep.value,
        street: street.value,
        number: number.value,
        complement: complement.value,
        neighborhood: neighborhood.value,
        city: city.value,
        state: state.value
      },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    // 6. Salvar nos Bancos Corretos
    await db.put(newUser) // Salva no AuthDB
    await workDB.put(newConfig) // Salva no WorkDB (isolado)

    // 5. Integração com Asaas
    const asaasResult = await window.api.asaas.setupPayment({
      name: name.value,
      email: email.value,
      cpfCnpj: cpfCnpj.value,
      mobilePhone: phone.value
    })

    if (!asaasResult.success) {
      // Se falhar o Asaas, ainda assim salvamos o user mas exibimos erro para tentar novamente depois ou entrar em contato
      error.value =
        'Cadastro realizado, mas houve um erro ao gerar a cobrança: ' + asaasResult.error
      isLoading.value = false
      return
    }

    // 8. Atualizar usuário com dados do Asaas (No AuthDB)
    const updatedUser = await db.get<User>(userId)
    await db.put({
      ...updatedUser,
      asaasCustomerId: asaasResult.customerId,
      asaasSubscriptionId: asaasResult.subscriptionId,
      asaasInvoiceUrl: asaasResult.invoiceUrl
    })

    // 9. Iniciar Sessão Local
    localStorage.setItem(
      'cca_session',
      JSON.stringify({
        id: newUser._id,
        tenantId: tenantId,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email,
        office: officeName.value,
        subscriptionId: asaasResult.subscriptionId,
        invoiceUrl: asaasResult.invoiceUrl,
        paymentStatus: 'pending'
      })
    )

    // 8. Redirecionar para Checkout
    router.push('/checkout')
  } catch (err: unknown) {
    console.error('Erro no cadastro:', err)
    error.value = 'Não foi possível realizar o cadastro. Tente novamente.'
  } finally {
    isLoading.value = false
  }
}

// Funções de Máscara
const onCpfCnpjInput = (e: Event): void => {
  const target = e.target as HTMLInputElement
  let v = target.value.replace(/\D/g, '')

  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    v = v.replace(/^(\d{2})(\d)/, '$1.$2')
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
    v = v.replace(/(\d{4})(\d)/, '$1-$2')
  }
  cpfCnpj.value = v.substring(0, 18)
}

const onPhoneInput = (e: Event): void => {
  const target = e.target as HTMLInputElement
  let v = target.value.replace(/\D/g, '')
  v = v.replace(/^(\d{2})(\d)/g, '($1) $2')
  v = v.replace(/(\d)(\d{4})$/, '$1-$2')
  phone.value = v.substring(0, 15)
}

const onCepInput = (e: Event): void => {
  const target = e.target as HTMLInputElement
  let v = target.value.replace(/\D/g, '')
  v = v.replace(/^(\d{5})(\d)/, '$1-$2')
  cep.value = v.substring(0, 9)
}
</script>

<template>
  <div class="h-full bg-white flex selection:bg-blue-500/30 overflow-hidden relative">
    <!-- Modal de Alerta: CPF Duplicado -->
    <Transition name="fade">
      <div
        v-if="showCpfAlert"
        class="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
      >
        <div
          class="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 animate-fade-in-up"
        >
          <div class="flex flex-col items-center text-center">
            <div
              class="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-500"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 class="text-xl font-bold text-slate-900 mb-2">Conta já identificada!</h3>
            <p class="text-slate-500 text-sm leading-relaxed mb-8">
              O CPF/CNPJ <span class="font-bold text-slate-700">{{ cpfCnpj }}</span> já possui uma
              assinatura ativa no Asaas em nome de
              <span class="font-bold text-blue-600">{{ existingCustomerName }}</span
              >.
            </p>

            <div class="w-full space-y-3">
              <button
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                @click="handleNewBusiness"
              >
                Gerenciar Novo Negócio
              </button>
              <button
                class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                @click="router.push('/login')"
              >
                Já tenho conta / Fazer Login
              </button>
            </div>

            <p class="mt-6 text-[10px] text-slate-400 uppercase tracking-widest leading-loose">
              Escolha "Novo Negócio" se deseja uma conta separada para outra empresa sob o mesmo
              CPF.
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Lado Esquerdo: Formulário -->
    <div
      class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:px-24 bg-white relative overflow-hidden"
    >
      <div class="w-full max-w-xl flex flex-col items-center animate-fade-in-up">
        <!-- Logo Typography Corporate -->
        <div class="mb-4 text-center flex flex-col items-center">
          <div class="inline-flex items-center justify-center mb-2">
            <h1 class="text-3xl font-bold tracking-tight text-slate-900">
              CCA<span class="text-blue-600">.</span> Split
            </h1>
          </div>
          <p class="text-slate-500 text-sm">Crie sua conta profissional hoje</p>
        </div>

        <!-- Plan Card -->
        <div
          class="mb-6 p-5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg shadow-slate-200 border border-slate-800 relative overflow-hidden animate-fade-in-up w-full"
          style="animation-delay: 0.1s"
        >
          <div class="relative z-10">
            <p class="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">
              Assinatura Mensal
            </p>
            <h4 class="text-lg font-bold tracking-tight">Plano Profissional</h4>
          </div>
          <div class="relative z-10 text-right">
            <p class="text-2xl font-black text-white leading-none">
              R$ 55<span class="text-[10px] font-medium text-slate-400 ml-1">/mês</span>
            </p>
          </div>
        </div>

        <form
          class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2"
          @submit.prevent="handleSignup"
        >
          <div
            v-if="error"
            class="col-span-full bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm text-center font-medium animate-shake mb-1"
          >
            {{ error }}
          </div>

          <!-- Step Contents -->
          <div class="col-span-full relative">
            <Transition name="step-fade" mode="out-in">
              <!-- Step 1: Dados de Acesso -->
              <div
                v-if="currentStep === 1"
                key="step-1"
                class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2"
              >
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Nome Completo</label
                  >
                  <input
                    v-model="name"
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >E-mail Corporativo</label
                  >
                  <input
                    v-model="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2 col-span-full">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Senha de Acesso</label
                  >
                  <input
                    v-model="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <!-- Step 2: Dados do Escritório -->
              <div
                v-else-if="currentStep === 2"
                key="step-2"
                class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2"
              >
                <div class="space-y-2 col-span-full">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Nome do Escritório</label
                  >
                  <input
                    v-model="officeName"
                    type="text"
                    required
                    placeholder="Ex: Escritório ABC"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >CPF ou CNPJ</label
                  >
                  <input
                    v-model="cpfCnpj"
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                    @input="onCpfCnpjInput"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >WhatsApp</label
                  >
                  <input
                    v-model="phone"
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                    @input="onPhoneInput"
                  />
                </div>
              </div>

              <!-- Step 3: Endereço -->
              <div
                v-else-if="currentStep === 3"
                key="step-3"
                class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2"
              >
                <div class="space-y-2 relative">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >CEP</label
                  >
                  <div class="relative">
                    <input
                      v-model="cep"
                      type="text"
                      required
                      placeholder="00000-000"
                      class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                      @input="onCepInput"
                      @blur="fetchAddressByCep"
                    />

                    <div v-if="isSearchingCep" class="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg
                        class="animate-spin h-4 w-4 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Logradouro</label
                  >
                  <input
                    v-model="street"
                    type="text"
                    required
                    placeholder="Rua, Avenida, etc."
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Número</label
                  >
                  <input
                    v-model="number"
                    type="text"
                    required
                    placeholder="123"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Complemento</label
                  >
                  <input
                    v-model="complement"
                    type="text"
                    placeholder="Opcional"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Bairro</label
                  >
                  <input
                    v-model="neighborhood"
                    type="text"
                    required
                    placeholder="Centro"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2 md:col-span-1">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Cidade</label
                  >
                  <input
                    v-model="city"
                    type="text"
                    required
                    placeholder="São Paulo"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div class="space-y-2 md:col-span-1">
                  <label class="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1"
                    >Estado (UF)</label
                  >
                  <select
                    v-model="state"
                    required
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer pr-10"
                    :style="{
                      backgroundImage: `url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E&quot;)`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1rem'
                    }"
                  >
                    <option value="" disabled selected>UF</option>
                    <option v-for="uf in states" :key="uf" :value="uf">
                      {{ uf }}
                    </option>
                  </select>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Navegação -->
          <div class="col-span-full pt-4 flex gap-4">
            <button
              v-if="currentStep > 1"
              type="button"
              class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
              @click="prevStep"
            >
              Voltar
            </button>

            <button
              v-if="currentStep < 3"
              type="button"
              :disabled="isCheckingCpf"
              class="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-70"
              @click="nextStep"
            >
              <span v-if="!isCheckingCpf">Próximo Passo</span>
              <span v-else class="flex items-center gap-2">
                <svg
                  class="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Validando...
              </span>
            </button>

            <button
              v-if="currentStep === 3"
              type="submit"
              :disabled="isLoading"
              class="flex-[2] bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              <span v-if="!isLoading">Finalizar Configuração</span>
              <span v-else class="flex items-center gap-2">
                <svg
                  class="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processando...
              </span>
            </button>
          </div>
        </form>

        <footer class="mt-4 pt-4 border-t border-slate-100 text-center">
          <p class="text-slate-500 text-sm">
            Já possui uma conta ativa?
            <router-link
              to="/login"
              class="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1"
            >
              Fazer login
            </router-link>
          </p>
        </footer>
      </div>

      <!-- Branding Footer Highlighted -->
      <div class="mt-12 pt-8 border-t border-slate-50 w-full flex flex-col items-center">
        <p class="text-[8px] uppercase tracking-[0.3em] text-slate-400 mb-4 font-bold">
          Desenvolvido e mantido por
        </p>
        <div class="flex items-center gap-8 opacity-80 hover:opacity-100 transition-opacity">
          <div class="flex flex-col items-center">
            <span class="text-xs font-black text-slate-900 tracking-tight">CCA CONTABILIDADE</span>
          </div>
          <div class="w-px h-4 bg-slate-200"></div>
          <div class="flex flex-col items-center">
            <span class="text-xs font-black text-blue-600 tracking-tight">RKS TECH SOLUTION</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lado Direito: Conteúdo / Visual -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-indigo-500/20 to-blue-400/30 animate-gradient"
      ></div>
      <div
        class="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"
      ></div>
      <div
        class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed"
      ></div>

      <div class="relative z-10 w-full flex flex-col justify-center px-16 xl:px-24">
        <div class="max-w-lg">
          <div class="w-12 h-1 bg-blue-500 mb-8 rounded-full"></div>
          <h3 class="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Escalabilidade para seu <br />
            <span class="text-blue-400">escritório contábil.</span>
          </h3>
          <p class="text-slate-400 mt-6 text-lg leading-relaxed">
            Nossa plataforma foi desenhada para simplificar processos complexos, permitindo que você
            foque no crescimento dos seus clientes.
          </p>

          <div class="mt-12 space-y-6">
            <div class="flex items-center gap-4 text-slate-300">
              <div
                class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"
              >
                ✓
              </div>
              <span>Multi-usuários e permissões</span>
            </div>
            <div class="flex items-center gap-4 text-slate-300">
              <div
                class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"
              >
                ✓
              </div>
              <span>Relatórios financeiros em tempo real</span>
            </div>
            <div class="flex items-center gap-4 text-slate-300">
              <div
                class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"
              >
                ✓
              </div>
              <span>Integração nativa com APIs de pagamento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

@keyframes pulse-soft {
  0%,
  100% {
    opacity: 0.05;
  }
  50% {
    opacity: 0.15;
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 8s ease-in-out infinite;
  animation-delay: 2s;
}

.animate-pulse-soft {
  animation: pulse-soft 4s ease-in-out infinite;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 300% 300%;
  animation: gradientBG 12s ease infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

/* Transitions para as etapas */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #f1f5f9;
  -webkit-box-shadow: 0 0 0px 1000px #020617 inset;
  transition: background-color 5000s ease-in-out 0s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
