import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/services/api'
import { COOKIE_KEYS, STORAGE_KEYS } from '@/constants'
import { deleteCookie, getCookie, setCookie } from '@/services/cookie'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(getCookie(COOKIE_KEYS.AUTH_TOKEN) || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.name || user.value?.username || 'User')

  // Actions
  async function login(username, password) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await authAPI.login({
        username,
        password
      })

      const payload = response.data?.data ?? response.data ?? {}
      const tokenValue = payload.access_token || payload.token || payload.accessToken || null
      const userData = payload.user ?? {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        roles: payload.roles,
        type: payload.type
      }

      if (!tokenValue) {
        throw new Error('No token returned from login response')
      }

      // Lưu token trong cookie, user info trong localStorage để có thể khôi phục phiên
      token.value = tokenValue
      user.value = userData
      setCookie(COOKIE_KEYS.AUTH_TOKEN, tokenValue, {
        maxAge: 60 * 60 * 24 * 7
      })
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData))
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)

      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Đăng nhập thất bại'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    deleteCookie(COOKIE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
  }

  function restoreSession() {
    const savedToken = getCookie(COOKIE_KEYS.AUTH_TOKEN) || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    
    if (savedToken && savedUser) {
      token.value = savedToken
      if (!getCookie(COOKIE_KEYS.AUTH_TOKEN)) {
        setCookie(COOKIE_KEYS.AUTH_TOKEN, savedToken, {
          maxAge: 60 * 60 * 24 * 7
        })
      }

      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Failed to parse user info:', e)
      }
    } else if (savedToken) {
      token.value = savedToken
      if (!getCookie(COOKIE_KEYS.AUTH_TOKEN)) {
        setCookie(COOKIE_KEYS.AUTH_TOKEN, savedToken, {
          maxAge: 60 * 60 * 24 * 7
        })
      }

      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    userName,
    
    // Actions
    login,
    logout,
    restoreSession
  }
})
