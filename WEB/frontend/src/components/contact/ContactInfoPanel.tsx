import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Album01Icon,
  Facebook01Icon,
  LinkedinIcon,
  Mail01Icon,
  MailAtSign01Icon,
  RecordIcon,
  TwitterSquareIcon,
} from '@hugeicons/core-free-icons'
import { createListItemVariants, createStaggerContainerVariants, type MotionDirection } from '../../libs/motionVariants'

type ContactInfoPanelProps = {
  direction: MotionDirection
}

const contactEmail = 'ilma.sh@outlook.com'

export default function ContactInfoPanel({ direction }: ContactInfoPanelProps) {
  const { t } = useTranslation()
  const listVariants = createStaggerContainerVariants(direction)
  const itemVariants = createListItemVariants(direction)

  return (
    <div className="grid gap-8 lg:pt-14">
      <section>
        <div className="inline-flex items-center gap-3 text-sm font-bold text-(--text-h)">
          <span className="grid size-9 place-items-center rounded-squircle bg-(--surface-2) text-(--gd-primary)">
            <HugeiconsIcon icon={Mail01Icon} size={21} />
          </span>
          <span>{t('contactPage.socialTitle')}</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-(--text-h)">
          {t('contactPage.socialText')}
        </p>

        <motion.a
          href={`mailto:${contactEmail}`}
          className="mt-7 flex min-h-12 items-center justify-center gap-3 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm font-bold text-(--text-h) transition hover:border-(--gd-primary)"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <HugeiconsIcon icon={MailAtSign01Icon} size={23} />
          <span>{contactEmail}</span>
        </motion.a>

        <div className="mt-7">
          <p className="text-xs uppercase tracking-[0.38em] text-(--gd-primary)">
            {t('contactPage.followUs')}
          </p>
          <motion.div className="mt-4 grid gap-3" variants={listVariants} initial="hidden" animate="show">
            <SocialLink href="https://twitter.com" label="Twitter" icon={TwitterSquareIcon} variants={itemVariants} />
            <SocialLink href="https://linkedin.com" label="LinkedIn" icon={LinkedinIcon} variants={itemVariants} />
            <SocialLink href="https://facebook.com" label="Facebook" icon={Facebook01Icon} variants={itemVariants} />
          </motion.div>
        </div>
      </section>

      <section className="grid gap-5 rounded-[28px] border border-(--border) bg-(--surface-2) p-5 sm:p-6">
        <div>
          <h2 className="inline-flex items-center gap-3 text-[22px] leading-none text-(--text-h)">
            <HugeiconsIcon icon={Album01Icon} size={25} className="text-(--gd-primary)" />
            {t('contactPage.missionTitle')}
          </h2>
          <p className="mt-4 text-sm leading-7 text-(--text-h)">
            {t('contactPage.missionText')}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-(--text-h)">
            {t('contactPage.valuesTitle')}
          </h3>
          <ul className="mt-4 grid gap-3 text-sm text-(--text-h)">
            {[
              t('contactPage.values.support'),
              t('contactPage.values.accessible'),
              t('contactPage.values.clear'),
            ].map((value) => (
              <li key={value} className="flex items-center gap-2">
                <HugeiconsIcon icon={RecordIcon} size={15} className="text-(--gd-primary)" />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

type SocialLinkProps = {
  href: string
  label: string
  icon: typeof TwitterSquareIcon
  variants: ReturnType<typeof createListItemVariants>
}

function SocialLink({ href, label, icon, variants }: SocialLinkProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      variants={variants}
      whileHover={{ y: -2, borderColor: 'var(--gd-primary)' }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex min-h-12 items-center gap-3 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm font-bold text-(--text-h) transition"
    >
      <HugeiconsIcon icon={icon} size={22} />
      <span>{label}</span>
    </motion.a>
  )
}
