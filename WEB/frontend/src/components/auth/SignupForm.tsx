import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { SignupFormValues } from '../../hooks/useSignupPage'
import { useLanguage } from '../../context/LanguageContext'
import {
  authFormFieldGridVariants,
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
} from '../../libs/motionVariants'
import FormInput from '../ui/Input'
import PasswordActions from '../ui/passwordActions'
import PasswordStrengthSubmit from '../ui/passwordStrength'
import PasswordVisibilityToggle from '../ui/passwordVisibilityToggle'

type SignupFormProps = {
  form: UseFormReturn<SignupFormValues>
  values: {
    username: string
    email: string
    firstName: string
    lastName: string
    password: string
  }
  isSubmitting: boolean
  showPassword: boolean
  isPasswordCopied: boolean
  onTogglePassword: () => void
  onGeneratePassword: () => void
  onCopyPassword: () => void
  onSubmit: (values: SignupFormValues) => Promise<void>
}

export default function SignupForm({
  form,
  values,
  isSubmitting,
  showPassword,
  isPasswordCopied,
  onTogglePassword,
  onGeneratePassword,
  onCopyPassword,
  onSubmit,
}: SignupFormProps) {
  const { direction } = useLanguage()
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
          {t('signup.accountSection')}
        </motion.h2>
        <motion.div className="grid gap-4 sm:grid-cols-2" variants={authFormFieldGridVariants}>
          <motion.div variants={authFormFieldItemVariants}>
            <FormInput
              {...register('username')}
              label={t('signup.username')}
              placeholder={t('signup.usernamePlaceholder')}
              autoComplete="username"
              error={errors.username ? t(errors.username.message ?? '') : undefined}
              success={Boolean(touchedFields.username && !errors.username && values.username.trim().length > 0)}
              successMessage={t('formInput.valid')}
            />
          </motion.div>
          <motion.div variants={authFormFieldItemVariants}>
            <FormInput
              {...register('email')}
              type="email"
              label={t('signup.email')}
              placeholder={t('signup.emailPlaceholder')}
              autoComplete="email"
              error={errors.email ? t(errors.email.message ?? '') : undefined}
              success={Boolean(touchedFields.email && !errors.email && values.email.trim().length > 0)}
              successMessage={t('formInput.valid')}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
        variants={authFormSectionVariants}
      >
        <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
          {t('signup.profileSection')}
        </motion.h2>
        <motion.div className="grid gap-4 sm:grid-cols-2" variants={authFormFieldGridVariants}>
          <motion.div variants={authFormFieldItemVariants}>
            <FormInput
              {...register('Fname')}
              label={t('signup.firstName')}
              placeholder={t('signup.firstNamePlaceholder')}
              autoComplete="given-name"
              error={errors.Fname ? t(errors.Fname.message ?? '') : undefined}
              success={Boolean(touchedFields.Fname && !errors.Fname && values.firstName.trim().length > 0)}
              successMessage={t('formInput.valid')}
            />
          </motion.div>
          <motion.div variants={authFormFieldItemVariants}>
            <FormInput
              {...register('Lname')}
              label={t('signup.lastName')}
              placeholder={t('signup.lastNamePlaceholder')}
              autoComplete="family-name"
              error={errors.Lname ? t(errors.Lname.message ?? '') : undefined}
              success={Boolean(touchedFields.Lname && !errors.Lname && values.lastName.trim().length > 0)}
              successMessage={t('formInput.valid')}
            />
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
        variants={authFormSectionVariants}
      >
        <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
            {t('signup.securitySection')}
          </h2>
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
            label={t('signup.password')}
            placeholder={t('signup.passwordPlaceholder')}
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
          <PasswordStrengthSubmit
            password={values.password}
            submitLabel={t('signup.submit')}
            isSubmitting={isSubmitting}
          />
        </motion.div>
      </motion.section>
    </motion.form>
  )
}
