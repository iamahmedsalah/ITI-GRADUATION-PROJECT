import { lazy, Suspense } from 'react'
import { useLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CodeIcon,
  Html5Icon,
  Css3Icon,
  ReactIcon,
  DatabaseIcon,
  GithubIcon,
  FigmaIcon,
  CpuIcon,
  GitlabIcon,
} from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../../libs/motionVariants'

import type { ProfileLoaderData } from '../../utils/route-utils'

import PageHeader from '../../components/ui/PageHeader'

const ProfileSettingsPanel = lazy(() => import('../../components/profile/ProfileSettingsPanel'))
const ProfileAvatarUploader = lazy(() => import('../../components/profile/ProfileAvatarUploader'))
const ProfileStatusCard = lazy(() => import('../../components/ui/ProfileStatusCard'))

function ProfileSectionFallback({ className = 'min-h-36' }: { className?: string }) {
  return (
    <div className={`rounded-3xl border border-(--border) bg-(--surface) p-5 sm:p-6 ${className}`}>
      <div className="h-4 w-36 rounded-full bg-(--surface-2)" />
      <div className="mt-4 grid gap-3">
        <div className="h-12 rounded-squircle bg-(--surface-2)" />
        <div className="h-12 rounded-squircle bg-(--surface-2)" />
      </div>
    </div>
  )
}

function ProfilePage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const { user } = useLoaderData() as ProfileLoaderData
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)



  return (
    <motion.main className="px-6 py-8 sm:px-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="mx-auto grid max-w-7xl gap-6 rounded-2xl border border-(--border) bg-(--surface-soft) p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:p-6" variants={staggerContainerVariants}>
        <PageHeader
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
          variants={heroLineVariants}
        />

        <motion.div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.75fr)]" variants={staggerContainerVariants}>
          <div>
            <Suspense fallback={<ProfileSectionFallback />}>
              <ProfileAvatarUploader user={user} />
            </Suspense>
            <TechSkillsBanner />
          </div>
          <Suspense fallback={<ProfileSectionFallback />}>
            <ProfileStatusCard user={user} t={t} variants={heroLineVariants} />
          </Suspense>
        </motion.div>

        <Suspense fallback={<ProfileSectionFallback className="min-h-96" />}>
          <ProfileSettingsPanel user={user} variants={heroLineVariants} />
        </Suspense>
      </motion.section>
    </motion.main>
  )
}

export default ProfilePage

function TechSkillsBanner() {
  const { t } = useTranslation()
  const skillIcons = [
    { icon: CodeIcon, label: 'Code' },
    { icon: Html5Icon, label: 'HTML5' },
    { icon: Css3Icon, label: 'CSS3' },
    { icon: ReactIcon, label: 'React' },
    { icon: DatabaseIcon, label: 'Database' },
    { icon: GithubIcon, label: 'GitHub' },
    { icon: FigmaIcon, label: 'Figma' },
    { icon: CpuIcon, label: 'CPU' },
    { icon: GitlabIcon, label: 'GitLab' },
  ]

  // Stagger jumping animations
  const iconVariants = (index: number) => ({
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.15,
      } as const,
    },
  })

  // Duplicate the list to allow infinite marquee scrolling
  const marqueeItems = [...skillIcons, ...skillIcons, ...skillIcons]

  return (
    <div className="relative mt-5 overflow-hidden rounded-4xl border border-(--border) bg-(--surface) py-4">
      {/* Title */}
      <p className="px-5 text-xs font-semibold uppercase tracking-[0.14em] text-(--text) mb-3">
        {t('profile.skills.title', 'Skills & Technologies')}
      </p>

      {/* Marquee Row */}
      <div className="flex w-full mt-5  overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
        <motion.div
          className="flex gap-8 shrink-0 min-w-full"
          animate={{ x: ['-50%', '0%'] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 15,
          }}
        >
          {marqueeItems.map((skill, index) => {
            const IconComp = skill.icon
            return (
              <div
                key={index}
                className="flex shrink-0 flex-col items-center gap-1.5"
              >
                <motion.div
                  variants={iconVariants(index)}
                  animate="animate"
                  className="grid size-12 place-items-center rounded-squircle bg-(--surface-2) border border-(--border) text-(--accent) shadow-sm"
                >
                  <HugeiconsIcon icon={IconComp} size={22} />
                </motion.div>
                <span className="text-[10px] font-medium text-(--text)">
                  {skill.label}
                </span>
              </div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}



