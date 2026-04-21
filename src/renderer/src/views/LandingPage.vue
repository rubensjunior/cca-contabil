<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Users2,
  Globe2,
  Lock,
  CreditCard,
  Target
} from 'lucide-vue-next'

const router = useRouter()

const navigateToLogin = (): void => {
  router.push('/login')
}
const navigateToSignup = (): void => {
  router.push('/signup')
}

const features = [
  {
    icon: ShieldCheck,
    title: 'Blindagem Fiscal',
    description:
      'Garantia de que você só paga imposto sobre a sua parte, em total conformidade com a lei.'
  },
  {
    icon: Zap,
    title: 'Divisão Inteligente',
    description:
      'Repasse automatizado na fonte. Rapidez para o parceiro e segurança absoluta para a empresa.'
  },
  {
    icon: BarChart3,
    title: 'Gestão de Cobranças',
    description:
      'Organize faturas, recebimentos e repasses em um único dashboard transparente e centralizado.'
  }
]
</script>
<template>
  <div
    class="min-h-full w-full bg-slate-950 text-slate-200 selection:bg-blue-500/30 selection:text-white font-sans overflow-x-hidden"
  >
    <!-- Efeitos de Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"
      ></div>
      <div
        class="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow-delayed"
      ></div>
      <div
        class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100"
      ></div>
    </div>

    <!-- Hero Section -->
    <section class="relative z-10 pt-16 pb-32 px-6 overflow-hidden">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8 animate-fade-in-left">
          <div class="text-3xl font-black text-white mb-12">
            CCA<span class="text-blue-500">.</span> Split
          </div>

          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4"
          >
            <Zap :size="14" />
            Nova Geração de Inteligência Fiscal
          </div>

          <h2 class="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
            Escale seu negócio <br />
            <span
              class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 italic"
            >
              sem impostos em excesso.
            </span>
          </h2>

          <p class="text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
            A plataforma que organiza cobrança, automatiza e blinda juridicamente o repasse de
            pagamentos para sua rede de especialistas. Elimine a bitributação e foque no seu
            crescimento.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              class="group bg-amber-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-lg transition-all hover:bg-amber-300 active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20"
              @click="navigateToSignup"
            >
              Criar minha conta
              <ArrowRight class="group-hover:translate-x-1 transition-transform" :size="20" />
            </button>
            <button
              class="px-8 py-4 rounded-2xl font-bold text-lg text-white border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3"
              @click="navigateToLogin"
            >
              Acesso portal
            </button>
          </div>

          <div class="flex items-center gap-6 pt-10 text-slate-500 border-t border-white/5">
            <div class="flex flex-col">
              <span class="text-white font-bold text-xl">+R$ 2.4M</span>
              <span class="text-[10px] uppercase tracking-widest font-bold">Processados/mês</span>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="flex flex-col">
              <span class="text-white font-bold text-xl">100%</span>
              <span class="text-[10px] uppercase tracking-widest font-bold">Segurança Fiscal</span>
            </div>
          </div>
        </div>

        <!-- Hero Visual -->
        <div class="relative animate-fade-in-right">
          <div
            class="relative z-20 bg-slate-900/40 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden group"
          >
            <!-- Glassmorphism Card Mockup -->
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <div class="space-y-1">
                  <p class="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Performance da Operação
                  </p>
                  <p class="text-3xl font-black text-white">R$ 54.290,00</p>
                </div>
                <div
                  class="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400"
                >
                  <BarChart3 :size="24" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p class="text-[10px] text-slate-500 font-bold uppercase">Repasses Efetuados</p>
                  <p class="text-xl font-bold text-emerald-400">R$ 12.400</p>
                </div>
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <p class="text-[10px] text-slate-500 font-bold uppercase">Taxa de Eficiência</p>
                  <p class="text-xl font-bold text-blue-400">98.4%</p>
                </div>
              </div>

              <!-- Abstract Chart Line -->
              <div class="h-32 w-full mt-4 flex items-end gap-1">
                <div
                  v-for="h in [40, 70, 45, 90, 65, 80, 100, 85, 95]"
                  :key="h"
                  :style="{ height: h + '%' }"
                  class="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md opacity-40 group-hover:opacity-100 transition-opacity duration-500"
                ></div>
              </div>
            </div>

            <!-- Floating Decorative Elements -->
            <div
              class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"
            ></div>
            <div
              class="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
            ></div>
          </div>

          <!-- Badge flutuante -->
          <div
            class="absolute -bottom-6 -right-6 lg:right-10 z-30 bg-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-slow"
          >
            <div
              class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white"
            >
              <Users2 :size="20" />
            </div>
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase">Novos Parceiros</p>
              <p class="text-sm font-black text-slate-900">+12 esta semana</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section
      id="features"
      class="relative z-10 py-32 bg-white/5 backdrop-blur-sm border-y border-white/5 scroll-mt-28"
    >
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center space-y-4 mb-20">
          <h2 class="text-4xl font-black text-white italic">Diferenciais Estratégicos</h2>
          <div class="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
          <p class="text-slate-400 max-w-2xl mx-auto font-medium">
            Controle total da sua operação com ferramentas pensadas para o crescimento sustentável e
            seguro.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all group"
          >
            <div
              class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform"
            >
              <component :is="feature.icon" :size="28" />
            </div>
            <h3 class="text-xl font-bold text-white mb-3">{{ feature.title }}</h3>
            <p class="text-slate-400 leading-relaxed text-sm font-medium">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mid-Page CTA 1 -->
    <section class="relative z-10 py-16 bg-blue-600/5 px-6 border-b border-white/5">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="space-y-2">
          <h3 class="text-2xl font-black text-white">Pronto para automatizar seus repasses?</h3>
          <p class="text-slate-400 font-medium">Configure sua operação em menos de 10 minutos.</p>
        </div>
        <button
          class="bg-amber-400 text-slate-950 hover:bg-amber-300 px-10 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl shadow-amber-500/20 flex items-center gap-3"
          @click="navigateToSignup"
        >
          Começar Agora <ArrowRight :size="20" />
        </button>
      </div>
    </section>

    <!-- Seção: O Problema -->
    <section id="solucao" class="relative z-10 py-32 px-6 scroll-mt-28">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div class="relative order-2 lg:order-1">
          <div class="absolute -inset-4 bg-red-500/10 rounded-[3rem] blur-3xl"></div>
          <div
            class="relative bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] space-y-6"
          >
            <div
              class="flex items-center gap-4 text-red-400 font-bold uppercase text-xs tracking-widest"
            >
              <span class="w-12 h-px bg-red-400/50"></span>
              O Custo da Ineficiência
            </div>
            <h3 class="text-3xl font-black text-white">
              Você está perdendo até 27,5% da sua margem agora mesmo?
            </h3>
            <p class="text-slate-400 leading-relaxed font-medium">
              Sem um sistema de split automatizado, você acaba pagando impostos sobre o faturamento
              bruto, incluindo a parte que pertence ao seu parceiro. Essa bitributação desnecessária
              é o maior ralo de lucro em redes de especialistas.
            </p>
            <div class="space-y-4 pt-4">
              <div
                v-for="(item, idx) in [
                  'Bitributação desnecessária',
                  'Risco de vínculo trabalhista',
                  'Caos em planilhas financeiras'
                ]"
                :key="idx"
                class="flex items-center gap-3 text-slate-300"
              >
                <div
                  class="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-[10px] font-bold"
                >
                  X
                </div>
                <span class="text-sm font-medium">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-8 order-1 lg:order-2">
          <h2 class="text-4xl lg:text-5xl font-black text-white leading-tight">
            Pare de queimar dinheiro com impostos que
            <span class="text-red-400">não são seus.</span>
          </h2>
          <p class="text-lg text-slate-400 leading-relaxed font-medium">
            O CCA Split foi desenhado para quem cansa de ver a margem de lucro desaparecer em
            tributos em duplicidade. Nossa inteligência financeira separa o que é seu e o que é do
            parceiro na origem, garantindo que o imposto incida apenas sobre o valor correto.
          </p>
          <div class="pt-6">
            <button
              class="group bg-amber-400 text-slate-950 hover:bg-amber-300 px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center lg:justify-start gap-3 shadow-xl shadow-amber-500/20"
              @click="navigateToSignup"
            >
              Quero recuperar minha margem
              <ArrowRight class="group-hover:translate-x-1 transition-transform" :size="20" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Seção: Como Funciona -->
    <section id="como-funciona" class="relative z-10 py-32 bg-slate-900/30 scroll-mt-28">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-20 space-y-4">
          <h2 class="text-4xl font-black text-white">
            Simples para você, <span class="text-blue-500">justo</span> para todos.
          </h2>
          <p class="text-slate-400 font-medium">
            A jornada da cobrança ao lucro, em 4 passos automatizados.
          </p>
        </div>

        <div class="grid md:grid-cols-4 gap-8">
          <div
            v-for="(step, idx) in [
              { t: 'Cadastro', d: 'Cadastre sua empresa e seus parceiros em minutos.' },
              { t: 'Cobrança', d: 'Emita cobranças integradas para seus clientes.' },
              { t: 'Divisão', d: 'O sistema separa as partes automaticamente no recebimento.' },
              { t: 'Repasse', d: 'Dinheiro direto na conta de quem trabalhou.' }
            ]"
            :key="idx"
            class="relative group"
          >
            <div
              class="mb-6 text-7xl font-black text-white/5 group-hover:text-blue-500/10 transition-colors"
            >
              {{ idx + 1 }}
            </div>
            <h4 class="text-xl font-bold text-white mb-2">{{ step.t }}</h4>
            <p class="text-slate-400 text-sm leading-relaxed">{{ step.d }}</p>
            <div
              v-if="idx < 3"
              class="hidden md:block absolute top-8 -right-4 w-8 h-px bg-white/10"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mid-Page CTA 2 -->
    <section class="relative z-10 py-20 px-6">
      <div class="max-w-4xl mx-auto text-center space-y-8">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase"
        >
          <CreditCard :size="12" /> Checkout Transparente
        </div>
        <h2 class="text-3xl lg:text-4xl font-black text-white leading-tight">
          Tudo o que você precisa para crescer <br />
          <span class="text-blue-500">sem bitributação.</span>
        </h2>
        <p class="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
          Nossa tecnologia de split cuida de toda a complexidade fiscal enquanto você foca no que
          realmente importa: suas vendas.
        </p>
        <div class="pt-4">
          <button
            class="bg-amber-400 text-slate-950 hover:bg-amber-300 px-10 py-4 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3 mx-auto"
            @click="navigateToSignup"
          >
            Quero Segurança Fiscal <Target :size="22" class="text-slate-950" />
          </button>
        </div>
      </div>
    </section>

    <!-- Seção: Segurança & FAQ -->
    <section id="faq" class="relative z-10 py-32 px-6 scroll-mt-28">
      <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20">
        <div class="space-y-8">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase"
          >
            <Lock :size="12" /> Blindagem Total
          </div>
          <h2 class="text-4xl font-black text-white">Segurança jurídica que escala com você.</h2>
          <p class="text-slate-400 font-medium leading-relaxed">
            Não é apenas sobre tecnologia, é sobre conformidade. O CCA Split utiliza contratos de
            parceria e integração com gateways de pagamento (Asaas) para garantir que toda
            movimentação financeira tenha lastro legal indiscutível.
          </p>
          <div class="grid sm:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <ShieldCheck class="text-emerald-400" :size="24" />
              <h5 class="text-white font-bold">Respaldo Fiscal</h5>
              <p class="text-xs text-slate-500">
                Emissão de notas fiscais configurada para o modelo de split.
              </p>
            </div>
            <div class="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Users2 class="text-blue-400" :size="24" />
              <h5 class="text-white font-bold">Gestão Manual Zero</h5>
              <p class="text-xs text-slate-500">Esqueça as conferências em extratos bancários.</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <h3 class="text-2xl font-bold text-white mb-8 italic">Dúvidas Frequentes</h3>
          <div
            v-for="(faq, idx) in [
              {
                q: 'O modelo de Split é legal?',
                a: 'Sim. É um modelo previsto e utilizado por grandes plataformas (Uber, iFood) para evitar a bitributação.'
              },
              {
                q: 'Preciso de um CNPJ para meus parceiros?',
                a: 'O ideal é que seus especialistas sejam PJ para maximizar a economia fiscal, mas o sistema suporta diversas configurações.'
              },
              {
                q: 'Como é feito o repasse?',
                a: 'O repasse é automatizado via gateway de pagamento, caindo diretamente na conta cadastrada do parceiro.'
              },
              {
                q: 'Posso definir taxas diferenciadas?',
                a: 'Com certeza. Você tem controle total sobre as regras de divisão de cada serviço ou parceiro.'
              }
            ]"
            :key="idx"
            class="p-6 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/10 transition-colors"
          >
            <h4 class="text-white font-bold mb-2">{{ faq.q }}</h4>
            <p class="text-sm text-slate-400 leading-relaxed">{{ faq.a }}</p>
          </div>

          <div class="pt-6 text-center lg:text-left">
            <p class="text-slate-400 mb-4 font-medium">
              Ainda tem dúvidas sobre o modelo de Split?
            </p>
            <button
              class="text-blue-400 font-bold flex items-center gap-2 hover:gap-3 transition-all mx-auto lg:mx-0"
              @click="navigateToSignup"
            >
              Falar com um consultor <ArrowRight :size="18" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final Section -->
    <section class="relative z-10 py-32 px-6">
      <div
        class="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 lg:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl"
      >
        <!-- Decorative patterns -->
        <div class="absolute top-0 right-0 p-8 opacity-20 rotate-12">
          <Globe2 :size="200" />
        </div>
        <div class="absolute bottom-0 left-0 p-8 opacity-20 -rotate-12">
          <Lock :size="150" />
        </div>

        <h2 class="text-4xl lg:text-5xl font-black text-white leading-tight">
          Pronto para revolucionar <br />
          seu modelo de negócio?
        </h2>
        <p class="text-blue-100 text-lg max-w-xl mx-auto font-medium">
          Junte-se a centenas de gestores que já automatizaram seus repasses e escalaram sua
          operação com o CCA. Split.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            class="bg-amber-400 text-slate-950 px-10 py-4 rounded-2xl font-black text-xl hover:bg-amber-300 transition-all active:scale-95 shadow-xl shadow-amber-500/20"
            @click="navigateToSignup"
          >
            Começar Agora Grátis
          </button>
          <button
            class="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-2xl font-black text-xl hover:bg-white/20 transition-all active:scale-95"
            @click="navigateToSignup"
          >
            Falar com Especialista
          </button>
        </div>
      </div>
    </section>

    <!-- Branding Footer -->
    <footer class="relative z-10 py-12 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <h2 class="text-xl font-bold text-white mb-8">
          CCA<span class="text-blue-500">.</span> Split
        </h2>
        <div class="flex flex-col items-center">
          <p class="text-[8px] uppercase tracking-[0.3em] text-slate-500 mb-4 font-bold">
            Desenvolvido e mantido por
          </p>
          <div class="flex items-center gap-8 opacity-60">
            <span class="text-[10px] font-black text-white tracking-tight uppercase"
              >CCA Contabilidade</span
            >
            <div class="w-px h-4 bg-white/20"></div>
            <span class="text-[10px] font-black text-blue-500 tracking-tight uppercase"
              >RKS Tech Solution</span
            >
          </div>
        </div>
        <p class="mt-12 text-slate-600 text-[10px] font-medium tracking-wider">
          © 2026 CCA Split. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
/* Scroll behavior customizado via JS na função scrollToSection */
</style>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.15;
    transform: scale(1.1);
  }
}

@keyframes pulse-slow-delayed {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(1.1);
  }
  50% {
    opacity: 0.15;
    transform: scale(1);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 10s ease-in-out infinite;
}

.animate-pulse-slow-delayed {
  animation: pulse-slow-delayed 10s ease-in-out infinite;
  animation-delay: 5s;
}

.animate-fade-in-left {
  animation: fadeInLeft 1s ease-out forwards;
}

.animate-fade-in-right {
  animation: fadeInRight 1s ease-out forwards;
  animation-delay: 0.2s;
}

.animate-bounce-slow {
  animation: float 4s ease-in-out infinite;
}
</style>
