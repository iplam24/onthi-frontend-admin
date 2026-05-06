import { createRouter, createWebHistory } from 'vue-router'
import { COOKIE_KEYS } from '@/constants'
import { getCookie } from '@/services/cookie'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false, layout: 'blank' }
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/levels',
      name: 'Levels',
      component: () => import('../views/LevelsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subjects',
      alias: '/materials',
      name: 'Subjects',
      component: () => import('../views/SubjectsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subjects/create',
      name: 'SubjectCreate',
      component: () => import('../views/SubjectCreateView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/subjects/edit/:id',
      name: 'SubjectEdit',
      component: () => import('../views/SubjectCreateView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/topics',
      name: 'Topics',
      component: () => import('../views/TopicsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/questions',
      name: 'Questions',
      component: () => import('../views/QuestionsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exams',
      name: 'Exams',
      component: () => import('@/views/ExamsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exams/create',
      name: 'ExamCreate',
      component: () => import('@/views/ExamCreateView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/countdowns',
      name: 'Countdowns',
      component: () => import('../views/CountdownsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard để check xác thực
router.beforeEach((to, from, next) => {
  const authToken = getCookie(COOKIE_KEYS.AUTH_TOKEN)
  
  if (to.meta.requiresAuth && !authToken) {
    // Redirect to login if route requires auth and user is not logged in
    next('/login')
  } else if (to.path === '/login' && authToken) {
    // Redirect to home if user is already logged in
    next('/')
  } else {
    next()
  }
})

export default router
