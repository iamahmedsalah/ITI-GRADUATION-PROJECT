import { QueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, clearAccessToken } from '../utils/api'
import type { AuthUser } from '../utils/route-utils'

export const authQueryKey = ['auth', 'me'] as const
export const adminAuthQueryKey = ['auth', 'admin-me'] as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
})

type AuthCheckResponse = {
  authenticated?: boolean
  user?: AuthUser
}

export async function fetchCurrentUser() {
  const { response, data } = await apiGet<AuthCheckResponse>('/auth/check-auth', {}, { cache: 'no-store' })

  if (!response.ok || !data.authenticated || !data.user) {
    return null
  }

  return data.user
}

export async function fetchAdminCurrentUser() {
  const { response, data } = await apiGet<{ authenticated?: boolean; user?: AuthUser }>('/admin/auth/check-auth', {}, { cache: 'no-store' })

  if (!response.ok || !data.authenticated || !data.user) {
    return null
  }

  return data.user
}

export async function logoutCurrentUser() {
  const { response } = await apiPost('/auth/logout', {}, { authRetry: false })

  if (!response.ok) {
    throw new Error('Logout failed')
  }

  clearAccessToken()
  return true
}

export async function logoutAdminUser() {
  const { response } = await apiPost('/admin/auth/logout', {}, { authRetry: false })

  if (!response.ok) {
    throw new Error('Admin logout failed')
  }

  clearAccessToken()
  return true
}
