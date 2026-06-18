import { useQuery } from '@tanstack/react-query'
import { fetchAiRecommendations } from '../../libs/user-api'

export const aiRecommendationsQueryKey = (limit = 6) =>
  ['ai', 'recommendations', limit] as const

export function useAiRecommendations(limit = 6, enabled = true) {
  return useQuery({
    queryKey: aiRecommendationsQueryKey(limit),
    queryFn: () => fetchAiRecommendations(limit),
    enabled,
  })
}
