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

export type PublicCourseLesson = {
  lessonKey: string
  title: string
  summary?: string
  durationMinutes?: number
  videoUrl?: string
  resourceUrl?: string
  isPreview?: boolean
  order?: number
}

export type PublicCourseSection = {
  sectionKey: string
  title: string
  description?: string
  order?: number
  lessons?: PublicCourseLesson[]
}

export type PublicCourseDetail = PublicCourse & {
  bannerUrl?: string
  sections?: PublicCourseSection[]
  prerequisites?: string[]
  learningOutcomes?: string[]
  createdAt?: string
  updatedAt?: string
}

type PublishedCoursesResponse = {
  success?: boolean
  data?: PublicCourse[]
}

type PublishedCourseDetailResponse = {
  success?: boolean
  message?: string
  data?: PublicCourseDetail
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

export async function fetchPublishedCourseBySlug(slug: string) {
  const { response, data } = await apiGet<PublishedCourseDetailResponse>(
    `/courses/published/${encodeURIComponent(slug)}`,
    {},
    { authRetry: false },
  )

  if (!response.ok || !data.data) {
    throw new Error(data.message || 'Course not found.')
  }

  return data.data
}
