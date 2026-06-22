import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLanguage } from '../context/LanguageContext'
import { authQueryKey, fetchCurrentUser, queryClient } from '../libs/react-query'
import { apiPost } from '../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../utils/backendResponseMessage'
import type { AuthUser } from '../utils/route-utils'
import { loginSchema } from '../types/validationSchemas'
import { useGoogleAuthPopup } from './useGoogleAuthPopup'
import { decryptData } from '../utils/crypto'

export type LoginFormValues = z.infer<typeof loginSchema>

const shownAuthToastReasons = new Set<string>()

export function useLoginPage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [savedAccount, setSavedAccount] = useState<{ name: string; email: string; avatarUrl: string } | null>(null)
  const handleSocialLogin = useGoogleAuthPopup('login')
  const toastLocale = language === 'ar' ? 'ar-EG' : 'en-US'

  // Decrypt and load saved account details on mount
  useEffect(() => {
    async function loadSavedAccount() {
      const cipherText = localStorage.getItem('last_google_account')
      if (cipherText) {
        try {
          const plainText = await decryptData(cipherText)
          if (plainText) {
            setSavedAccount(JSON.parse(plainText))
          }
        } catch {
          // ignore
        }
      }
    }
    void loadSavedAccount()
  }, [])

  const handleUseDifferentAccount = useCallback(async () => {
    localStorage.removeItem('last_google_account')
    setSavedAccount(null)
    await handleSocialLogin()
  }, [handleSocialLogin])

  const form = useForm<LoginFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  const identifierValue = useWatch({ control: form.control, name: 'identifier' }) ?? ''
  const passwordValue = useWatch({ control: form.control, name: 'password' }) ?? ''
  const languageLabel = t(language === 'ar' ? 'arabic' : 'english')

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      setIsSubmitting(true)

      try {
        const { response, data } = await apiPost<BackendResponseError>(
          '/auth/login',
          {},
          { json: values, authRetry: false },
        )

        if (!response.ok) {
          toast.error(
            getBackendResponseMessage(response, data, {
              fallbackKey: 'auth.loginFailed',
              translate: t,
              locale: toastLocale,
            }),
          )

          if (data.message?.toLowerCase().includes('verified')) {
            navigate(`/${language}/verify-email?email=${encodeURIComponent(values.identifier)}`, {
              replace: true,
              state: { email: values.identifier.includes('@') ? values.identifier : undefined },
            })
          }

          return
        }

        toast.info(t('auth.loginSuccess'))

        try {
          const maybeUser = (data as unknown as { user?: AuthUser })?.user

          if (maybeUser) {
            queryClient.setQueryData(authQueryKey, maybeUser)
          }
        } catch {
          // ignore
        }

        try {
          await queryClient.fetchQuery({ queryKey: authQueryKey, queryFn: fetchCurrentUser })
        } catch {
          // ignore - fetchCurrentUser will return null if not authenticated yet
        }

        navigate(`/${language}/dashboard`, { replace: true })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('auth.loginFailed'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [language, navigate, t, toastLocale],
  )

  useEffect(() => {
    const reason = searchParams.get('reason')
    const toastKey = reason ?? ''

    if (reason?.startsWith('REFRESH_')) {
      if (!shownAuthToastReasons.has(toastKey)) {
        shownAuthToastReasons.add(toastKey)
        toast.error(t('auth.signInReset'))
      }

      setSearchParams({}, { replace: true })
      return
    }

    if (reason === 'session-expired') {
      if (!shownAuthToastReasons.has(toastKey)) {
        shownAuthToastReasons.add(toastKey)
        toast.error(t('auth.sessionExpired'))
      }

      setSearchParams({}, { replace: true })
      return
    }

    const oauthError = searchParams.get('oauth_error')

    if (!oauthError) {
      return
    }

    toast.error(t('auth.loginFailed'))
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, t])

  return {
    direction,
    form,
    identifierValue,
    passwordValue,
    languageLabel,
    isSubmitting,
    showPassword,
    setShowPassword,
    handleSocialLogin,
    savedAccount,
    handleUseDifferentAccount,
    onSubmit,
  }
}
