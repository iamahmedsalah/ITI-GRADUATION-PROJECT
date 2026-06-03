import type { UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { ResetPasswordFormValues } from '../../hooks/useResetPasswordPage'
import {
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
} from '../../libs/motionVariants'
import FormInput from '../ui/Input'
import PasswordActions from '../ui/passwordActions'
import PasswordStrength from '../ui/passwordStrength'
import PasswordVisibilityToggle from '../ui/passwordVisibilityToggle'

type ResetPasswordFormProps = {
  form: UseFormReturn<ResetPasswordFormValues>
  direction: 'ltr' | 'rtl'
  language: string
  values: {
    password: string
    confirmPassword: string
  }
  isSubmitting: boolean
  isPasswordCopied: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  backToLoginPath?: (language: string) => string
  backToLoginLabelKey?: string
  onTogglePassword: () => void
  onToggleConfirmPassword: () => void
  onGeneratePassword: () => void
  onCopyPassword: () => void
  onSubmit: (values: ResetPasswordFormValues) => Promise<void>
}

export default function ResetPasswordForm({
  form,
  direction,
  language,
  values,
  isSubmitting,
  isPasswordCopied,
  showPassword,
  showConfirmPassword,
  backToLoginPath,
  backToLoginLabelKey,
  onTogglePassword,
  onToggleConfirmPassword,
  onGeneratePassword,
  onCopyPassword,
  onSubmit,
}: ResetPasswordFormProps) {
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
        <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
          {t('reset.sectionTitle')}
        </motion.h2>

        <motion.div variants={authFormFieldItemVariants} className="flex justify-start">
          <PasswordActions
            onGenerate={onGeneratePassword}
            onCopy={onCopyPassword}
            generateLabel={t('passwordTools.generate')}
            copyLabel={t('passwordTools.copy')}
            copiedLabel={t('passwordTools.copiedState')}
            copied={isPasswordCopied}
            generateAriaLabel={t('passwordTools.generateAria')}
            copyAriaLabel={t('passwordTools.copyAria')}
            copyDisabled={!values.password}
          />
        </motion.div>

        <motion.div variants={authFormFieldItemVariants}>
          <FormInput
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            dir={direction}
            className={direction === 'rtl' ? 'pl-11' : 'pr-11'}
            label={t('reset.password')}
            placeholder={t('reset.passwordPlaceholder')}
            autoComplete="new-password"
            error={errors.password ? t(errors.password.message ?? '') : undefined}
            success={Boolean(touchedFields.password && !errors.password && values.password.trim().length > 0)}
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

        <motion.div variants={authFormFieldItemVariants}>
          <p className="text-sm leading-6 text-(--text)">{t('reset.strengthHint')}</p>
        </motion.div>

        <motion.div variants={authFormFieldItemVariants}>
          <PasswordStrength
            password={values.password}
            submitLabel={t('reset.submit')}
            isSubmitting={isSubmitting}
            showSubmitButton={false}
          />
        </motion.div>

        <motion.div variants={authFormFieldItemVariants}>
          <FormInput
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            dir={direction}
            className={direction === 'rtl' ? 'pl-11' : 'pr-11'}
            label={t('reset.confirmPassword')}
            placeholder={t('reset.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            error={errors.confirmPassword ? t(errors.confirmPassword.message ?? '') : undefined}
            success={Boolean(
              touchedFields.confirmPassword &&
                !errors.confirmPassword &&
                values.confirmPassword.trim().length > 0 &&
                values.password === values.confirmPassword,
            )}
            successMessage={t('formInput.valid')}
            rightAdornment={
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={onToggleConfirmPassword}
                showLabel={t('passwordToggle.show')}
                hideLabel={t('passwordToggle.hide')}
              />
            }
          />
        </motion.div>

        <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              t('reset.submit')
            )}
          </button>
        </motion.div>

        {backToLoginPath && backToLoginLabelKey ? (
          <div className="mt-4 rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text)">
            <Link to={backToLoginPath(language)} className="font-semibold text-(--gd-primary) hover:underline">
              {t(backToLoginLabelKey)}
            </Link>
          </div>
        ) : null}
      </motion.section>
    </motion.form>
  )
}
