import { apiGet, apiPost, apiRequest } from '../utils/api'

export type RoadmapTemplate = {
  _id: string
  title: string
  slug: string
  goal?: string
  description?: string
  targetRole?: string
  targetLevel?: string
  templateType?: 'roleBased' | 'skillBased'
  tags?: string[]
  estimatedTotalMinutes?: number
  steps?: Array<{
    stepKey: string
    title: string
    description?: string
    order?: number
    estimatedMinutes?: number
    required?: boolean
    dependsOn?: string[]
    resources?: Array<{
      title?: string
      url?: string
    }>
  }>
}

export type RoadmapTopic = {
  templateId: string
  templateTitle: string
  templateSlug: string
  topic: {
    stepKey: string
    title: string
    description?: string
  }
}

export type RoadmapStepProgress = {
  _id: string
  stepKey: string
  status: 'notStarted' | 'inProgress' | 'completed' | 'skipped'
  score?: number
  timeSpentMinutes?: number
  attempts?: number
  notes?: string
}

export type UserRoadmap = {
  _id: string
  template?: RoadmapTemplate
  status?: 'assigned' | 'inProgress' | 'paused' | 'completed' | 'archived'
  progressPercent?: number
  currentStepIndex?: number
  lastAccessedAt?: string | number
  createdAt?: string | number
}

type RoadmapTemplatesResponse = {
  success?: boolean
  data?: RoadmapTemplate[]
}

type RoadmapSearchResponse = {
  success?: boolean
  data?: {
    roadmaps?: RoadmapTemplate[]
    topics?: RoadmapTopic[]
    query?: string
  }
}

type RoadmapTemplateResponse = {
  success?: boolean
  data?: RoadmapTemplate
}

type UserRoadmapsResponse = {
  success?: boolean
  data?: UserRoadmap[]
}

type AssignRoadmapResponse = {
  success?: boolean
  message?: string
  data?: UserRoadmap
}

type RoadmapProgressResponse = {
  success?: boolean
  data?: {
    roadmap?: UserRoadmap
    stepProgress?: RoadmapStepProgress[]
  }
}

const emptyTemplatesResponse: RoadmapTemplatesResponse = {
  data: [],
}

const emptySearchResponse: RoadmapSearchResponse = {
  data: {
    roadmaps: [],
    topics: [],
    query: '',
  },
}

const emptyTemplateResponse: RoadmapTemplateResponse = {}
const emptyUserRoadmapsResponse: UserRoadmapsResponse = {
  data: [],
}
const emptyAssignResponse: AssignRoadmapResponse = {}
const emptyProgressResponse: RoadmapProgressResponse = {
  data: {
    stepProgress: [],
  },
}

export async function fetchRoadmapTemplates(limit = 18, templateType?: RoadmapTemplate['templateType']) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  })

  if (templateType) {
    searchParams.set('templateType', templateType)
  }

  const { response, data } = await apiGet<RoadmapTemplatesResponse>(
    `/roadmaps/templates?${searchParams.toString()}`,
    emptyTemplatesResponse,
    { authRetry: false },
  )

  if (!response.ok) {
    return []
  }

  return data.data ?? []
}

export async function searchRoadmaps(
  query: string,
  limit = 18,
  templateType?: RoadmapTemplate['templateType'],
) {
  const trimmedQuery = query.trim()
  const searchParams = new URLSearchParams({
    limit: String(limit),
  })

  if (trimmedQuery) {
    searchParams.set('q', trimmedQuery)
  }

  if (templateType) {
    searchParams.set('templateType', templateType)
  }

  const { response, data } = await apiGet<RoadmapSearchResponse>(
    `/roadmaps/search?${searchParams.toString()}`,
    emptySearchResponse,
    { authRetry: false },
  )

  if (!response.ok) {
    return {
      roadmaps: [],
      topics: [],
    }
  }

  return {
    roadmaps: data.data?.roadmaps ?? [],
    topics: data.data?.topics ?? [],
  }
}

