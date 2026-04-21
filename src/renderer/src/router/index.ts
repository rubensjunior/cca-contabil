import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Signup from '../views/Signup.vue'
import Dashboard from '../views/Dashboard.vue'
import Checkout from '../views/Checkout.vue'

import { routerState } from './routerState'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
    path: '/checkout',
    name: 'Checkout',
    component: Checkout,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Navigation Guard simples para autenticação local
router.beforeEach((to, _from, next) => {
  routerState.isLoading = true
  const session = localStorage.getItem('cca_session')

  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else if (to.path === '/login' && session) {
    next('/dashboard')
  } else if (to.meta.requiresPayment && session) {
    const sessionData = JSON.parse(session)
    // Redirecionar para checkout se o pagamento for pendente (baseado na sessão inicial)
    // Em um app real, verificaríamos o status atualizado no banco/API
    if (sessionData.paymentStatus === 'pending' || !sessionData.isPaid) {
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
