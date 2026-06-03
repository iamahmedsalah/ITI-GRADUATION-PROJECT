import { useQuery } from '@tanstack/react-query'
import { fetchUserRoadmaps } from '../libs/roadmaps-api'

export function useUserRoadmapProgress() {
  return useQuery({
    queryKey: ['roadmaps', 'mine'],
    queryFn: fetchUserRoadmaps,
  })
}
