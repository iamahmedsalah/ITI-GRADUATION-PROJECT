import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import {
  createHeroLineVariants,
  createPageVariants,
  createStaggerContainerVariants,
} from '../../libs/motionVariants'
import { adminAuthQueryKey, fetchAdminCurrentUser } from '../../libs/react-query'
import PageHeader from '../../components/ui/PageHeader'
import ProfileAvatarUploader from '../../components/profile/ProfileAvatarUploader'
import ProfileSettingsPanel from '../../components/profile/ProfileSettingsPanel'
import ProfileIdentityCard from '../../components/ui/ProfileIdentityCard'
import ProfileStatusCard from '../../components/ui/ProfileStatusCard'

export default function AdminProfilePage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)

  const { data: adminUser, isLoading } = useQuery({
    queryKey: adminAuthQueryKey,
    queryFn: fetchAdminCurrentUser,
    staleTime: 0,
  })

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section
        className="mx-auto grid max-w-7xl gap-6 rounded-3xl border border-(--border) bg-(--surface-2) p-6 shadow-(--shadow)"
        variants={staggerContainerVariants}
      >
        <PageHeader
          title={t('adminUi.profile.title', { defaultValue: 'Admin profile' })}
          subtitle={t('adminUi.profile.subtitle', { defaultValue: 'Manage your admin account identity, avatar, and security settings.' })}
          variants={heroLineVariants}
        />

        {isLoading || !adminUser ? (
          <motion.div variants={heroLineVariants} className="rounded-squircle border border-(--border) bg-(--surface) p-5 text-sm text-(--text)">
            {t('adminUi.dashboard.loading')}
          </motion.div>
        ) : (
          <>
            <motion.div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]" variants={staggerContainerVariants}>
              <motion.div variants={heroLineVariants}>
                <ProfileAvatarUploader user={adminUser} cacheQueryKey={adminAuthQueryKey} />
              </motion.div>
              <ProfileStatusCard user={adminUser} t={t} variants={heroLineVariants} />
              <ProfileIdentityCard user={adminUser} t={t} variants={heroLineVariants} />
            </motion.div>

            <ProfileSettingsPanel user={adminUser} variants={heroLineVariants} cacheQueryKey={adminAuthQueryKey} />
          </>
        )}
      </motion.section>
    </motion.main>
  )
}
