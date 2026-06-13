import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLanguage } from '../context/LanguageContext'
import { useResendCooldown } from './useResendCooldown'
import { apiPost } from '../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../utils/backendResponseMessage'
import { verifyEmailSchema } from '../types/validationSchemas'

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

type VerifyEmailLocationState = {
  email?: string
}

export function useVerifyEmailPage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { email } = (location.state as VerifyEmailLocationState | null) ?? {}
  const emailFromQuery = searchParams.get('email') ?? undefined
  const oauthVerified = searchParams.get('oauth_verified') === '1'
  const oauthProvider = searchParams.get('provider') ?? 'google'
  const isGmailSignupVerification = oauthProvider === 'google' && !oauthVerified
  const resendEmail = email ?? emailFromQuery
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const { isCoolingDown, cooldownLabel, startCooldown } = useResendCooldown(
    resendEmail ? `verify-resend:${resendEmail.toLowerCase()}` : 'verify-resend:anonymous',
    60,
  )

  const form = useForm<VerifyEmailFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  })

  const codeValue = useWatch({ control: form.control, name: 'code' }) ?? ''

  useEffect(() => {
    if (!oauthVerified) {
      return
    }

    const redirectTimer = setTimeout(() => {
      navigate(`/${language}/preferences`, { replace: true })
    }, 2200)

    return () => clearTimeout(redirectTimer)
  }, [language, navigate, oauthVerified])

  const onResendCode = useCallback(async () => {
    if (!resendEmail) {
      toast.error(t('verify.missingEmail'))
      return
    }

    if (isCoolingDown || isResending) {
      return
    }

    setIsResending(true)

    try {
      const { response, data } = await apiPost<BackendResponseError>(
        '/auth/resend-verification-code',
        {},
        { json: { email: resendEmail }, authRetry: false },
      )

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: 'verify.resendFailed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        )
        return
      }

      startCooldown()
      toast.success(t('verify.resendSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('verify.resendFailed'))
    } finally {
      setIsResending(false)
    }
  }, [isCoolingDown, isResending, language, resendEmail, startCooldown, t])

  const onSubmit = useCallback(
    async ({ code }: VerifyEmailFormValues) => {
      setIsSubmitting(true)

      try {
        const { response, data } = await apiPost<BackendResponseError>(
          '/auth/verify-email',
          {},
          { json: { code: code.toUpperCase().trim() }, authRetry: false },
        )

        if (!response.ok) {
          toast.error(
            getBackendResponseMessage(response, data, {
              fallbackKey: 'auth.verifyFailed',
              translate: t,
              locale: language === 'ar' ? 'ar-EG' : 'en-US',
            }),
          )
          return
        }

        toast.success(t('auth.verifySuccess'))
        navigate(`/${language}/preferences`, { replace: true })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('auth.verifyFailed'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [language, navigate, t],
  )

  const continueToDashboard = useCallback(() => {
    navigate(`/${language}/preferences`, { replace: true })
  }, [language, navigate])

  return {
    direction,
    form,
    codeValue,
    oauthVerified,
    oauthProvider,
    verifyTitle: isGmailSignupVerification ? t('verify.gmailSignupTitle') : t('verify.title'),
    verifySubtitle: isGmailSignupVerification
      ? t('verify.gmailSignupSubtitle', { email: email ?? t('verify.defaultEmail') })
      : t('verify.subtitle', { email: email ?? t('verify.defaultEmail') }),
    isSubmitting,
    isResending,
    canResend: Boolean(resendEmail),
    isCoolingDown,
    cooldownLabel,
    onResendCode,
    onSubmit,
    continueToDashboard,
  }
}
