import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Link, useLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../context/LanguageContext'
import { createCardVariants, createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../../libs/motionVariants'
import type { DashboardLoaderData } from '../../utils/route-utils'
import { fetchAiRecommendations, fetchDashboardSummary } from '../../libs/user-api'

const LearningConstellation = lazy(() => import('../../components/dashboard/LearningConstellation'))
const loadDashboardSections = () => import('../../components/dashboard/DashboardSections')
const SavedRoadmapsSection = lazy(() => loadDashboardSections().then((module) => ({ default: module.SavedRoadmapsSection })))
const ContinueFollowingSection = lazy(() => loadDashboardSections().then((module) => ({ default: module.ContinueFollowingSection })))
const AiRecommendationsSection = lazy(() => loadDashboardSections().then((module) => ({ default: module.AiRecommendationsSection })))
const StreakCard = lazy(() => loadDashboardSections().then((module) => ({ default: module.StreakCard })))
const SubscriptionSection = lazy(() => loadDashboardSections().then((module) => ({ default: module.SubscriptionSection })))
const PreferencesPreviewSection = lazy(() => loadDashboardSections().then((module) => ({ default: module.PreferencesPreviewSection })))
const LearningActivitySection = lazy(() => loadDashboardSections().then((module) => ({ default: module.LearningActivitySection })))

function DashboardStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="grid min-h-25 place-items-center border-r border-(--border) px-2 py-4 text-center last:border-r-0 sm:min-h-32 sm:px-4 sm:py-6">
      <strong className="text-3xl font-semibold leading-none text-(--text-h) sm:text-5xl">{value}</strong>
      <span className="mt-2 text-[11px] leading-4 text-(--text) sm:mt-3 sm:text-sm">{label}</span>
    </div>
  )
}

function SectionFallback({ className = 'min-h-40' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-(--border) bg-(--surface) p-5 ${className}`}>
      <div className="h-4 w-36 rounded-full bg-(--surface-2)" />
      <div className="mt-4 grid gap-3">
        <div className="h-12 rounded-lg bg-(--surface-2)" />
        <div className="h-12 rounded-lg bg-(--surface-2)" />
      </div>
    </div>
  )
}

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
  const savedRoadmaps = summary?.roadmaps?.filter((roadmap) => roadmap.status === 'assigned').slice(0, 4) ?? []
  const continueRoadmaps = summary?.roadmaps?.filter((roadmap) => roadmap.status !== 'assigned').slice(0, 4) ?? []

  return (
    <motion.main className="px-4 py-5 sm:px-8 sm:py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="mx-auto grid max-w-7xl gap-4 sm:gap-6" variants={staggerContainerVariants}>
        <motion.div variants={heroLineVariants} className="grid gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--accent) sm:text-xs sm:tracking-[0.22em]">{t('dashboard.overline')}</p>
            <h1 className="mt-3 text-2xl font-semibold text-(--text-h) sm:text-3xl">{t('dashboard.title')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-(--text) sm:text-sm sm:leading-6">{t('dashboard.subtitle')}</p>
          </div>
          <Link to={`/${language}/profile`} className="w-fit rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {t('navbar.myProfile')}
          </Link>
        </motion.div>

        <motion.div variants={cardVariants} className="grid grid-cols-3 overflow-hidden rounded-squircle border border-(--border) bg-(--surface)">
          <DashboardStat value={summary?.totals.totalCompletedSteps ?? 0} label={t('dashboard.stats.topicsCompleted')} />
          <DashboardStat value={currentlyLearning} label={t('dashboard.stats.currentlyLearning')} />
          <DashboardStat value={`${streak.current}d`} label={t('dashboard.stats.visitStreak')} />
        </motion.div>

        <motion.div variants={cardVariants}>
          <Suspense fallback={<div className="min-h-[23rem] border-y border-(--border) bg-[#101311]" />}>
            <LearningConstellation
              roadmaps={summary?.roadmaps ?? []}
              courses={summary?.courses ?? []}
              recommendations={recommendationsQuery.data}
            />
          </Suspense>
        </motion.div>

        <motion.div variants={staggerContainerVariants} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
          <div className="grid gap-6">
            {savedRoadmaps.length ? (
              <motion.div variants={cardVariants}>
                <Suspense fallback={<SectionFallback />}>
                  <SavedRoadmapsSection roadmaps={savedRoadmaps} />
                </Suspense>
              </motion.div>
            ) : null}
            <motion.div variants={cardVariants}>
              <Suspense fallback={<SectionFallback />}>
                <ContinueFollowingSection roadmaps={continueRoadmaps} />
              </Suspense>
            </motion.div>
            <motion.div variants={cardVariants}>
              <Suspense fallback={<SectionFallback className="min-h-56" />}>
                <AiRecommendationsSection data={recommendationsQuery.data} isLoading={recommendationsQuery.isLoading} />
              </Suspense>
            </motion.div>
          </div>

          <div className="grid gap-6">
            <motion.div variants={cardVariants}>
              <Suspense fallback={<SectionFallback />}>
                <StreakCard current={streak.current} longest={streak.longest} />
              </Suspense>
            </motion.div>
            <motion.div variants={cardVariants}>
              <Suspense fallback={<SectionFallback />}>
                <SubscriptionSection subscription={user.subscription} />
              </Suspense>
            </motion.div>
            <motion.div variants={cardVariants}>
              <Suspense fallback={<SectionFallback />}>
                <PreferencesPreviewSection />
              </Suspense>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Suspense fallback={<SectionFallback className="min-h-72" />}>
            <LearningActivitySection activities={summary?.activities ?? []} isLoading={summaryQuery.isLoading} />
          </Suspense>
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default DashboardPage
