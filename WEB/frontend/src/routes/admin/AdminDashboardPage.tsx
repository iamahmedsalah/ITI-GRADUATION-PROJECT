import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useLanguage } from '../../context/LanguageContext'
import {
  createHeroLineVariants,
  createPageVariants,
  createStaggerContainerVariants,
} from '../../libs/motionVariants'
import { fetchAdminOverview } from '../../libs/admin-api'
import AdminUsersTab from './tabs/AdminUsersTab'
import AdminRoadmapsTab from './tabs/AdminRoadmapsTab'
import AdminCoursesTab from './tabs/AdminCoursesTab'

function AdminDashboardPage() {
  const { direction, language } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)

  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: fetchAdminOverview,
    staleTime: 0,
  })

  const usersTotal = overview?.users.total ?? 0
  const roadmapsTotal = overview?.roadmaps.templatesTotal ?? 0
  const coursesTotal = overview?.courses.total ?? 0

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section
        className="grid gap-6 rounded-3xl bg-(--surface-2) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
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
          <div className="rounded-full bg-(--surface) px-4 py-2 text-sm text-(--text-h)">
            {isLoading ? t('adminUi.dashboard.loading') : t('adminUi.dashboard.live')}
          </div>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainerVariants}>
          <AdminUsersTab
            to={`/${language}/admin/users`}
            count={usersTotal}
            title={t('adminUi.tabs.users')}
            subtitle={t('adminUi.tabs.usersHint')}
          />
          <AdminRoadmapsTab
            to={`/${language}/admin/roadmaps`}
            count={roadmapsTotal}
            title={t('adminUi.tabs.roadmaps')}
            subtitle={t('adminUi.tabs.roadmapsHint')}
          />
          <AdminCoursesTab
            to={`/${language}/admin/courses`}
            count={coursesTotal}
            title={t('adminUi.tabs.courses')}
            subtitle={t('adminUi.tabs.coursesHint')}
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


