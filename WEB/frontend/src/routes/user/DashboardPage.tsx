import { motion } from 'framer-motion'
import { Link, useLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../context/LanguageContext'
import { createCardVariants, createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../../libs/motionVariants'
import type { DashboardLoaderData } from '../../utils/route-utils'
import { fetchAiRecommendations, fetchDashboardSummary } from '../../libs/user-api'
import {
  AiRecommendationsSection,
  ContinueFollowingSection,
  DashboardStat,
  LearningActivitySection,
  PreferencesPreviewSection,
  StreakCard,
  SubscriptionSection
} from '../../components/dashboard/DashboardSections'

function DashboardPage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const { user } = useLoaderData() as DashboardLoaderData
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)
  const cardVariants = createCardVariants(direction)
  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  })
  const recommendationsQuery = useQuery({
    queryKey: ['dashboard', 'ai-recommendations'],
    queryFn: () => fetchAiRecommendations(6),
  })
  const summary = summaryQuery.data
  const streak = summary?.streak ?? user.loginStreak ?? { current: 0, longest: 0, lastLoginDate: null }
  const currentlyLearning = (summary?.totals.activeRoadmaps ?? 0) + (summary?.totals.activeCourses ?? 0)
  const continueRoadmaps = summary?.roadmaps?.slice(0, 4) ?? []

  return (
    <motion.main className="px-6 py-8 sm:px-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="mx-auto grid max-w-7xl gap-6" variants={staggerContainerVariants}>
        <motion.div variants={heroLineVariants} className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">{t('dashboard.overline')}</p>
            <h1 className="mt-3 text-3xl font-semibold text-(--text-h)">{t('dashboard.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text)">{t('dashboard.subtitle')}</p>
          </div>
          <Link to={`/${language}/profile`} className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {t('navbar.myProfile')}
          </Link>
        </motion.div>

        <motion.div variants={cardVariants} className="grid overflow-hidden rounded-lg border border-(--border) bg-(--surface) md:grid-cols-3">
          <DashboardStat value={summary?.totals.totalCompletedSteps ?? 0} label={t('dashboard.stats.topicsCompleted')} />
          <DashboardStat value={currentlyLearning} label={t('dashboard.stats.currentlyLearning')} />
          <DashboardStat value={`${streak.current}d`} label={t('dashboard.stats.visitStreak')} />
        </motion.div>

        <motion.div variants={staggerContainerVariants} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
          <div className="grid gap-6">
            <motion.div variants={cardVariants}>
              <ContinueFollowingSection roadmaps={continueRoadmaps} />
            </motion.div>
            <motion.div variants={cardVariants}>
              <AiRecommendationsSection data={recommendationsQuery.data} isLoading={recommendationsQuery.isLoading} />
            </motion.div>
          </div>

          <div className="grid gap-6">
            <motion.div variants={cardVariants}>
              <StreakCard current={streak.current} longest={streak.longest} />
            </motion.div>
            <motion.div variants={cardVariants}>
              <SubscriptionSection subscription={user.subscription} />
            </motion.div>
            <motion.div variants={cardVariants}>
              <PreferencesPreviewSection />
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <LearningActivitySection activities={summary?.activities ?? []} isLoading={summaryQuery.isLoading} />
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default DashboardPage
