import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare03Icon, Route03Icon, UserEdit01Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import {
  createHeroLineVariants,
  createPageVariants,
  createStaggerContainerVariants,
} from '../../libs/motionVariants'
import { fetchAdminOverview } from '../../libs/admin-api'

function MetricCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: number | string
  helper: string
  icon: typeof UserEdit01Icon
}) {
  return (
    <article className="rounded-squircle border border-(--border) bg-(--surface) p-4 shadow-(--shadow)">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text)">{label}</p>
        <span className="grid size-9 place-items-center rounded-squircle bg-(--accent-bg) text-(--gd-primary)">
          <HugeiconsIcon icon={icon} size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-(--text-h)">{value}</p>
      <p className="mt-2 text-sm leading-5 text-(--text)">{helper}</p>
    </article>
  )
}

function AdminDashboardPage() {
  const { direction, language } = useLanguage()
  const { t } = useTranslation()
  const [now, setNow] = useState(() => new Date())
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)

  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: fetchAdminOverview,
    staleTime: 0,
  })

  const roadmapsTotal = overview?.roadmaps.templatesTotal ?? 0
  const coursesTotal = overview?.courses.total ?? 0
  const onlineUsers = overview?.users.online ?? 0
  const activeUsers = overview?.users.active ?? 0
  const liveDate = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(now),
    [language, now],
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section
        className="grid gap-6 rounded-3xl border border-(--border) bg-(--surface-2) p-6 shadow-(--shadow)"
        variants={staggerContainerVariants}
      >
        <motion.div variants={heroLineVariants} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.dashboard.overline')}</p>
            <h2 className="mt-2 text-3xl font-bold text-(--text-h)">{t('adminUi.dashboard.title')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text)">
              {t('adminUi.dashboard.subtitle')}
            </p>
          </div>
          <div className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--text-h)">
            {isLoading ? t('adminUi.dashboard.loading') : liveDate}
          </div>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" variants={staggerContainerVariants}>
          <MetricCard
            label={t('adminUi.dashboard.metrics.activeUsers')}
            value={activeUsers}
            helper={t('adminUi.dashboard.metrics.activeUsersHint')}
            icon={UserEdit01Icon}
          />
          <MetricCard
            label={t('adminUi.dashboard.metrics.onlineUsers')}
            value={onlineUsers}
            helper={t('adminUi.dashboard.metrics.onlineUsersHint')}
            icon={DashboardSquare03Icon}
          />
          <MetricCard
            label={t('adminUi.tabs.roadmaps')}
            value={roadmapsTotal}
            helper={t('adminUi.tabs.roadmapsHint')}
            icon={Route03Icon}
          />
          <MetricCard
            label={t('adminUi.tabs.courses')}
            value={coursesTotal}
            helper={t('adminUi.tabs.coursesHint')}
            icon={DashboardSquare03Icon}
          />
        </motion.div>

        <motion.div variants={heroLineVariants} className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl bg-(--surface) p-5">
            <h3 className="text-lg font-semibold text-(--text-h)">{t('adminUi.dashboard.panelUsers')}</h3>
            <p className="mt-2 text-sm text-(--text)">
              {t('adminUi.dashboard.panelUsersHint', {
                active: overview?.users.active ?? 0,
                verified: overview?.users.verified ?? 0,
              })}
            </p>
          </article>
          <article className="rounded-2xl bg-(--surface) p-5">
            <h3 className="text-lg font-semibold text-(--text-h)">{t('adminUi.dashboard.panelLearning')}</h3>
            <p className="mt-2 text-sm text-(--text)">
              {t('adminUi.dashboard.panelLearningHint', {
                published: overview?.courses.published ?? 0,
                activeRoadmaps: overview?.roadmaps.templatesActive ?? 0,
              })}
            </p>
          </article>
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default AdminDashboardPage

