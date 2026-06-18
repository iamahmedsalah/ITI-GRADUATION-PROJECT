import { useQuery } from '@tanstack/react-query'
import {
  fetchRoadmapProgress,
  fetchRoadmapTemplateBySlug,
  fetchRoadmapTemplates,
  fetchUserRoadmaps,
  searchRoadmaps,
  type RoadmapTemplate,
} from '../../libs/roadmaps-api'

export const roadmapTemplatesQueryKey = (
  limit = 18,
  templateType?: RoadmapTemplate['templateType'],
) => ['roadmaps', 'templates', { limit, templateType }] as const
export const roadmapSearchQueryKey = (
  query: string,
  limit = 18,
  templateType?: RoadmapTemplate['templateType'],
) => ['roadmaps', 'search', { query, limit, templateType }] as const
export const roadmapTemplateBySlugQueryKey = (slug: string) =>
  ['roadmaps', 'templates', 'slug', slug] as const
export const myRoadmapsQueryKey = ['roadmaps', 'my'] as const
export const roadmapProgressQueryKey = (roadmapId: string) =>
  ['roadmaps', 'progress', roadmapId] as const

export function useRoadmapTemplates(
  limit = 18,
  templateType?: RoadmapTemplate['templateType'],
) {
  return useQuery({
    queryKey: roadmapTemplatesQueryKey(limit, templateType),
    queryFn: () => fetchRoadmapTemplates(limit, templateType),
  })
}

export function useRoadmapSearch(
  query: string,
  limit = 18,
  templateType?: RoadmapTemplate['templateType'],
) {
  return useQuery({
    queryKey: roadmapSearchQueryKey(query, limit, templateType),
    queryFn: () => searchRoadmaps(query, limit, templateType),
  })
}

export function useRoadmapTemplateBySlug(slug: string) {
  return useQuery({
    queryKey: roadmapTemplateBySlugQueryKey(slug),
    queryFn: () => fetchRoadmapTemplateBySlug(slug),
    enabled: Boolean(slug.trim()),
  })
}

export function useMyRoadmaps(enabled = true) {
  return useQuery({
    queryKey: myRoadmapsQueryKey,
    queryFn: fetchUserRoadmaps,
    enabled,
  })
}

export function useRoadmapProgress(roadmapId: string, enabled = true) {
  return useQuery({
    queryKey: roadmapProgressQueryKey(roadmapId),
    queryFn: () => fetchRoadmapProgress(roadmapId),
    enabled: enabled && Boolean(roadmapId),
  })
}
