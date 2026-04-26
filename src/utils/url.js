import { API_CONFIG } from '@/constants'

/**
 * Resolves a media URL to a full, absolute URL.
 * - If the URL is already absolute, it's returned as is.
 * - If the URL is relative, it's combined with the API base URL.
 *
 * @param {string | null | undefined} url The URL to resolve.
 * @returns {string} The resolved, absolute URL, or an empty string if the input is invalid.
 */
export function resolveMediaUrl(url) {
  if (!url) {
    return ''
  }
  // If the URL is already absolute, return it directly.
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  // Normalize the path to ensure it starts with a slash.
  const normalizedPath = String(url).startsWith('/') ? url : `/${url}`

  // Get the API base URL from the configuration.
  const apiBase = API_CONFIG.BASE_URL || ''

  // If the API base URL is an absolute URL, use its origin.
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      const origin = new URL(apiBase).origin
      return `${origin}${normalizedPath}`
    } catch (e) {
      // Fallback if the URL is malformed.
    }
  }

  // Fallback for relative base URLs or in a server-side rendering context.
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`
  }

  return normalizedPath
}
