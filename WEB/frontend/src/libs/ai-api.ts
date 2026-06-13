import { apiGet, apiPost } from '../utils/api'
import type { RoadmapTemplate, UserRoadmap } from './roadmaps-api'

export type AiFeatureAccess = {
  subscription: {
    plan: 'free' | 'pro'
    status: 'inactive' | 'active' | 'trialing' | 'pastDue' | 'canceled'
    isSubscriber: boolean
  }
  usage: {
    periodStart: string
    draftsUsed: number
    draftLimit: number
    planDraftLimit?: number
    freeDraftLimit: number
    proDraftLimit?: number
    draftsRemaining: number
  }
  capabilities: {
    canGenerateDraft: boolean
    canSaveRoadmap: boolean
    canExplainTopic: boolean
  }
}

export type AiRoadmapDraft = Omit<RoadmapTemplate, '_id'> & {
  source?: 'ai'
  contentFormat?: 'markdown' | 'json'
  contentMarkdown?: string
}

export type AiRoadmapDraftPayload = {
  engine: string
  model: string
  provider?: 'gemini' | 'openai'
  generatedAt: string
  draft: AiRoadmapDraft
  access?: AiFeatureAccess
}

export type AiTopicExplanation = {
  model: string
  provider?: 'gemini' | 'openai'
  generatedAt: string
  explanation: {
    summary: string
    keyPoints: string[]
    practice: string[]
    commonMistakes: string[]
  }
}

type AiFeatureAccessResponse = {
  success?: boolean
  message?: string
  data?: AiFeatureAccess
}

type AiRoadmapDraftResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: AiRoadmapDraftPayload | AiFeatureAccess
}

type SaveAiRoadmapResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: {
    template?: RoadmapTemplate
    roadmap?: UserRoadmap
  }
}

type AiTopicExplanationResponse = {
  success?: boolean
  message?: string
  error?: string
  data?: AiTopicExplanation
}

const emptyAccessResponse: AiFeatureAccessResponse = {}
const emptyDraftResponse: AiRoadmapDraftResponse = {}
const emptySaveResponse: SaveAiRoadmapResponse = {}
const emptyExplanationResponse: AiTopicExplanationResponse = {}

function getApiMessage(data: { message?: string; error?: string }, fallback: string) {
  return data.error || data.message || fallback
}

export async function fetchAiFeatureAccess() {
  const { response, data } = await apiGet<AiFeatureAccessResponse>(
    '/ai/features/access',
    emptyAccessResponse,
  )

  if (!response.ok || !data.data) {
    throw new Error(data.message || 'Could not load AI access.')
  }

  return data.data
}

export async function generateUserAiRoadmapDraft(input: {
  prompt: string
  targetLevel: 'beginner' | 'intermediate' | 'advanced'
  durationWeeks: number
  weeklyStudyHours: number
}) {
  const { response, data } = await apiPost<AiRoadmapDraftResponse>(
    '/ai/roadmaps/user-draft',
    emptyDraftResponse,
    { json: input },
  )

  if (!response.ok || !data.data || !('draft' in data.data)) {
    const error = new Error(getApiMessage(data, 'Could not generate AI roadmap.'))
    if (data.data && 'capabilities' in data.data) {
      ;(error as Error & { access?: AiFeatureAccess }).access = data.data
    }
    throw error
  }

  return data.data
}

export async function saveUserAiRoadmap(draft: AiRoadmapDraft) {
  const { response, data } = await apiPost<SaveAiRoadmapResponse>(
    '/ai/roadmaps/save',
    emptySaveResponse,
    { json: { draft } },
  )

  if (!response.ok || !data.data?.roadmap) {
    throw new Error(getApiMessage(data, 'Could not save AI roadmap.'))
  }

  return data.data
}

export async function explainAiRoadmapTopic(input: {
  roadmapTitle: string
  roadmapGoal?: string
  stepTitle: string
  stepDescription?: string
}) {
  const { response, data } = await apiPost<AiTopicExplanationResponse>(
    '/ai/topics/explain',
    emptyExplanationResponse,
    { json: input },
  )

  if (!response.ok || !data.data) {
    throw new Error(getApiMessage(data, 'Could not explain this topic.'))
  }

  return data.data
}
