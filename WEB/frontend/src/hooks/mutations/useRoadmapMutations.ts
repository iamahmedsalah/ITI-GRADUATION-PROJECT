import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  assignRoadmap,
  deleteUserRoadmap,
  updateRoadmapStepStatus,
} from '../../libs/roadmaps-api'
import {
  myRoadmapsQueryKey,
  roadmapProgressQueryKey,
} from '../queries/useRoadmaps'

export function useAssignRoadmap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignRoadmap,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myRoadmapsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateRoadmapStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roadmapId,
      stepKey,
      status,
    }: {
      roadmapId: string
      stepKey: string
      status: Parameters<typeof updateRoadmapStepStatus>[2]
    }) => updateRoadmapStepStatus(roadmapId, stepKey, status),
    onSuccess: async (_payload, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: roadmapProgressQueryKey(variables.roadmapId),
        }),
        queryClient.invalidateQueries({ queryKey: myRoadmapsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ])
    },
  })
}

export function useDeleteUserRoadmap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUserRoadmap,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myRoadmapsQueryKey })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
