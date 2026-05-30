const DEFAULT_DEV_API_BASE = 'http://localhost:5000/api'

export function getApiBaseUrl() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL as string | undefined

  if (configuredBase && configuredBase.trim()) {
    return configuredBase.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return DEFAULT_DEV_API_BASE
  }

  return '/api'
}

export function buildApiUrl(pathname: string) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getApiBaseUrl()}${normalizedPath}`
}
