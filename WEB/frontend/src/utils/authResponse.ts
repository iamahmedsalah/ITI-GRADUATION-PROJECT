type AuthErrorResponse = {
  success?: boolean
  message?: string
  errors?: Array<{
    field?: string
    message?: string
  }>
  lockUntil?: string | number
}

type Translate = (key: string, options?: Record<string, unknown>) => string

type AuthErrorOptions = {
  fallbackKey: string
  translate: Translate
  locale?: string
}

export function getAuthErrorMessage(
  response: Response,
  data: AuthErrorResponse,
  { fallbackKey, translate, locale = 'en-US' }: AuthErrorOptions,
) {
  if (response.status === 423 && data.lockUntil) {
    const lockedUntil = new Date(data.lockUntil).toLocaleString(locale, {
      timeZone: 'Africa/Cairo',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    return translate('auth.accountLocked', { time: lockedUntil })
  }

  if (response.status === 429) {
    return translate('auth.tooManyRequests')
  }

  if (response.status === 400) {
    const validationMessage = data.errors?.[0]?.message

    if (validationMessage) {
      return validationMessage
    }

    if (data.message && !data.message.toLowerCase().includes('validation failed')) {
      return data.message
    }

    return translate('auth.validationFailed')
  }

  return data.message ?? translate(fallbackKey)
}

export type { AuthErrorResponse }