export async function fetchRoadmapTemplateBySlug(slug: string) {
  const normalizedSlug = slug.trim()

  if (!normalizedSlug) {
    return null
  }

  const { response, data } = await apiGet<RoadmapTemplateResponse>(
    `/roadmaps/templates/by-slug/${encodeURIComponent(normalizedSlug)}`,
    emptyTemplateResponse,
    { authRetry: false },
  )

  if (!response.ok) {
    const privateResult = await apiGet<RoadmapTemplateResponse>(
      `/roadmaps/my-templates/by-slug/${encodeURIComponent(normalizedSlug)}`,
      emptyTemplateResponse,
    )

    if (!privateResult.response.ok) {
      return null
    }

    return privateResult.data.data ?? null
  }

  return data.data ?? null
}

export async function fetchUserRoadmaps() {
  const { response, data } = await apiGet<UserRoadmapsResponse>('/roadmaps', emptyUserRoadmapsResponse)

  if (!response.ok) {
    return []
  }

  return data.data ?? []
}

export async function assignRoadmap(templateId: string) {
  const { response, data } = await apiPost<AssignRoadmapResponse>(
    '/roadmaps/assign',
    emptyAssignResponse,
    { json: { templateId } },
  )

  if (!response.ok || !data.data) {
    throw new Error(data.message ?? 'Could not start tracking this roadmap.')
  }

  return data.data
}

export async function fetchRoadmapProgress(roadmapId: string) {
  const { response, data } = await apiGet<RoadmapProgressResponse>(
    `/roadmaps/${roadmapId}`,
    emptyProgressResponse,
  )

  if (!response.ok) {
    return {
      roadmap: undefined,
      stepProgress: [],
    }
  }

  return {
    roadmap: data.data?.roadmap,
    stepProgress: data.data?.stepProgress ?? [],
  }
}

export async function updateRoadmapStepStatus(
  roadmapId: string,
  stepKey: string,
  status: RoadmapStepProgress['status'],
) {
  const { response, data } = await apiRequest<{ success?: boolean; data?: RoadmapStepProgress }>(
    `/roadmaps/${roadmapId}/steps/${encodeURIComponent(stepKey)}/progress`,
    {},
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  )

  if (!response.ok || !data.data) {
    throw new Error('Could not update this step.')
  }

  return data.data
}

export async function deleteUserRoadmap(roadmapId: string) {
  const { response, data } = await apiRequest<{ success?: boolean; message?: string }>(
    `/roadmaps/${roadmapId}`,
    {},
    { method: 'DELETE' },
  )

  if (!response.ok) {
    throw new Error(data.message || 'Could not delete this roadmap.')
  }

  return true
}

export type NestRoadmap = {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export type NestTopicTree = {
  topicId: string
  name: string
  label: string
  description: string
  type: 'topic' | 'subtopic'
  roadmapId: string
  position: { x: number; y: number }
  resources: Array<{ type: string; title: string; link: string }>
  parentTopicId?: string
  path: string[]
  childTopics: NestTopicTree[]
  createdAt?: string
  updatedAt?: string
}

export type NestRoadmapTreeResponse = {
  id: string
  name: string
  childTopics: NestTopicTree[]
  createdAt?: string
  updatedAt?: string
}

export async function fetchNestRoadmaps(): Promise<NestRoadmap[]> {
  const { response, data } = await apiGet<{ success?: boolean; data?: NestRoadmap[]; message?: string }>(
    '/v1/roadmaps',
    {},
    { authRetry: true },
  )

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}: Failed to fetch NestJS roadmaps`)
  }

  return data.data ?? []
}

export async function fetchNestRoadmapTree(id: string): Promise<NestRoadmapTreeResponse | null> {
  const { response, data } = await apiGet<{ success?: boolean; data?: NestRoadmapTreeResponse; message?: string }>(
    `/v1/roadmaps/${encodeURIComponent(id)}`,
    {},
    { authRetry: true },
  )

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}: Failed to fetch NestJS roadmap tree`)
  }

  return data.data ?? null
}
