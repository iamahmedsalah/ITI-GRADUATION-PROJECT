import { useQuery } from '@tanstack/react-query'
import {
  adminAuthQueryKey,
  authQueryKey,
  fetchAdminCurrentUser,
  fetchCurrentUser,
} from '../../libs/react-query'

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 0,
  })
}

export function useAdminUser() {
  return useQuery({
    queryKey: adminAuthQueryKey,
    queryFn: fetchAdminCurrentUser,
    staleTime: 0,
  })
}
