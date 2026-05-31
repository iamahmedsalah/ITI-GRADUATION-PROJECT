import { toast } from 'sonner'
import i18n from '../libs/i18n'

const DEFAULT_DEV_API_BASE = 'http://localhost:5000/api'
const DEFAULT_ACCEPT_HEADERS = {
  Accept: 'application/json',
} as const

let accessToken: string | null = null
let sessionExpiredNotified = false

type ApiRequestInit = RequestInit & {
  json?: unknown
  authRetry?: boolean
}

type AuthTokenResponse = {
  accessToken?: string
}

export function setAccessToken(nextToken: string | null) {
  accessToken = nextToken && nextToken.trim() ? nextToken : null

  if (accessToken) {
    sessionExpiredNotified = false
  }
}

export function clearAccessToken() {
  accessToken = null
}

export function getAccessToken() {
  return accessToken
}

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

export async function readJsonSafe<T>(response: Response, fallback: T): Promise<T> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  const rawBody = await response.text().catch(() => '')

  if (!rawBody) {
    return fallback
  }

  const trimmedBody = rawBody.trim()
  const looksLikeJson = trimmedBody.startsWith('{') || trimmedBody.startsWith('[')
  const isJsonResponse = contentType.includes('application/json')

  if (!isJsonResponse && !looksLikeJson) {
    return fallback
  }

  try {
    return JSON.parse(trimmedBody) as T
  } catch {
    return fallback
  }
}

export type ApiResult<T> = {
  response: Response
  data: T
}

function mergeHeaders(base?: HeadersInit, override?: HeadersInit) {
  const merged = new Headers(base)

  if (override) {
    const extra = new Headers(override)
    extra.forEach((value, key) => {
      merged.set(key, value)
    })
  }

  return merged
}

function attachAccessToken(headers: Headers) {
  if (accessToken && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${accessToken}`)
  }
}

function notifySessionExpired() {
  if (sessionExpiredNotified) {
    return
  }

  sessionExpiredNotified = true
  toast.error(i18n.t('auth.sessionExpired'))
}

async function refreshAccessToken() {
  const response = await fetch(buildApiUrl('/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: mergeHeaders(DEFAULT_ACCEPT_HEADERS),
  })

  const data = await readJsonSafe<AuthTokenResponse>(response, {})

  if (response.ok && typeof data.accessToken === 'string' && data.accessToken.trim()) {
    setAccessToken(data.accessToken)
    return true
  }

  clearAccessToken()
  notifySessionExpired()
  return false
}

export async function apiRequest<T>(
  pathname: string,
  fallback: T,
  init: ApiRequestInit = {},
): Promise<ApiResult<T>> {
  const { authRetry = true, ...requestInit } = init
  const headers = mergeHeaders(DEFAULT_ACCEPT_HEADERS, requestInit.headers)
  attachAccessToken(headers)

  const response = await fetch(buildApiUrl(pathname), {
    credentials: 'include',
    ...requestInit,
    headers,
  })

  const data = await readJsonSafe<T>(response, fallback)

  if (response.ok && data && typeof data === 'object') {
    const token = (data as AuthTokenResponse).accessToken

    if (typeof token === 'string' && token.trim()) {
      setAccessToken(token)
    }
  }

  if (authRetry && response.status === 401 && pathname !== '/auth/refresh') {
    const refreshed = await refreshAccessToken()

    if (refreshed) {
      const retryHeaders = mergeHeaders(DEFAULT_ACCEPT_HEADERS, requestInit.headers)
      attachAccessToken(retryHeaders)

      const retryResponse = await fetch(buildApiUrl(pathname), {
        credentials: 'include',
        ...requestInit,
        headers: retryHeaders,
      })

      const retryData = await readJsonSafe<T>(retryResponse, fallback)

      if (retryResponse.ok && retryData && typeof retryData === 'object') {
        const token = (retryData as AuthTokenResponse).accessToken

        if (typeof token === 'string' && token.trim()) {
          setAccessToken(token)
        }
      }

      if (retryResponse.status === 401) {
        clearAccessToken()
      }

      return { response: retryResponse, data: retryData }
    }

    clearAccessToken()
    notifySessionExpired()
  }

  if (response.status === 401 && pathname !== '/auth/refresh') {
    clearAccessToken()
  }

  return { response, data }
}

export function apiGet<T>(pathname: string, fallback: T, init: ApiRequestInit = {}) {
  return apiRequest(pathname, fallback, {
    ...init,
    method: init.method ?? 'GET',
  })
}

export function apiPost<T>(
  pathname: string,
  fallback: T,
  init: Omit<ApiRequestInit, 'method' | 'body'> = {},
) {
  const { json, headers, ...rest } = init
  const hasJsonBody = typeof json !== 'undefined'

  return apiRequest(pathname, fallback, {
    ...rest,
    method: 'POST',
    headers: hasJsonBody ? mergeHeaders({ 'Content-Type': 'application/json' }, headers) : headers,
    body: hasJsonBody ? JSON.stringify(json) : undefined,
  })
}
