import type { UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Login02Icon } from '@hugeicons/core-free-icons'
import type { LoginFormValues } from '../../hooks/useLoginPage'
import { useLanguage } from '../../context/LanguageContext'
import {
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
} from '../../libs/motionVariants'
import FormInput from '../ui/Input'
import PasswordVisibilityToggle from '../ui/passwordVisibilityToggle'

type LoginFormProps = {
  form: UseFormReturn<LoginFormValues>
  identifierValue: string
  passwordValue: string
  isSubmitting: boolean
  showPassword: boolean
  onTogglePassword: () => void
  onSubmit: (values: LoginFormValues) => Promise<void>
}

export default function LoginForm({
  form,
  identifierValue,
  passwordValue,
  isSubmitting,
  showPassword,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = form

  return (
    <motion.form
      dir={direction}
      className="grid gap-5 px-6 py-8 sm:px-8"
      onSubmit={handleSubmit(onSubmit)}
      variants={authFormVariants}
    >
      <motion.section
        className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
        variants={authFormSectionVariants}
      >
        <motion.h2
          variants={authFormFieldItemVariants}
          className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)"
        >
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
                onToggle={onTogglePassword}
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
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              t('login.submit')
            )}
            <HugeiconsIcon icon={Login02Icon} size={20} />
          </button>
        </motion.div>
      </motion.section>

      <motion.div
        variants={authFormFieldItemVariants}
        className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-center text-sm text-(--text)"
      >
        {t('login.needAccount')}{' '}
        <Link to={`/${language}/signup`} className="font-semibold text-(--gd-primary) hover:underline">
          {t('login.createOne')}
        </Link>
      </motion.div>
    </motion.form>
  )
}
