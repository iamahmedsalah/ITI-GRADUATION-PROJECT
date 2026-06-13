import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import FormInput from '../ui/Input'
import { authQueryKey } from '../../libs/react-query'
import { updateCurrentUserPassword, updateCurrentUserProfile } from '../../libs/user-api'
import type { AuthUser } from '../../utils/route-utils'
import PasswordActions from '../ui/passwordActions'
import PasswordStrength from '../ui/passwordStrength'
import PasswordVisibilityToggle from '../ui/passwordVisibilityToggle'
import { generateStrongPassword } from '../../utils/passwordGenerator'
import { resetPasswordSchema, signupSchema } from '../../types/validationSchemas'

type ProfileSettingsPanelProps = {
  user: AuthUser
  variants?: Variants
  cacheQueryKey?: readonly unknown[]
}

const profileSettingsSchema = signupSchema.pick({
  username: true,
  Fname: true,
  Lname: true,
})
const passwordSettingsSchema = resetPasswordSchema.extend({
  currentPassword: signupSchema.shape.password,
})

export default function ProfileSettingsPanel({ user, variants, cacheQueryKey = authQueryKey }: ProfileSettingsPanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [profileForm, setProfileForm] = useState({
    username: user.username,
    Fname: user.Fname ?? user.name.split(' ')[0] ?? '',
    Lname: user.Lname ?? user.name.split(' ').slice(1).join(' ') ?? '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isPasswordCopied, setIsPasswordCopied] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const savedProfileForm = {
    username: user.username,
    Fname: user.Fname ?? user.name.split(' ')[0] ?? '',
    Lname: user.Lname ?? user.name.split(' ').slice(1).join(' ') ?? '',
  }

  const profileMutation = useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: (updatedUser) => {
      setProfileForm({
        username: updatedUser.username,
        Fname: updatedUser.Fname ?? updatedUser.name.split(' ')[0] ?? '',
        Lname: updatedUser.Lname ?? updatedUser.name.split(' ').slice(1).join(' ') ?? '',
      })
      queryClient.setQueryData(cacheQueryKey, updatedUser)
      queryClient.setQueryData(authQueryKey, updatedUser)
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      setIsEditingProfile(false)
      toast.success(t('profile.settings.profileSaved'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('profile.settings.profileFailed'))
    },
  })

  const passwordMutation = useMutation({
    mutationFn: updateCurrentUserPassword,
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success(t('profile.settings.passwordSaved'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('profile.settings.passwordFailed'))
    },
  })

  const profileValidation = profileSettingsSchema.safeParse(profileForm)
  const passwordValidation = passwordSettingsSchema.safeParse({
    currentPassword: passwordForm.currentPassword,
    password: passwordForm.newPassword,
    confirmPassword: passwordForm.confirmPassword,
  })
  const profileErrors = profileValidation.success
    ? {}
    : Object.fromEntries(profileValidation.error.issues.map((issue) => [issue.path[0], t(issue.message)]))
  const passwordErrors = passwordValidation.success
    ? {}
    : Object.fromEntries(passwordValidation.error.issues.map((issue) => [issue.path[0], t(issue.message)]))

  const markTouched = (field: string) => {
    setTouchedFields((current) => ({ ...current, [field]: true }))
  }

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setPasswordForm((current) => ({
      ...current,
      newPassword: generated,
      confirmPassword: generated,
    }))
    setTouchedFields((current) => ({ ...current, password: true, confirmPassword: true }))
    setIsPasswordCopied(false)
    toast.success(t('passwordTools.generated'))
  }

  const handleCopyPassword = async () => {
    if (!passwordForm.newPassword) {
      toast.info(t('passwordTools.empty'))
      return
    }

    try {
      await navigator.clipboard.writeText(passwordForm.newPassword)
      setIsPasswordCopied(true)
      toast.success(t('passwordTools.copied'))
    } catch {
      toast.error(t('passwordTools.copyFailed'))
    }
  }

  return (
    <motion.section variants={variants} className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form
        className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface) p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault()

          if (!isEditingProfile) {
            setIsEditingProfile(true)
            return
          }

          if (!profileValidation.success) {
            setTouchedFields((current) => ({ ...current, username: true, Fname: true, Lname: true }))
            toast.error(t(profileValidation.error.issues[0]?.message ?? 'auth.validationFailed'))
            return
          }

          profileMutation.mutate({
            username: profileForm.username.trim(),
            Fname: profileForm.Fname.trim(),
            Lname: profileForm.Lname.trim(),
          })
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-(--text-h)">{t('profile.settings.profileTitle')}</h2>
            <p className="mt-1 text-sm leading-6 text-(--text)">{t('profile.settings.profileSubtitle')}</p>
          </div>
          {isEditingProfile ? (
            <button
              type="button"
              className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2)"
              onClick={() => {
                setProfileForm(savedProfileForm)
                setTouchedFields((current) => ({ ...current, username: false, Fname: false, Lname: false }))
                setIsEditingProfile(false)
              }}
            >
              {t('profile.settings.cancelEdit', 'Cancel')}
            </button>
          ) : null}
        </div>
        <FormInput
          label={t('profile.username')}
          value={profileForm.username}
          disabled={!isEditingProfile}
          onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
          onBlur={() => markTouched('username')}
          autoComplete="username"
          className={!isEditingProfile ? 'bg-(--surface-2) text-(--text)!' : ''}
          error={touchedFields.username && profileErrors.username ? String(profileErrors.username) : undefined}
          success={Boolean(touchedFields.username && !profileErrors.username && profileForm.username.trim())}
          successMessage={t('formInput.valid')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label={t('signup.firstName')}
            value={profileForm.Fname}
            disabled={!isEditingProfile}
            onChange={(event) => setProfileForm((current) => ({ ...current, Fname: event.target.value }))}
            onBlur={() => markTouched('Fname')}
            autoComplete="given-name"
            className={!isEditingProfile ? 'bg-(--surface-2) text-(--text)!' : ''}
            error={touchedFields.Fname && profileErrors.Fname ? String(profileErrors.Fname) : undefined}
            success={Boolean(touchedFields.Fname && !profileErrors.Fname && profileForm.Fname.trim())}
            successMessage={t('formInput.valid')}
          />
          <FormInput
            label={t('signup.lastName')}
            value={profileForm.Lname}
            disabled={!isEditingProfile}
            onChange={(event) => setProfileForm((current) => ({ ...current, Lname: event.target.value }))}
            onBlur={() => markTouched('Lname')}
            autoComplete="family-name"
            className={!isEditingProfile ? 'bg-(--surface-2) text-(--text)!' : ''}
            error={touchedFields.Lname && profileErrors.Lname ? String(profileErrors.Lname) : undefined}
            success={Boolean(touchedFields.Lname && !profileErrors.Lname && profileForm.Lname.trim())}
            successMessage={t('formInput.valid')}
          />
        </div>
        <button
          type="submit"
          disabled={profileMutation.isPending}
          className="rounded-squircle bg-(--gd-primary) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {profileMutation.isPending
            ? t('profile.settings.saving')
            : isEditingProfile
              ? t('profile.settings.updateProfile', 'Update profile')
              : t('profile.settings.editProfile', 'Edit profile')}
        </button>
      </form>

      <form
        className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface) p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault()

          if (!passwordValidation.success) {
            setTouchedFields((current) => ({
              ...current,
              currentPassword: true,
              password: true,
              confirmPassword: true,
            }))
            toast.error(t(passwordValidation.error.issues[0]?.message ?? 'auth.validationFailed'))
            return
          }

          passwordMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          })
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-(--text-h)">{t('profile.settings.passwordTitle')}</h2>
          <p className="mt-1 text-sm leading-6 text-(--text)">{t('profile.settings.passwordSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">{t('signup.securitySection')}</span>
          <PasswordActions
            onGenerate={handleGeneratePassword}
            onCopy={handleCopyPassword}
            generateLabel={t('passwordTools.generate')}
            copyLabel={t('passwordTools.copy')}
            copiedLabel={t('passwordTools.copiedState')}
            copied={isPasswordCopied}
            generateAriaLabel={t('passwordTools.generateAria')}
            copyAriaLabel={t('passwordTools.copyAria')}
            copyDisabled={!passwordForm.newPassword}
          />
        </div>
        <FormInput
          label={t('profile.settings.currentPassword')}
          value={passwordForm.currentPassword}
          onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
          onBlur={() => markTouched('currentPassword')}
          type={showCurrentPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={touchedFields.currentPassword && passwordErrors.currentPassword ? String(passwordErrors.currentPassword) : undefined}
          rightAdornment={
            <PasswordVisibilityToggle
              visible={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((current) => !current)}
              showLabel={t('passwordToggle.show')}
              hideLabel={t('passwordToggle.hide')}
            />
          }
          className="pr-11"
        />
        <FormInput
          label={t('profile.settings.newPassword')}
          value={passwordForm.newPassword}
          onChange={(event) => {
            setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
            setIsPasswordCopied(false)
          }}
          onBlur={() => markTouched('password')}
          type={showNewPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={touchedFields.password && passwordErrors.password ? String(passwordErrors.password) : undefined}
          success={Boolean(touchedFields.password && !passwordErrors.password && passwordForm.newPassword)}
          successMessage={t('formInput.valid')}
          rightAdornment={
            <PasswordVisibilityToggle
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((current) => !current)}
              showLabel={t('passwordToggle.show')}
              hideLabel={t('passwordToggle.hide')}
            />
          }
          className="pr-11"
        />
        <FormInput
          label={t('reset.confirmPassword')}
          value={passwordForm.confirmPassword}
          onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          onBlur={() => markTouched('confirmPassword')}
          type={showNewPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={touchedFields.confirmPassword && passwordErrors.confirmPassword ? String(passwordErrors.confirmPassword) : undefined}
          success={Boolean(touchedFields.confirmPassword && !passwordErrors.confirmPassword && passwordForm.confirmPassword)}
          successMessage={t('formInput.valid')}
        />
        <PasswordStrength
          password={passwordForm.newPassword}
          submitLabel={t('profile.settings.savePassword')}
          isSubmitting={passwordMutation.isPending}
        />
      </form>
    </motion.section>
  )
}
