const DEFAULT_DEV_API_BASE = 'http://localhost:5000/api'
const DEFAULT_PRODUCTION_API_BASE = 'https://ilma-backend-seven.vercel.app/api'
const DEFAULT_ACCEPT_HEADERS = {
  Accept: 'application/json',
} as const

let accessToken: string | null = null

type ApiRequestInit = RequestInit & {
  json?: unknown
  authRetry?: boolean
}

type AuthTokenResponse = {
  accessToken?: string
}

type AuthErrorResponse = {
  code?: string
  message?: string
}

const REFRESH_SESSION_ERROR_CODES = new Set([
  'REFRESH_MISSING',
  'REFRESH_INVALID',
  'REFRESH_MISMATCH',
  'REFRESH_PASSWORD_CHANGED',
  'REFRESH_EXPIRED',
  'REFRESH_SESSION_EXPIRED',
])

let lastAuthFailureCode: string | null = null

export function setAccessToken(nextToken: string | null) {
  accessToken = nextToken && nextToken.trim() ? nextToken : null
}

export function clearAccessToken() {
  accessToken = null
}

export function getAccessToken() {
  return accessToken
}

export function setLastAuthFailureCode(code: string | null) {
  lastAuthFailureCode = code && code.trim() ? code : null
}

export function consumeLastAuthFailureCode() {
  const code = lastAuthFailureCode
  lastAuthFailureCode = null
  return code
}

export function getApiBaseUrl() {
  const localApiBase = (import.meta.env.VITE_LOCAL_API_BASE_URL as string | undefined) ?? DEFAULT_DEV_API_BASE
  const configuredBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (import.meta.env.VITE_PRODUCTION_API_BASE_URL as string | undefined)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'

  if (isLocalHost) {
    return localApiBase.replace(/\/$/, '')
  }

  if (configuredBase && configuredBase.trim()) {
    return configuredBase.replace(/\/$/, '')
  }

  return DEFAULT_PRODUCTION_API_BASE
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

  const authError = data as AuthErrorResponse

  if (response.status === 401 && REFRESH_SESSION_ERROR_CODES.has(authError.code ?? '')) {
    setLastAuthFailureCode(authError.code ?? null)
  }

  clearAccessToken()
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
