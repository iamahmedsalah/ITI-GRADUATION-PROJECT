import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import type { VerifyEmailFormValues } from '../../hooks/useVerifyEmailPage'
import {
  authFormFieldItemVariants,
  authFormSectionVariants,
  authFormVariants,
} from '../../libs/motionVariants'
import FormInput from '../ui/Input'

type VerifyEmailFormProps = {
  form: UseFormReturn<VerifyEmailFormValues>
  direction: 'ltr' | 'rtl'
  codeValue: string
  oauthVerified: boolean
  oauthProvider: string
  isSubmitting: boolean
  isResending: boolean
  canResend: boolean
  isCoolingDown: boolean
  cooldownLabel: string
  onResendCode: () => Promise<void>
  onContinue: () => void
  onSubmit: (values: VerifyEmailFormValues) => Promise<void>
}

export default function VerifyEmailForm({
  form,
  direction,
  codeValue,
  oauthVerified,
  oauthProvider,
  isSubmitting,
  isResending,
  canResend,
  isCoolingDown,
  cooldownLabel,
  onResendCode,
  onContinue,
  onSubmit,
}: VerifyEmailFormProps) {
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
      {oauthVerified ? (
        <motion.section
          className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
          variants={authFormSectionVariants}
        >
          <motion.h2 variants={authFormFieldItemVariants} className="text-sm font-semibold uppercase tracking-[0.14em] text-(--text)">
            {t('verify.oauthVerifiedTitle')}
          </motion.h2>

          <motion.p variants={authFormFieldItemVariants} className="text-sm leading-6 text-(--text)">
            {t('verify.oauthVerifiedMessage', { provider: t(`signup.social.${oauthProvider}`) })}
          </motion.p>

          <motion.div variants={authFormFieldItemVariants} className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-2xl bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t('verify.continueToDashboard')}
            </button>
          </motion.div>
        </motion.section>
      ) : (
        <>
          <motion.section
            className="grid gap-4 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 sm:p-5"
            variants={authFormSectionVariants}
          >
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
            <p className="text-center">{t('verify.noCode')} </p>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3">
              <div>
                <p className="font-medium text-(--text-h)">{t('verify.resendTitle')}</p>
                <p className="text-xs text-(--text)">
                  {isCoolingDown ? t('verify.resendWait', { time: cooldownLabel }) : t('verify.resendPrompt')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void onResendCode()}
                disabled={!canResend || isCoolingDown || isResending}
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
  )
}
