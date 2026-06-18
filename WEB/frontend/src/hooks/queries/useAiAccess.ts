import { useQuery } from '@tanstack/react-query'
import { fetchAiFeatureAccess } from '../../libs/ai-api'

export const aiAccessQueryKey = ['ai', 'access'] as const

export function useAiFeatureAccess(enabled = true) {
  return useQuery({
    queryKey: aiAccessQueryKey,
    queryFn: fetchAiFeatureAccess,
    staleTime: 30_000,
    enabled,
  })
}
