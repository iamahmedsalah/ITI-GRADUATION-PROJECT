import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CheckmarkCircle01Icon, CrownIcon, DashboardSquare03Icon, Mail01Icon, Route03Icon, UserEdit01Icon, GiftIcon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { useLanguage } from '../../context/LanguageContext'
import {
  createHeroLineVariants,
  createPageVariants,
  createStaggerContainerVariants,
} from '../../libs/motionVariants'
import { fetchAdminOverview, fetchAdminProAccessRequests, reviewAdminProAccessRequest } from '../../libs/admin-api'
import { useWhatsNew } from '../../hooks/useWhatsNew'
import WhatsNewPanel from '../../components/ui/WhatsNewPanel'

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
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => new Date())
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)

  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: fetchAdminOverview,
    staleTime: 0,
  })
  const proRequestsQuery = useQuery({
    queryKey: ['admin', 'pro-access-requests', 'pending'],
    queryFn: () => fetchAdminProAccessRequests({ status: 'pending', limit: 5 }),
    staleTime: 0,
  })
  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approve' | 'reject' }) =>
      reviewAdminProAccessRequest(requestId, { action }),
    onSuccess: async (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'pro-access-requests'] })
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => {
      toast.error(t('adminUi.proAccess.reviewFailed', { defaultValue: 'Could not review Pro access request.' }))
    },
  })

  const { isOpen, latestData, dismiss, open } = useWhatsNew('admin')

  const roadmapsTotal = overview?.roadmaps.templatesTotal ?? 0
  const coursesTotal = overview?.courses.total ?? 0
  const unreadContactMessages = overview?.contactMessages?.unread ?? 0
  const onlineUsers = overview?.users.online ?? 0
  const activeUsers = overview?.users.active ?? 0
  const pendingProAccessRequests = overview?.proAccessRequests?.pending ?? 0
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
      <WhatsNewPanel isOpen={isOpen} onClose={dismiss} latestData={latestData} />
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={open}
              className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--text-h) transition hover:bg-(--surface-2)"
            >
              <HugeiconsIcon icon={GiftIcon} size={16} className="text-(--gd-primary)" />
              <span>{t('whatsNew.triggerBtn', { defaultValue: "What's New" })}</span>
            </button>
            <div className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--text-h)">
              {isLoading ? t('adminUi.dashboard.loading') : liveDate}
            </div>
          </div>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" variants={staggerContainerVariants}>
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
          <MetricCard
            label={t('adminUi.tabs.contactMessages')}
            value={unreadContactMessages}
            helper={t('adminUi.tabs.contactMessagesHint')}
            icon={Mail01Icon}
          />
          <MetricCard
            label={t('adminUi.proAccess.pendingMetric', { defaultValue: 'Pro requests' })}
            value={pendingProAccessRequests}
            helper={t('adminUi.proAccess.pendingMetricHint', { defaultValue: 'Pending approval requests.' })}
            icon={CrownIcon}
          />
        </motion.div>

        <motion.section variants={heroLineVariants} className="rounded-2xl bg-(--surface) p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-(--text-h)">
                {t('adminUi.proAccess.title', { defaultValue: 'Pro access requests' })}
              </h3>
              <p className="mt-2 text-sm text-(--text)">
                {t('adminUi.proAccess.subtitle', { defaultValue: 'Approve one free week for students who need to test Pro.' })}
              </p>
            </div>
            <span className="rounded-squircle border border-(--border) px-3 py-1.5 text-xs font-semibold uppercase text-(--accent)">
              {pendingProAccessRequests} {t('adminUi.proAccess.pending', { defaultValue: 'pending' })}
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            {proRequestsQuery.isLoading ? (
              <p className="rounded-squircle border border-(--border) bg-(--surface-2) p-4 text-sm text-(--text)">
                {t('adminUi.common.loading')}
              </p>
            ) : proRequestsQuery.data?.data.length ? (
              proRequestsQuery.data.data.map((request) => (
                <article key={request._id} className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-(--text-h)">
                        {request.user?.Fname} {request.user?.Lname}
                      </p>
                      <span className="rounded-md bg-(--surface) px-2 py-1 text-xs text-(--text)">
                        {request.user?.email}
                      </span>
                      <span className="rounded-md bg-(--accent-bg) px-2 py-1 text-xs font-semibold text-(--accent)">
                        {request.learningGoal.replaceAll('-', ' ')}
                      </span>
                      <span className="rounded-md bg-(--surface) px-2 py-1 text-xs text-(--text)">
                        {request.expectedDurationDays} {t('adminUi.proAccess.days', { defaultValue: 'days' })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-(--text)">
                      {request.needReason}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                    <button
                      type="button"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ requestId: request._id, action: 'approve' })}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--accent-border) px-3 py-2 text-sm font-semibold text-(--accent) transition hover:bg-(--accent-bg) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={17} />
                      {t('adminUi.proAccess.approve', { defaultValue: 'Approve 1 week' })}
                    </button>
                    <button
                      type="button"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ requestId: request._id, action: 'reject' })}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--border) px-3 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-3) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={17} />
                      {t('adminUi.proAccess.reject', { defaultValue: 'Reject' })}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-squircle border border-dashed border-(--border) bg-(--surface-2) p-4 text-sm text-(--text)">
                {t('adminUi.proAccess.empty', { defaultValue: 'No pending Pro access requests.' })}
              </p>
            )}
          </div>
        </motion.section>

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

