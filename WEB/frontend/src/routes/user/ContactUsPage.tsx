import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ContactForm from '../../components/contact/ContactForm'
import ContactInfoPanel from '../../components/contact/ContactInfoPanel'
import { useLanguage } from '../../context/LanguageContext'
import { useContactForm } from '../../hooks/useContactForm'
import {
  createContactPanelVariants,
  createHeroLineVariants,
  createPageVariants,
} from '../../libs/motionVariants'

export default function ContactUsPage() {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const contactForm = useContactForm()
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const formPanelVariants = createContactPanelVariants(direction, 'form')
  const infoPanelVariants = createContactPanelVariants(direction, 'info')

  return (
    <motion.main
      className="min-h-screen bg-(--bg) px-4 py-10 text-(--text-h) sm:px-6 lg:px-8"
      dir={direction}
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.section
        className="mx-auto max-w-6xl rounded-[30px] border border-(--border) bg-(--surface) p-6 shadow-[0_34px_95px_rgba(0,0,0,0.3)] sm:p-8 lg:p-9"
        variants={heroLineVariants}
      >
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div variants={formPanelVariants} className="grid content-start gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.56em] text-(--gd-primary)">
                {t('contactPage.overline')}
              </p>
              <h1 className="mt-8 mb-0 text-[42px] leading-none tracking-normal text-(--text-h) sm:text-5xl">
                {t('contactPage.title')}
              </h1>
              <p className="mt-8 max-w-xl text-sm leading-7 text-(--text-h)">
                {t('contactPage.subtitle')}
              </p>
            </div>

            <ContactForm
              form={contactForm.form}
              values={contactForm.values}
              isSubmitting={contactForm.isSubmitting}
              isSent={contactForm.isSent}
              onSubmit={contactForm.onSubmit}
            />
          </motion.div>

          <motion.div variants={infoPanelVariants}>
            <ContactInfoPanel direction={direction} />
          </motion.div>
        </div>
      </motion.section>
    </motion.main>
  )
}
