import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLanguage } from '../context/LanguageContext'
import { useResendCooldown } from './useResendCooldown'
import { apiPost } from '../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../utils/backendResponseMessage'
import { generateStrongPassword } from '../utils/passwordGenerator'
import { resetPasswordSchema } from '../types/validationSchemas'

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

type UseResetPasswordPageOptions = {
  resetPathBuilder: (token: string) => string
  successRedirectPath: (language: string) => string
  resendPath?: string
}

export function useResetPasswordPage({
  resetPathBuilder,
  successRedirectPath,
  resendPath,
}: UseResetPasswordPageOptions) {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? undefined
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isPasswordCopied, setIsPasswordCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isCoolingDown, cooldownLabel, startCooldown } = useResendCooldown(
    email ? `reset-resend:${email.toLowerCase()}` : 'reset-resend:anonymous',
    60,
  )

  const form = useForm<ResetPasswordFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = useWatch({ control: form.control, name: 'password' }) ?? ''
  const confirmPasswordValue = useWatch({ control: form.control, name: 'confirmPassword' }) ?? ''

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    form.setValue('password', generated, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    form.setValue('confirmPassword', '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setIsPasswordCopied(false)
    setShowPassword(true)
    toast.success(t('passwordTools.generated'))
  }

  const handleCopyPassword = async () => {
    if (!passwordValue) {
      toast.error(t('passwordTools.empty'))
      return
    }

    try {
      await navigator.clipboard.writeText(passwordValue)
      setIsPasswordCopied(true)
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setIsPasswordCopied(false)
      }, 1800)
      toast.success(t('passwordTools.copied'))
    } catch {
      toast.error(t('passwordTools.copyFailed'))
    }
  }

  const onResendResetLink = async () => {
    if (!resendPath) {
      return
    }

    if (!email) {
      toast.error(t('reset.missingEmail'))
      return
    }

    if (isCoolingDown || isResending) {
      return
    }

    setIsResending(true)

    try {
      const { response, data } = await apiPost<BackendResponseError>(
        resendPath,
        {},
        { json: { email }, authRetry: false },
      )

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: 'reset.resendFailed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        )
        return
      }

      startCooldown()
      toast.success(t('reset.resendSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reset.resendFailed'))
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error(t('reset.invalidToken'))
      return
    }

    setIsSubmitting(true)

    try {
      const { response, data } = await apiPost<BackendResponseError>(
        resetPathBuilder(token),
        {},
        { json: { password: values.password }, authRetry: false },
      )

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: 'reset.failed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        )
        return
      }

      toast.info(t('reset.success'))
      navigate(successRedirectPath(language), { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reset.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  return {
    language,
    direction,
    form,
    email,
    values: {
      password: passwordValue,
      confirmPassword: confirmPasswordValue,
    },
    isSubmitting,
    isResending,
    isPasswordCopied,
    showPassword,
    showConfirmPassword,
    isCoolingDown,
    cooldownLabel,
    setShowPassword,
    setShowConfirmPassword,
    handleGeneratePassword,
    handleCopyPassword,
    onResendResetLink,
    onSubmit,
  }
}
