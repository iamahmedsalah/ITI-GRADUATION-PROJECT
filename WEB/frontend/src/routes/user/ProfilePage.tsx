import { useLoaderData} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import { createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../../libs/motionVariants'

import type { ProfileLoaderData } from '../../utils/route-utils'

import PageHeader from '../../components/ui/PageHeader'
import ProfileSettingsPanel from '../../components/profile/ProfileSettingsPanel'
import ProfileAvatarUploader from '../../components/profile/ProfileAvatarUploader'
import ProfileStatusCard from '../../components/ui/ProfileStatusCard'

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
          <motion.div variants={heroLineVariants}>
            <ProfileAvatarUploader user={user} />
          </motion.div>
          <ProfileStatusCard user={user} t={t} variants={heroLineVariants} />
        </motion.div>

        <ProfileSettingsPanel user={user} variants={heroLineVariants} />
      </motion.section>
    </motion.main>
  )
}

export default ProfilePage



