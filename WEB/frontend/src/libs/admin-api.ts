import { apiGet, apiPost, apiRequest } from '../utils/api'

export type AdminOverviewBlock = {
  total: number
  active?: number
  inactive?: number
  verified?: number
  published?: number
  featured?: number
  totalStepProgressRecords?: number
  templatesTotal?: number
  templatesActive?: number
  assignmentsTotal?: number
  assignmentsCompleted?: number
  assignmentsInProgress?: number
  enrollmentsTotal?: number
  enrollmentsCompleted?: number
  byRole?: Record<string, number>
}

export type AdminOverviewData = {
  users: {
    total: number
    active: number
    inactive: number
    verified: number
    byRole: Record<string, number>
  }
  roadmaps: {
    templatesTotal: number
    templatesActive: number
    assignmentsTotal: number
    assignmentsCompleted: number
    assignmentsInProgress: number
  }
  courses: {
    total: number
    published: number
    featured: number
    enrollmentsTotal: number
    enrollmentsCompleted: number
  }
}

export type AdminPagination = {
  total: number
  page: number
  limit: number
  pages: number
}

export type AdminUserRow = {
  _id: string
  username: string
  Fname: string
  Lname: string
  email: string
  role: string
  isVerified: boolean
  isActive: boolean
  lastLogin?: string | number | null
  deactivatedAt?: string | null
  deactivationReason?: string | null
}

export type AdminRoadmapRow = {
  _id: string
  title: string
  slug: string
  goal?: string
  description?: string
  targetRole?: string
  targetLevel?: string
  templateType?: 'roleBased' | 'skillBased'
  isActive: boolean
  assignedUsers?: number
  createdAt?: string
}

export type AdminCourseRow = {
  _id: string
  title: string
  slug: string
  description?: string
  shortDescription?: string
  level?: string
  category?: string
  isPublished: boolean
  isFeatured: boolean
  instructor?: {
    username?: string
    email?: string
    role?: string
  } | null
  roadmapTemplate?: {
    title?: string
    slug?: string
  } | null
}

type AdminListResponse<T> = {
  success?: boolean
  message?: string
  data?: T
  pagination?: AdminPagination
}

type AdminMutationResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

type AdminQuery = Record<string, string | number | boolean | undefined>

function toQueryString(params: AdminQuery) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function fetchAdminOverview() {
  const { response, data } = await apiGet<AdminListResponse<AdminOverviewData>>('/admin/overview', {
    data: undefined,
  } as never)

  if (!response.ok || !data?.data) {
    return null
  }

  return data.data
}

export async function fetchAdminUsers(params: {
  q?: string
  role?: string
  isVerified?: string
  isActive?: string
  page?: number
  limit?: number
}) {
  const { response, data } = await apiGet<AdminListResponse<AdminUserRow[]>>(
    `/admin/users${toQueryString(params)}`,
    { data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } },
  )

  if (!response.ok) {
    return null
  }

  return {
    data: data.data ?? [],
    pagination: data.pagination ?? { total: 0, page: 1, limit: 20, pages: 0 },
  }
}

export async function updateAdminUser(
  userId: string,
  payload: Partial<{
    role: 'student' | 'instructor' | 'admin'
    isVerified: boolean
    isActive: boolean
    deactivationReason: string
  }>,
) {
  const { response, data } = await apiRequest<AdminMutationResponse<AdminUserRow>>(
    `/admin/users/${userId}`,
    {},
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'User updated successfully.' : 'Failed to update user.'),
    data: data.data ?? null,
  }
}

export async function fetchAdminRoadmaps(params: {
  q?: string
  targetRole?: string
  targetLevel?: string
  templateType?: string
  isActive?: string
  page?: number
  limit?: number
}) {
  const { response, data } = await apiGet<AdminListResponse<AdminRoadmapRow[]>>(
    `/admin/roadmaps${toQueryString(params)}`,
    { data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } },
  )

  if (!response.ok) {
    return null
  }

  return {
    data: data.data ?? [],
    pagination: data.pagination ?? { total: 0, page: 1, limit: 20, pages: 0 },
  }
}

