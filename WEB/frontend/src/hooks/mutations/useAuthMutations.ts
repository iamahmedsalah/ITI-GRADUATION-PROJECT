import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminAuthQueryKey,
  authQueryKey,
  logoutAdminUser,
  logoutCurrentUser,
} from '../../libs/react-query'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutCurrentUser,
    onSuccess: async () => {
      queryClient.setQueryData(authQueryKey, null)
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutAdminUser,
    onSuccess: async () => {
      queryClient.setQueryData(adminAuthQueryKey, null)
      await queryClient.invalidateQueries({ queryKey: adminAuthQueryKey })
    },
  })
}
