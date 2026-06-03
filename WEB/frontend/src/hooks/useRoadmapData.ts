import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  assignRoadmap,
  fetchRoadmapProgress,
  fetchRoadmapTemplateBySlug,
  fetchUserRoadmaps,
  updateRoadmapStepStatus,
} from '../libs/roadmaps-api'
import { authQueryKey, fetchCurrentUser } from '../libs/react-query'
import type { StepStatus } from '../types/roadmap'

export function useAuthQuery() {
  return useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
  })
}

export function useRoadmapTemplate(slug: string) {
  return useQuery({
    queryKey: ['roadmaps', 'template', slug],
    queryFn: () => fetchRoadmapTemplateBySlug(slug),
    staleTime: 60_000,
  })
}

export function useUserRoadmaps(enabled: boolean) {
  return useQuery({
    queryKey: ['roadmaps', 'mine'],
    queryFn: fetchUserRoadmaps,
    enabled,
    staleTime: 20_000,
  })
}

export function useRoadmapProgress(roadmapId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['roadmaps', 'progress', roadmapId],
    queryFn: () => fetchRoadmapProgress(roadmapId ?? ''),
    enabled: Boolean(enabled && roadmapId),
    staleTime: 10_000,
  })
}

export function useUpdateStepStatus(options: {
  templateId: string | undefined
  enrolledRoadmapId: string | undefined
  isAuthenticated: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const assignMutation = useMutation({
    mutationFn: assignRoadmap,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ stepKey, status }: { stepKey: string; status: StepStatus }) => {
      if (!options.isAuthenticated) throw new Error('login-required')
      if (!options.templateId) throw new Error('missing-template')

      let roadmapId = options.enrolledRoadmapId
      if (!roadmapId) {
        const roadmap = await assignMutation.mutateAsync(options.templateId)
        roadmapId = roadmap._id
      }
      return updateRoadmapStepStatus(roadmapId, stepKey, status)
    },
    onSuccess: async () => {
      toast.success(t('roadmapDetail.progressSaved'))
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'progress'] })
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'login-required') {
        toast.error(t('roadmapDetail.loginRequired'))
        return
      }
      toast.error(t('roadmapDetail.progressFailed'))
    },
  })

  return {
    updateMutation,
    isPending: updateMutation.isPending || assignMutation.isPending,
  }
}
