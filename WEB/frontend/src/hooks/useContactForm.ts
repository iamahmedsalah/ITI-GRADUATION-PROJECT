import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useLanguage } from '../context/LanguageContext'
import { sendContactRequest } from '../libs/contact-api'
import { contactSchema } from '../types/validationSchemas'
import { getBackendResponseMessage } from '../utils/backendResponseMessage'

export type ContactFormValues = z.infer<typeof contactSchema>

const fieldNameByBackendPath: Record<string, keyof ContactFormValues> = {
  name: 'name',
  email: 'email',
  message: 'message',
  'body.name': 'name',
  'body.email': 'email',
  'body.message': 'message',
}

export function useContactForm() {
  const { direction, language } = useLanguage()
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const sentResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm<ContactFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  })

  const nameValue = useWatch({ control: form.control, name: 'name' }) ?? ''
  const emailValue = useWatch({ control: form.control, name: 'email' }) ?? ''
  const messageValue = useWatch({ control: form.control, name: 'message' }) ?? ''

  const onSubmit = useCallback(
    async (values: ContactFormValues) => {
      setIsSubmitting(true)
      setIsSent(false)

      try {
        const { response, data } = await sendContactRequest(values)

        if (!response.ok) {
          const backendField = data.errors?.[0]?.field
          const formField = backendField ? fieldNameByBackendPath[backendField] : undefined
          const message = getBackendResponseMessage(response, data, {
            fallbackKey: 'contactPage.form.failed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          })

          if (formField) {
            form.setError(formField, { type: 'server', message })
          }

          toast.error(message)
          return
        }

        form.reset()
        setIsSent(true)
        toast.success(t('contactPage.form.success'))

        if (sentResetTimeoutRef.current) {
          clearTimeout(sentResetTimeoutRef.current)
        }

        sentResetTimeoutRef.current = setTimeout(() => {
          setIsSent(false)
        }, 2600)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('contactPage.form.failed'))
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, language, t],
  )

  useEffect(() => {
    return () => {
      if (sentResetTimeoutRef.current) {
        clearTimeout(sentResetTimeoutRef.current)
      }
    }
  }, [])

  return {
    direction,
    form,
    values: {
      name: nameValue,
      email: emailValue,
      message: messageValue,
    },
    isSubmitting,
    isSent,
    onSubmit,
  }
}
