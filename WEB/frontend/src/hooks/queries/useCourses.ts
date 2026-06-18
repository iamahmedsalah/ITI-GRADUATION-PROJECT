import { useQuery } from '@tanstack/react-query'
import {
  fetchPublishedCourseBySlug,
  fetchPublishedCourses,
} from '../../libs/courses-api'

export const publishedCoursesQueryKey = (limit = 6) =>
  ['courses', 'published', limit] as const
export const publishedCourseBySlugQueryKey = (slug: string) =>
  ['courses', 'published', slug] as const

export function usePublishedCourses(limit = 6) {
  return useQuery({
    queryKey: publishedCoursesQueryKey(limit),
    queryFn: () => fetchPublishedCourses(limit),
  })
}

export function usePublishedCourse(slug: string) {
  return useQuery({
    queryKey: publishedCourseBySlugQueryKey(slug),
    queryFn: () => fetchPublishedCourseBySlug(slug),
    enabled: Boolean(slug.trim()),
  })
}
