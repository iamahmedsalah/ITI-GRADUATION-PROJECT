import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLanguage } from '../context/LanguageContext'
import { apiPost } from '../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../utils/backendResponseMessage'
import { generateStrongPassword } from '../utils/passwordGenerator'
import { signupSchema } from '../types/validationSchemas'
import { useGoogleAuthRedirect } from './useGoogleAuthRedirect'

export type SignupFormValues = z.infer<typeof signupSchema>

export function useSignupPage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isPasswordCopied, setIsPasswordCopied] = useState(false)
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSocialSignup = useGoogleAuthRedirect('signup')

  const form = useForm<SignupFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      Fname: '',
      Lname: '',
      email: '',
      password: '',
    },
  })

  const usernameValue = useWatch({ control: form.control, name: 'username' }) ?? ''
  const emailValue = useWatch({ control: form.control, name: 'email' }) ?? ''
  const firstNameValue = useWatch({ control: form.control, name: 'Fname' }) ?? ''
  const lastNameValue = useWatch({ control: form.control, name: 'Lname' }) ?? ''
  const passwordValue = useWatch({ control: form.control, name: 'password' }) ?? ''
  const languageLabel = t(language === 'ar' ? 'arabic' : 'english')

  const onSubmit = useCallback(
    async (values: SignupFormValues) => {
      setIsSubmitting(true)

      try {
        const { response, data } = await apiPost<BackendResponseError>(
          '/auth/signup',
          {},
          { json: values, authRetry: false },
        )

        if (!response.ok) {
          toast.error(
            getBackendResponseMessage(response, data, {
              fallbackKey: 'auth.signupFailed',
              translate: t,
              locale: language === 'ar' ? 'ar-EG' : 'en-US',
            }),
          )
          return
        }

        toast.success(t('auth.signupSuccess'))
        navigate(`/${language}/verify-email?email=${encodeURIComponent(values.email)}`, {
          replace: true,
          state: { email: values.email },
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('auth.signupFailed'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [language, navigate, t],
  )

  const handleGeneratePassword = useCallback(() => {
    const generated = generateStrongPassword()
    form.setValue('password', generated, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setIsPasswordCopied(false)
    setShowPassword(true)
    toast.success(t('passwordTools.generated'))
  }, [form, t])

  const handleCopyPassword = useCallback(async () => {
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
  }, [passwordValue, t])

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  return {
    direction,
    form,
    values: {
      username: usernameValue,
      email: emailValue,
      firstName: firstNameValue,
      lastName: lastNameValue,
      password: passwordValue,
    },
    languageLabel,
    isSubmitting,
    showPassword,
    isPasswordCopied,
    setShowPassword,
    handleGeneratePassword,
    handleCopyPassword,
    handleSocialSignup,
    onSubmit,
  }
}