export async function createAdminRoadmap(payload: {
  title: string
  slug: string
  goal: string
  description?: string
  targetRole?: 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
  targetLevel?: 'beginner' | 'intermediate' | 'advanced'
  templateType?: 'roleBased' | 'skillBased'
  tags?: string[]
  contentFormat: 'markdown'
  contentMarkdown: string
}) {
  const { response, data } = await apiPost<AdminMutationResponse<AdminRoadmapRow>>(
    '/admin/roadmaps/templates',
    {},
    { json: payload },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Roadmap created successfully.' : 'Failed to create roadmap.'),
    data: data.data ?? null,
  }
}

export async function updateAdminRoadmap(
  templateId: string,
  payload: Partial<{
    title: string
    slug: string
    goal: string
    description: string
    targetRole: 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
    targetLevel: 'beginner' | 'intermediate' | 'advanced'
    templateType: 'roleBased' | 'skillBased'
    isActive: boolean
  }>,
) {
  const { response, data } = await apiRequest<AdminMutationResponse<AdminRoadmapRow>>(
    `/admin/roadmaps/${templateId}`,
    {},
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Roadmap updated successfully.' : 'Failed to update roadmap.'),
    data: data.data ?? null,
  }
}

export async function toggleAdminRoadmapPublish(templateId: string, makeActive: boolean) {
  const path = makeActive
    ? `/admin/roadmaps/${templateId}/publish`
    : `/admin/roadmaps/${templateId}/unpublish`

  const { response, data } = await apiPost<AdminMutationResponse<AdminRoadmapRow>>(
    path,
    {},
    { json: {} },
  )

  return {
    ok: response.ok,
    message:
      data.message ??
      (response.ok
        ? makeActive
          ? 'Roadmap published successfully.'
          : 'Roadmap unpublished successfully.'
        : 'Failed to update roadmap publish state.'),
    data: data.data ?? null,
  }
}

export async function deleteAdminRoadmap(templateId: string) {
  const { response, data } = await apiRequest<AdminMutationResponse<AdminRoadmapRow>>(
    `/admin/roadmaps/${templateId}`,
    {},
    {
      method: 'DELETE',
    },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Roadmap deleted successfully.' : 'Failed to delete roadmap.'),
    data: data.data ?? null,
  }
}

export async function fetchAdminCourses(params: {
  q?: string
  level?: string
  isPublished?: string
  isFeatured?: string
  page?: number
  limit?: number
}) {
  const { response, data } = await apiGet<AdminListResponse<AdminCourseRow[]>>(
    `/admin/courses${toQueryString(params)}`,
    { data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } },
  )

  if (!response.ok) {
    return null
  }

  return {
    data: data.data ?? [],
    pagination: data.pagination ?? { total: 0, page: 1, limit: 20, pages: 0 },
  }
}

export async function createAdminCourse(payload: {
  title: string
  slug: string
  description: string
  shortDescription?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  category?: string
  isPublished?: boolean
  isFeatured?: boolean
}) {
  const { response, data } = await apiPost<AdminMutationResponse<AdminCourseRow>>(
    '/admin/courses',
    {},
    { json: payload },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Course created successfully.' : 'Failed to create course.'),
    data: data.data ?? null,
  }
}

export async function updateAdminCourse(
  courseId: string,
  payload: Partial<{
    title: string
    slug: string
    description: string
    shortDescription: string
    level: 'beginner' | 'intermediate' | 'advanced'
    category: string
    isPublished: boolean
    isFeatured: boolean
  }>,
) {
  const { response, data } = await apiRequest<AdminMutationResponse<AdminCourseRow>>(
    `/admin/courses/${courseId}`,
    {},
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Course updated successfully.' : 'Failed to update course.'),
    data: data.data ?? null,
  }
}

export async function deleteAdminCourse(courseId: string) {
  const { response, data } = await apiRequest<AdminMutationResponse<AdminCourseRow>>(
    `/admin/courses/${courseId}`,
    {},
    {
      method: 'DELETE',
    },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Course deleted successfully.' : 'Failed to delete course.'),
    data: data.data ?? null,
  }
}
