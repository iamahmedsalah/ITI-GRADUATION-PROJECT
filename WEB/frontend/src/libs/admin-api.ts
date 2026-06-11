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
    online?: number
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
  contactMessages?: {
    total: number
    unread: number
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
  stepProgressRecords?: number
  totalStepProgressRecords?: number
  createdAt?: string
}

export type AdminRoadmapStep = {
  stepKey: string
  title: string
  description?: string
  order?: number
  dependsOn?: string[]
  resources?: { title?: string; url?: string }[]
}

export type AdminRoadmapDetail = AdminRoadmapRow & {
  steps?: AdminRoadmapStep[]
  createdBy?: { username?: string; email?: string; role?: string } | null
}

export type AdminAiRoadmapDraft = {
  engine: string
  generatedAt: string
  draft: {
    title: string
    slug: string
    goal: string
    description?: string
    targetRole?: 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
    targetLevel?: 'beginner' | 'intermediate' | 'advanced'
    templateType?: 'roleBased' | 'skillBased'
    tags?: string[]
    source: 'ai'
    contentFormat: 'markdown'
    contentMarkdown: string
    steps?: Array<{
      stepKey: string
      title: string
      description?: string
      resources?: Array<{ title?: string; url?: string }>
      order: number
      estimatedMinutes?: number
      required?: boolean
      dependsOn?: string[]
    }>
    estimatedTotalMinutes?: number
  }
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
  sections?: Array<{
    sectionKey?: string
    title?: string
    description?: string
    order?: number
    lessons?: Array<{
      lessonKey?: string
      title?: string
      summary?: string
      durationMinutes?: number
      videoUrl?: string
      resourceUrl?: string
      isPreview?: boolean
      order?: number
    }>
  }>
  tags?: string[]
  prerequisites?: string[]
  learningOutcomes?: string[]
  thumbnailUrl?: string
  bannerUrl?: string
  durationMinutes?: number
  stats?: {
    enrollmentsCount?: number
    completionRate?: number
    averageRating?: number
  }
  createdAt?: string
  updatedAt?: string
}

export type AdminContactReply = {
  admin?: {
    username?: string
    email?: string
  } | null
  message: string
  messageId?: string
  sentAt?: string
}

export type AdminContactMessageRow = {
  _id: string
  name: string
  email: string
  message: string
  status: 'unread' | 'read' | 'replied'
  replies?: AdminContactReply[]
  createdAt?: string
  updatedAt?: string
  readAt?: string | null
  lastRepliedAt?: string | null
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

export async function fetchAdminRoadmapDetail(templateId: string) {
  const { response, data } = await apiGet<AdminListResponse<AdminRoadmapDetail>>(
    `/admin/roadmaps/${templateId}`,
    { data: undefined },
  )

  if (!response.ok || !data.data) {
    return null
  }

  return data.data
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
  steps?: Array<{
    stepKey: string
    title: string
    description?: string
    resources?: Array<{ title?: string; url?: string }>
    order: number
    estimatedMinutes?: number
    required?: boolean
    dependsOn?: string[]
  }>
  source?: 'admin' | 'ai' | 'manual'
  estimatedTotalMinutes?: number
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

export async function generateAdminRoadmapDraft(payload: {
  goal: string
  targetRole?: 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
  targetLevel?: 'beginner' | 'intermediate' | 'advanced'
  templateType?: 'roleBased' | 'skillBased'
  durationWeeks?: number
  weeklyStudyHours?: number
}) {
  const { response, data } = await apiPost<AdminMutationResponse<AdminAiRoadmapDraft>>(
    '/ai/roadmaps/draft',
    {},
    { json: payload },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'AI roadmap draft generated successfully.' : 'Failed to generate AI roadmap draft.'),
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
  thumbnailUrl?: string | null
  bannerUrl?: string | null
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
    thumbnailUrl: string | null
    bannerUrl: string | null
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

export async function fetchAdminCourseDetail(courseId: string) {
  const { response, data } = await apiGet<AdminListResponse<AdminCourseRow>>(
    `/admin/courses/${courseId}`,
    { data: undefined },
  )

  if (!response.ok || !data.data) {
    return null
  }

  return data.data
}

export async function fetchAdminContactMessages(params: {
  q?: string
  status?: string
  page?: number
  limit?: number
}) {
  const { response, data } = await apiGet<AdminListResponse<AdminContactMessageRow[]>>(
    `/admin/contact-messages${toQueryString(params)}`,
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

export async function replyToAdminContactMessage(contactMessageId: string, reply: string) {
  const { response, data } = await apiPost<AdminMutationResponse<AdminContactMessageRow>>(
    `/admin/contact-messages/${contactMessageId}/reply`,
    {},
    { json: { reply } },
  )

  return {
    ok: response.ok,
    message: data.message ?? (response.ok ? 'Contact reply sent successfully.' : 'Failed to reply to contact message.'),
    data: data.data ?? null,
  }
}
