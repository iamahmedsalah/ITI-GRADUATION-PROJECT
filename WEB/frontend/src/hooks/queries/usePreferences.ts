import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUserPreferences } from '../../libs/user-api'

export const preferencesQueryKey = ['preferences'] as const

export function useCurrentUserPreferences(enabled = true) {
  return useQuery({
    queryKey: preferencesQueryKey,
    queryFn: fetchCurrentUserPreferences,
    enabled,
  })
}
