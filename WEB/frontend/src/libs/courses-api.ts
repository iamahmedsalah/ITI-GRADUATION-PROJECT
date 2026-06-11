import { apiGet } from '../utils/api'

export type PublicCourse = {
  _id: string
  title: string
  slug: string
  description?: string
  shortDescription?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  category?: string
  thumbnailUrl?: string
  durationMinutes?: number
  tags?: string[]
  isFeatured?: boolean
  stats?: {
    enrollmentsCount?: number
    completionRate?: number
    averageRating?: number
  }
}

type PublishedCoursesResponse = {
  success?: boolean
  data?: PublicCourse[]
}

export async function fetchPublishedCourses(limit = 6) {
  const { response, data } = await apiGet<PublishedCoursesResponse>(
    `/courses/published?limit=${limit}`,
    { data: [] },
    { authRetry: false },
  )

  if (!response.ok) {
    return []
  }

  return data.data ?? []
}
