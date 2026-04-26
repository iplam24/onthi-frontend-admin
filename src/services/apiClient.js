import axios from 'axios'
import { API_CONFIG, COOKIE_KEYS, HTTP_STATUS, STORAGE_KEYS } from '@/constants'
import { deleteCookie, getCookie } from '@/services/cookie'

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - thêm token vào header
apiClient.interceptors.request.use(
  config => {
    const token = getCookie(COOKIE_KEYS.AUTH_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor - xử lý lỗi 401 (token hết hạn)
apiClient.interceptors.response.use(
  response => response,
  error => {
    const requestUrl = error.config?.url || ''

    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !requestUrl.includes('/auth/login')
    ) {
      // Token hết hạn, xóa token và redirect về login
      deleteCookie(COOKIE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
