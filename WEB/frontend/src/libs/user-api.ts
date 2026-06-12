import { apiGet, apiRequest } from '../utils/api'
import type { AuthUser } from '../utils/route-utils'
import type { RoadmapTemplate, UserRoadmap } from './roadmaps-api'

export type DashboardRoadmap = UserRoadmap & {
  template?: RoadmapTemplate
  timeSpentMinutes?: number
  completedSteps?: number
}

export type DashboardCourse = {
  _id: string
  status?: 'notStarted' | 'inProgress' | 'completed' | 'abandoned'
  progressPercent?: number
  watchedMinutes?: number
  lastAccessedAt?: string | number
  course?: {
    _id: string
    title: string
    slug: string
    level?: string
    category?: string
    durationMinutes?: number
    thumbnailUrl?: string
  }
}

export type DashboardActivity = {
  _id: string
  type:
    | 'course_view'
    | 'course_search'
    | 'course_bookmark'
    | 'course_enroll'
    | 'course_complete'
    | 'login'
    | 'lesson_complete'
    | 'roadmap_start'
    | 'roadmap_step_complete'
    | 'roadmap_complete'
    | 'ai_roadmap_draft'
    | 'ai_roadmap_save'
    | 'ai_topic_explain'
    | 'rating'
    | 'quiz_attempt'
  metadata?: Record<string, unknown>
  occurredAt?: string | number
  createdAt?: string | number
  course?: {
    _id: string
    title?: string
    slug?: string
  }
  roadmap?: {
    _id: string
    progressPercent?: number
    template?: {
      title?: string
      slug?: string
      tags?: string[]
    }
  }
}

export type DashboardSummary = {
  user: AuthUser
  streak: NonNullable<AuthUser['loginStreak']>
  totals: {
    roadmaps: number
    activeRoadmaps: number
    completedRoadmaps: number
    courses: number
    activeCourses: number
    completedCourses: number
    totalRoadmapMinutes: number
    totalCourseMinutes: number
    totalLearningMinutes: number
    averageRoadmapProgress: number
    totalCompletedSteps: number
  }
  roadmaps: DashboardRoadmap[]
  courses: DashboardCourse[]
  activities: DashboardActivity[]
}

export type AiRecommendationCourse = {
  type: 'course'
  matchScore: number
  reason: string
  nextAction: string
  course: {
    _id: string
    title: string
    slug?: string
    shortDescription?: string
    level?: string
    category?: string
    tags?: string[]
    thumbnailUrl?: string
    durationMinutes?: number
  }
}

export type AiRecommendationRoadmap = {
  type: 'roadmap'
  matchScore: number
  reason: string
  nextAction: string
  roadmap: {
    _id: string
    title?: string
    slug?: string
    goal?: string
    description?: string
    targetLevel?: string
    templateType?: string
    tags?: string[]
    estimatedTotalMinutes?: number
  }
}

export type AiRecommendationNextStep = {
  type: 'roadmap_step'
  matchScore: number
  reason: string
  nextAction: string
  roadmap: {
    _id?: string
    title?: string
    slug?: string
    progressPercent?: number
  }
  step: {
    stepKey: string
    title?: string
    description?: string
    estimatedMinutes?: number
    course?: string | null
  }
}

export type AiRecommendationsData = {
  engine: string
  generatedAt: string
  profile?: {
    preferredLevel?: string
    learningPace?: string
    weeklyStudyHours?: number
    interests?: string[]
    source?: string
  }
  recommendations: {
    nextSteps: AiRecommendationNextStep[]
    courses: AiRecommendationCourse[]
    roadmaps: AiRecommendationRoadmap[]
  }
}

type DashboardSummaryResponse = {
  success?: boolean
  data?: DashboardSummary
}

type AiRecommendationsResponse = {
  success?: boolean
  data?: AiRecommendationsData
}

type ProfileUpdateInput = {
  username: string
  Fname: string
  Lname: string
}

type PasswordUpdateInput = {
  currentPassword: string
  newPassword: string
}

type AvatarUpdateInput = {
  avatarImage: string
}

type UserMutationResponse = {
  success?: boolean
  message?: string
  user?: AuthUser
  data?: unknown
  errors?: Array<{ field?: string; message?: string }>
}

const emptyDashboardSummaryResponse: DashboardSummaryResponse = {}
const emptyAiRecommendationsResponse: AiRecommendationsResponse = {}
const emptyMutationResponse: UserMutationResponse = {}

function firstApiError(data: UserMutationResponse, fallback: string) {
  return data.errors?.find((error) => error.message)?.message ?? data.message ?? fallback
}

export async function fetchDashboardSummary() {
  const { response, data } = await apiGet<DashboardSummaryResponse>(
    '/auth/dashboard-summary',
    emptyDashboardSummaryResponse,
  )

  if (!response.ok || !data.data) {
    throw new Error('Could not load dashboard summary.')
  }

  return data.data
}

export async function fetchAiRecommendations(limit = 6) {
  const { response, data } = await apiGet<AiRecommendationsResponse>(
    `/ai/recommendations?limit=${limit}`,
    emptyAiRecommendationsResponse,
  )

  if (!response.ok || !data.data) {
    throw new Error('Could not load AI recommendations.')
  }

  return data.data
}

export async function deleteDashboardActivity(activityId: string) {
  const { response, data } = await apiRequest<UserMutationResponse>(
    `/auth/activities/${activityId}`,
    emptyMutationResponse,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    throw new Error(firstApiError(data, 'Could not delete activity.'))
  }

  return true
}

export async function updateCurrentUserProfile(input: ProfileUpdateInput) {
  const { response, data } = await apiRequest<UserMutationResponse>(
    '/auth/profile',
    emptyMutationResponse,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )

  if (!response.ok || !data.user) {
    throw new Error(firstApiError(data, 'Could not update profile.'))
  }

  return data.user
}

export async function updateCurrentUserPassword(input: PasswordUpdateInput) {
  const { response, data } = await apiRequest<UserMutationResponse>(
    '/auth/password',
    emptyMutationResponse,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    throw new Error(firstApiError(data, 'Could not update password.'))
  }

  return true
}

export async function updateCurrentUserAvatar(input: AvatarUpdateInput) {
  const { response, data } = await apiRequest<UserMutationResponse>(
    '/auth/profile/avatar',
    emptyMutationResponse,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )

  if (!response.ok || !data.user) {
    throw new Error(firstApiError(data, 'Could not update avatar.'))
  }

  return data.user
}
