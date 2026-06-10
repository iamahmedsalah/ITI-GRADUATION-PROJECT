import { apiPost } from '../utils/api'
import type { BackendResponseError } from '../utils/backendResponseMessage'

export type ContactPayload = {
  name: string
  email: string
  message: string
}

export type ContactResponse = BackendResponseError & {
  success?: boolean
}

export function sendContactRequest(payload: ContactPayload) {
  return apiPost<ContactResponse>('/contact', {}, {
    json: payload,
    authRetry: false,
  })
}
