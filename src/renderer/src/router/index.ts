import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'
import Dashboard from '../views/Dashboard.vue'
import Checkout from '../views/Checkout.vue'
import LandingPage from '../views/LandingPage.vue'
import InternalSales from '../views/InternalSales.vue'
import Profile from '../views/Profile.vue'

import { routerState } from './routerState'

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPage
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, requiresPayment: true }
  },
  {
    path: '/dashboard/sales',
    name: 'InternalSales',
    component: InternalSales,
    meta: { requiresAuth: true, requiresPayment: true }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: Checkout,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true, requiresPayment: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

interface SessionData {
  id: string
  tenantId: string
  paymentStatus?: string
  isPaid?: boolean
}

// Navigation Guard simples para autenticação local
router.beforeEach((to, from, next) => {
  routerState.isLoading = true
  const session = localStorage.getItem('cca_session')

  console.log(`Router: Indo de ${from.path} para ${to.path}. Sessão: ${!!session}`)

  // 1. Validar se a sessão é real (contém ID e Tenant)
  let sessionData: SessionData | null = null
  if (session) {
    try {
      const parsed = JSON.parse(session)
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.tenantId) {
        sessionData = parsed as SessionData
      } else {
        console.warn('Router: Sessão inválida detectada. Limpando...')
        localStorage.removeItem('cca_session')
      }
    } catch (e) {
      console.error('Router: Erro ao ler sessão:', e)
      localStorage.removeItem('cca_session')
    }
  }

  // 2. Lógica de Redirecionamento
  if (to.meta.requiresAuth && !sessionData) {
    console.log('Router: Protegido e sem sessão. Indo para Login.')
    next('/login')
  } else if (to.path === '/login' && sessionData) {
    console.log('Router: Já logado. Pulando para Dashboard.')
    next('/dashboard')
  } else if (to.meta.requiresPayment && sessionData) {
    // Redirecionar para checkout se o pagamento for pendente
    if (sessionData.paymentStatus === 'pending' || !sessionData.isPaid) {
      console.log('Router: Pagamento pendente. Indo para Checkout.')
      next('/checkout')
    } else {
      next()
    }
  } else {
    next()
  }
})

router.afterEach(() => {
  // Pequeno delay opcional para garantir que o usuário veja a transição se ela for muito rápida
  setTimeout(() => {
    routerState.isLoading = false
  }, 300)
})

export default router
