import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../context/LanguageContext'
import {
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
  createPageVariants,
} from '../libs/motionVariants'
import { buildApiUrl } from '../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../utils/backendResponseMessage'
import { loginSchema } from '../types/validationSchemas'
import { z } from 'zod'
import PasswordVisibilityToggle from '../components/ui/passwordVisibilityToggle'
import FormInput from '../components/ui/form-input'

type LoginFormValues = z.infer<typeof loginSchema>

function LoginPage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const pageVariants = createPageVariants(direction)
  const languageLabel = t(language === 'ar' ? 'arabic' : 'english')
  const isRtl = direction === 'rtl'
  const toastLocale = language === 'ar' ? 'ar-EG' : 'en-US'

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
  } = useForm<LoginFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)

    try {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      })

      const data = (await response.json()) as BackendResponseError

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
      navigate(`/${language}/dashboard`, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('auth.loginFailed'))
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

  const identifierValue = useWatch({ control, name: 'identifier' }) ?? ''
  const passwordValue = useWatch({ control, name: 'password' }) ?? ''

  return (
    <motion.main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10" variants={pageVariants} initial="hidden" animate="show">
      <motion.div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm" initial="hidden" animate="visible" variants={containerVariants}>
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.42)_0%,rgba(29,185,84,0.16)_40%,rgba(29,185,84,0)_72%)] blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(var(--glow-neutral-rgb),0.18)_0%,rgba(var(--glow-neutral-rgb),0.06)_45%,rgba(var(--glow-neutral-rgb),0)_78%)] blur-3xl" />

        <div className="relative grid lg:grid-cols-2">
          <motion.section className={`border-b border-(--border) px-6 py-8 sm:px-8 lg:border-b-0 ${isRtl ? 'lg:border-l' : 'lg:border-r'}`} variants={itemVariants}>
            <div className="mb-4 inline-flex rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-(--text)">
              {t('login.badge')}
            </div>
            <h1 className="text-2xl font-bold text-(--text) sm:text-3xl">
              {t('login.title')}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-(--text)">
              {t('login.subtitle', { language: languageLabel })}
            </p>

            <div className="mt-7 grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text)">{t('login.organizeTitle')}</p>
              <p className="text-sm leading-6 text-(--text)">{t('login.helper')}</p>
            </div>
          </motion.section>

          <motion.form dir={direction} className="grid gap-5 px-6 py-8 sm:px-8" onSubmit={handleSubmit(onSubmit)} variants={authFormVariants}>
            <motion.section className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5" variants={authFormSectionVariants}>
              <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
                {t('login.credentialsSection')}
              </motion.h2>

              <motion.div variants={authFormFieldItemVariants}>
                <FormInput
                  {...register('identifier')}
                  label={t('login.identifier')}
                  placeholder={t('login.identifierPlaceholder')}
                  autoComplete="username"
                  error={errors.identifier ? t(errors.identifier.message ?? '') : undefined}
                  success={Boolean(touchedFields.identifier && !errors.identifier && identifierValue.trim().length > 0)}
                  successMessage={t('formInput.valid')}
                />
              </motion.div>

              <motion.div variants={authFormFieldItemVariants}>
                <FormInput
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  dir={direction}
                  className={direction === 'rtl' ? 'pl-11' : 'pr-11'}
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  autoComplete="current-password"
                  error={errors.password ? t(errors.password.message ?? '') : undefined}
                  success={Boolean(touchedFields.password && !errors.password && passwordValue.trim().length > 0)}
                  successMessage={t('formInput.valid')}
                  rightAdornment={
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                      showLabel={t('passwordToggle.show')}
                      hideLabel={t('passwordToggle.hide')}
                    />
                  }
                />
              </motion.div>

              <motion.div variants={authFormFieldItemVariants} className="flex justify-end">
                <Link to={`/${language}/forgot-password`} className="text-xs font-medium text-(--gd-primary) hover:underline">
                  {t('login.forgotPassword')}
                </Link>
              </motion.div>

              <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary)  px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : t('login.submit')}
                </button>
              </motion.div>
            </motion.section>

            <motion.div variants={authFormFieldItemVariants} className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-center text-sm text-(--text)">
              {t('login.needAccount')}{' '}
              <Link to={`/${language}/signup`} className="font-semibold text-(--gd-primary) hover:underline">
                {t('login.createOne')}
              </Link>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </motion.main>
  )
}

export default LoginPage
