import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  MailSend01Icon,
  SentIcon,
} from '@hugeicons/core-free-icons'
import type { ContactFormValues } from '../../hooks/useContactForm'
import { contactSendIconVariants } from '../../libs/motionVariants'
import FormInput from '../ui/Input'

type ContactFormProps = {
  form: UseFormReturn<ContactFormValues>
  values: ContactFormValues
  isSubmitting: boolean
  isSent: boolean
  onSubmit: (values: ContactFormValues) => Promise<void>
}

export default function ContactForm({
  form,
  values,
  isSubmitting,
  isSent,
  onSubmit,
}: ContactFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = form

  const buttonLabel = isSubmitting
    ? t('contactPage.form.sending')
    : isSent
      ? t('contactPage.form.sent')
      : t('contactPage.form.submit')

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5 rounded-[30px] border border-(--border) bg-(--surface-2) p-5 shadow-[0_22px_55px_rgba(0,0,0,0.22)] sm:p-6"
    >
      <div>
        <h2 className="text-[22px] leading-none text-(--text-h) sm:text-2xl">
          {t('contactPage.contactTitle')}
        </h2>
        <p className="mt-4 text-sm leading-6 text-(--text-h)">
          {t('contactPage.contactDescription')}
        </p>
      </div>

      <div className="grid gap-4">
        <FormInput
          {...register('name')}
          label={t('contactPage.form.name')}
          placeholder={t('contactPage.form.namePlaceholder')}
          autoComplete="name"
          className="border-black/20 bg-(--surface)!"
          error={errors.name ? t(errors.name.message ?? '') : undefined}
          success={Boolean(touchedFields.name && !errors.name && values.name.trim().length > 0)}
        />

        <FormInput
          {...register('email')}
          type="email"
          label={t('contactPage.form.email')}
          placeholder={t('contactPage.form.emailPlaceholder')}
          autoComplete="email"
          className="border-black/20 bg-(--surface)!"
          error={errors.email ? t(errors.email.message ?? '') : undefined}
          success={Boolean(touchedFields.email && !errors.email && values.email.trim().length > 0)}
        />

        <label className="grid gap-2 text-start text-sm font-medium text-(--text-h)">
          {t('contactPage.form.message')}
          <textarea
            {...register('message')}
            placeholder={t('contactPage.form.messagePlaceholder')}
            rows={5}
            className={`min-h-28 w-full rounded-3xl border bg-(--surface) px-4 py-3 text-start text-sm text-(--text-h) outline-none transition focus:ring-2 placeholder:text-(--text) ${
              errors.message
                ? 'border-red-500 focus:border-red-400 focus:ring-red-500/25'
                : 'border-black/20 focus:border-(--gd-primary) focus:ring-[rgba(29,185,84,0.25)]'
            }`}
          />
          {errors.message ? (
            <span className="text-start text-xs text-(--error)">
              {t(errors.message.message ?? '')}
            </span>
          ) : null}
        </label>
      </div>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        className="relative mt-1 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-bold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-wait disabled:opacity-80"
        whileHover={{ y: isSubmitting ? 0 : -1 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isSent ? 'sent' : isSubmitting ? 'sending' : 'idle'}
            variants={contactSendIconVariants}
            initial="idle"
            animate={isSent ? 'sent' : isSubmitting ? 'sending' : 'idle'}
            exit={{ opacity: 0, scale: 0.85 }}
            className="grid size-5 place-items-center"
          >
            <HugeiconsIcon
              icon={isSent ? CheckmarkCircle01Icon : isSubmitting ? SentIcon : MailSend01Icon}
              size={20}
            />
          </motion.span>
        </AnimatePresence>
        <span>{buttonLabel}</span>
      </motion.button>
    </form>
  )
}
