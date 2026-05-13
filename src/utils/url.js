import { API_CONFIG } from '@/constants'

/**
 * Resolves a potentially relative media URL from the backend into a full URL.
 * @param {string} url - The URL or path to resolve.
 * @returns {string} - The full resolved URL.
 */
export function resolveBackendUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('data:') || url.startsWith('blob:')) return url

  const apiBase = API_CONFIG.BASE_URL || ''
  let origin = ''

  if (apiBase.startsWith('http')) {
    try {
      const urlObj = new URL(apiBase)
      origin = urlObj.origin
    } catch (e) {
      origin = apiBase.split('/api')[0]
    }
  } else if (typeof window !== 'undefined') {
    origin = window.location.origin
  }

  const normalizedPath = String(url).startsWith('/') ? String(url) : `/${url}`
  return `${origin}${normalizedPath}`
}
