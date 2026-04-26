const DEFAULT_OPTIONS = {
  path: '/',
  sameSite: 'Lax'
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie ? document.cookie.split('; ') : []
  const match = cookies.find(cookie => cookie.startsWith(`${name}=`))

  if (!match) return null

  return decodeURIComponent(match.substring(name.length + 1))
}

export function setCookie(name, value, options = {}) {
  if (typeof document === 'undefined') return

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  let cookie = `${name}=${encodeURIComponent(value ?? '')}`

  if (mergedOptions.expires instanceof Date) {
    cookie += `; expires=${mergedOptions.expires.toUTCString()}`
  } else if (typeof mergedOptions.maxAge === 'number') {
    cookie += `; max-age=${mergedOptions.maxAge}`
  }

  cookie += `; path=${mergedOptions.path}`
  cookie += `; samesite=${mergedOptions.sameSite}`

  if (mergedOptions.secure) {
    cookie += '; secure'
  }

  document.cookie = cookie
}

export function deleteCookie(name, options = {}) {
  setCookie(name, '', {
    ...options,
    maxAge: 0
  })
}

