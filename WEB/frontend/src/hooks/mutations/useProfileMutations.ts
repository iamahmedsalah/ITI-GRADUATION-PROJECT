import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateCurrentUserAvatar,
  updateCurrentUserPassword,
  updateCurrentUserPreferences,
  updateCurrentUserProfile,
} from '../../libs/user-api'
import { authQueryKey } from '../../libs/react-query'
import { preferencesQueryKey } from '../queries/usePreferences'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: async (user) => {
      queryClient.setQueryData(authQueryKey, user)
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCurrentUserAvatar,
    onSuccess: async (user) => {
      queryClient.setQueryData(authQueryKey, user)
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: updateCurrentUserPassword,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCurrentUserPreferences,
    onSuccess: async (payload) => {
      if (payload.user) {
        queryClient.setQueryData(authQueryKey, payload.user)
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authQueryKey }),
        queryClient.invalidateQueries({ queryKey: preferencesQueryKey }),
      ])
    },
  })
}
