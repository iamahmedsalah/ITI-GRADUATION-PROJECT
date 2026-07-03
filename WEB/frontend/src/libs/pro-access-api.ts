import { apiGet, apiPost } from '../utils/api'

export type ProAccessRequest = {
  _id: string
  learningGoal: 'career-switch' | 'skill-up' | 'portfolio-project' | 'interview-prep' | 'academic-study' | 'other'
  needReason: string
  expectedDurationDays: 7 | 14 | 30
  status: 'pending' | 'approved' | 'rejected'
  adminNote?: string
  accessStartsAt?: string | number | null
  accessEndsAt?: string | number | null
  createdAt?: string | number
  updatedAt?: string | number
}

type ProAccessResponse = {
  success?: boolean
  message?: string
  data?: ProAccessRequest | null
}

const emptyProAccessResponse: ProAccessResponse = {}

export async function fetchMyProAccessRequest() {
  const { response, data } = await apiGet<ProAccessResponse>('/pro-access/mine', emptyProAccessResponse)

  if (!response.ok) {
    return null
  }

  return data.data ?? null
}

export async function createProAccessRequest(payload: {
  learningGoal: ProAccessRequest['learningGoal']
  needReason: string
  expectedDurationDays: ProAccessRequest['expectedDurationDays']
}) {
  const { response, data } = await apiPost<ProAccessResponse>(
    '/pro-access/requests',
    emptyProAccessResponse,
    { json: payload },
  )

  if (!response.ok || !data.data) {
    throw new Error(data.message || 'Could not submit Pro access request.')
  }

  return data.data
}
