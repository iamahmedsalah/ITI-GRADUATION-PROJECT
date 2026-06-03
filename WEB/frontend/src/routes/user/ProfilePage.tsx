import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../../context/LanguageContext'
import { createCardVariants, createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../../libs/motionVariants'
import { clearAccessToken } from '../../utils/api'
import type { ProfileLoaderData } from '../../utils/route-utils'
import { authQueryKey, logoutCurrentUser } from '../../libs/react-query'
import { useUserRoadmapProgress } from '../../hooks/useUserRoadmapProgress'

import PageHeader from '../../components/ui/PageHeader'
import ProfileIdentityCard from '../../components/ui/ProfileIdentityCard'
import ProfileStatusCard from '../../components/ui/ProfileStatusCard'
import RoadmapProgressList from '../../components/ui/RoadmapProgressList'

function ProfilePage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useLoaderData() as ProfileLoaderData
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)
  const cardVariants = createCardVariants(direction)
  const roadmapsQuery = useUserRoadmapProgress()

  const logoutMutation = useMutation({
    mutationFn: logoutCurrentUser,
    onSuccess: async () => {
      clearAccessToken()
      queryClient.setQueryData(authQueryKey, null)
      toast.success(t('auth.logoutSuccess'))
      navigate(`/${language}/login`, { replace: true })
    },
    onError: () => {
      clearAccessToken()
      toast.error(t('auth.logoutFailed'))
      navigate(`/${language}/login`, { replace: true })
    },
  })

  return (
    <motion.main className="px-8 py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="grid gap-6 rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)]" variants={staggerContainerVariants}>
        <PageHeader
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
          variants={heroLineVariants}
          actions={(
            <>
              <Link to={`/${language}/dashboard`} className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">{t('layout.dashboard')}</Link>
              <Link to={`/${language}/roadmaps/frontend`} className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">{t('navbar.roadmaps')}</Link>
              <button type="button" onClick={() => logoutMutation.mutate()} className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">{t('navbar.logout')}</button>
            </>
          )}
        />

        <motion.div className="grid gap-4 md:grid-cols-2" variants={staggerContainerVariants}>
          <ProfileIdentityCard user={user} t={(k) => t(k)} variants={cardVariants} />
          <ProfileStatusCard user={user} t={(k) => t(k)} variants={cardVariants} />
        </motion.div>

        <motion.div variants={heroLineVariants} className="rounded-lg border border-(--border) bg-(--surface) p-5">
          <h2 className="text-lg font-semibold text-(--text-h)">{t('profile.roadmapsTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-(--text)">{t('profile.roadmapsSubtitle')}</p>
          <div className="mt-5">
            {roadmapsQuery.isLoading ? (
              <div className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text)">
                {t('profile.roadmapsLoading')}
              </div>
            ) : (
              <RoadmapProgressList roadmaps={roadmapsQuery.data ?? []} />
            )}
          </div>
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default ProfilePage



