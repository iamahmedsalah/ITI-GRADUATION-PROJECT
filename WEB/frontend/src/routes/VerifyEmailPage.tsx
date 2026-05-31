import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../context/LanguageContext'
import {
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
  createPageVariants,
} from '../libs/motionVariants'
import { apiPost } from '../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../utils/backendResponseMessage'
import { verifyEmailSchema } from '../types/validationSchemas'
import { useResendCooldown } from '../hooks/useResendCooldown'
import { z } from 'zod'
import FormInput from '../components/ui/Input'

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>

type VerifyEmailLocationState = {
  email?: string
}

function VerifyEmailPage() {
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
  const pageVariants = createPageVariants(direction)
  const isRtl = direction === 'rtl'
  const { isCoolingDown, cooldownLabel, startCooldown } = useResendCooldown(
    resendEmail ? `verify-resend:${resendEmail.toLowerCase()}` : 'verify-resend:anonymous',
    60,
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
  } = useForm<VerifyEmailFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  })

  const codeValue = useWatch({ control, name: 'code' }) ?? ''

  useEffect(() => {
    if (!oauthVerified) {
      return
    }

    const redirectTimer = setTimeout(() => {
      navigate(`/${language}/dashboard`, { replace: true })
    }, 2200)

    return () => clearTimeout(redirectTimer)
  }, [language, navigate, oauthVerified])

  const onResendCode = async () => {
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
  }

  const onSubmit = async ({ code }: VerifyEmailFormValues) => {
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
      navigate(`/${language}/dashboard`, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.verifyFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const verifyTitle = isGmailSignupVerification ? t('verify.gmailSignupTitle') : t('verify.title')
  const verifySubtitle = isGmailSignupVerification
    ? t('verify.gmailSignupSubtitle', { email: email ?? t('verify.defaultEmail') })
    : t('verify.subtitle', { email: email ?? t('verify.defaultEmail') })

  return (
    <motion.main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10" variants={pageVariants} initial="hidden" animate="show">
      <motion.div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.42)_0%,rgba(29,185,84,0.16)_40%,rgba(29,185,84,0)_72%)] blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(var(--glow-neutral-rgb),0.18)_0%,rgba(var(--glow-neutral-rgb),0.06)_45%,rgba(var(--glow-neutral-rgb),0)_78%)] blur-3xl" />

        <div className="relative grid lg:grid-cols-[0.92fr_1.08fr]">
          <motion.section className={`border-b border-(--border) px-6 py-8 sm:px-8 lg:border-b-0 ${isRtl ? 'lg:border-l' : 'lg:border-r'}`} variants={itemVariants}>
            <div className="mb-4 inline-flex rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-(--text)">
              {t('verify.badge')}
            </div>
            <h1 className="bg-linear-to-r from-(--gd-primary) to-(--gd-secondary) bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              {verifyTitle}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-(--text)">
              {verifySubtitle}
            </p>

            <div className="mt-7 grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text)">{t('verify.organizeTitle')}</p>
              <p className="text-sm leading-6 text-(--text)">{t('verify.helper')}</p>
            </div>
          </motion.section>

          <motion.form dir={direction} className="grid gap-5 px-6 py-8 sm:px-8" onSubmit={handleSubmit(onSubmit)} variants={authFormVariants}>
            {oauthVerified ? (
              <motion.section className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5" variants={authFormSectionVariants}>
                <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
                  {t('verify.oauthVerifiedTitle')}
                </motion.h2>

                <motion.p variants={authFormFieldItemVariants} className="text-sm leading-6 text-(--text)">
                  {t('verify.oauthVerifiedMessage', { provider: t(`signup.social.${oauthProvider}`) })}
                </motion.p>

                <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/${language}/dashboard`, { replace: true })}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {t('verify.continueToDashboard')}
                  </button>
                </motion.div>
              </motion.section>
            ) : (
              <>
                <motion.section className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5" variants={authFormSectionVariants}>
                  <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
                    {t('verify.sectionTitle')}
                  </motion.h2>

                  <motion.div variants={authFormFieldItemVariants}>
                    <FormInput
                      {...register('code')}
                      label={t('verify.code')}
                      placeholder={t('verify.placeholder')}
                      autoComplete="one-time-code"
                      inputMode="text"
                      className="text-center uppercase tracking-[0.35em] placeholder:normal-case placeholder:tracking-normal"
                      error={errors.code ? t(errors.code.message ?? '') : undefined}
                      success={Boolean(touchedFields.code && !errors.code && codeValue.trim().length === 8)}
                      successMessage={t('formInput.valid')}
                    />
                  </motion.div>

                  <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t('verify.submit')}
                    </button>
                  </motion.div>
                </motion.section>

                <motion.div variants={authFormFieldItemVariants} className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text)">
                  <p className="text-center">
                    {t('verify.noCode')}{' '}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3">
                    <div>
                      <p className="font-medium text-(--text-h)">{t('verify.resendTitle')}</p>
                      <p className="text-xs text-(--text)">
                        {isCoolingDown
                          ? t('verify.resendWait', { time: cooldownLabel })
                          : t('verify.resendPrompt')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onResendCode}
                      disabled={!resendEmail || isCoolingDown || isResending}
                      className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isResending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        t('verify.resendButton')
                      )}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </motion.form>
        </div>
      </motion.div>
    </motion.main>
  )
}

export default VerifyEmailPage
