import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Activity01Icon,
  Alert02Icon,
  AiMagicIcon,
  BookmarkRemove02Icon,
  CrownIcon,
  Delete02Icon,
  MoreVerticalIcon,
  Route03Icon,
  UserSettings01Icon,
  ZapIcon,
} from '@hugeicons/core-free-icons';
import { useLanguage } from '../../context/LanguageContext'
import { deleteUserRoadmap } from '../../libs/roadmaps-api'
import { deleteDashboardActivity, fetchCurrentUserPreferences } from '../../libs/user-api'
import CustomDropdown from '../ui/CustomDropdown'
import type {
  AiRecommendationCourse,
  AiRecommendationNextStep,
  AiRecommendationRoadmap,
  AiRecommendationsData,
  DashboardActivity,
  DashboardRoadmap,
  DashboardSummary,
  UserPreferences,
} from '../../libs/user-api'

function relativeTime(value: string | number | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!value) return ''

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000))

  if (diffDays === 0) return t('dashboard.activity.relative.today')
  if (diffDays === 1) return t('dashboard.activity.relative.oneDayAgo')
  if (diffDays < 30) return t('dashboard.activity.relative.daysAgo', { count: diffDays })

  const months = Math.floor(diffDays / 30)
  return months === 1
    ? t('dashboard.activity.relative.oneMonthAgo')
    : t('dashboard.activity.relative.monthsAgo', { count: months })
}

function progressWidth(progress?: number) {
  return `${Math.min(100, Math.max(0, Math.round(progress ?? 0)))}%`
}

export function DashboardStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="grid min-h-32 place-items-center border-(--border) px-4 py-6 text-center md:border-r md:last:border-r-0">
      <strong className="text-5xl font-semibold leading-none text-(--text-h)">{value}</strong>
      <span className="mt-3 text-sm text-(--text)">{label}</span>
    </div>
  )
}

export function StreakCard({ current, longest }: { current: number; longest: number }) {
  const { t } = useTranslation()
  const days = Array.from({ length: 8 }, (_, index) => index + 1)

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-4 sm:p-5 shadow-(--shadow)">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-(--text)">
          {t('dashboard.streak.current')} <strong className="text-(--text-h)">{current}</strong>
        </p>
        <p className="text-sm text-(--text)">
          {t('dashboard.streak.longest')} <strong className="text-(--text-h)">{longest}</strong>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-8 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const active = day <= Math.min(current, 8)
          const today = day === Math.min(Math.max(current, 1), 8)

          return (
            <div key={day} className="grid place-items-center gap-1 text-center">
              <span className={[
                'grid size-7 sm:size-8 place-items-center rounded-full border text-xs sm:text-sm transition',
                active ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : 'border-(--border) bg-(--surface-2) text-(--text)',
                today ? 'ring-2 ring-(--accent-border)' : '',
              ].join(' ')}
              >
                <HugeiconsIcon icon={ZapIcon} size={15} />
              </span>
              <span className={active ? 'text-[10px] sm:text-xs font-semibold text-(--accent)' : 'text-[10px] sm:text-xs text-(--text)'}>
                {day}
              </span>
            </div>
          )
        })}
      </div>

      <p className="mt-6 border-t border-dashed border-(--border) pt-4 text-center text-sm text-(--text)">
        {t('dashboard.streak.keepGoing')}
      </p>
    </section>
  )
}

export function ContinueRoadmapCard({ roadmap }: { roadmap: DashboardRoadmap }) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const progress = Math.round(roadmap.progressPercent ?? 0)
  const roadmapPath = `/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`
  const deleteMutation = useMutation({
    mutationFn: deleteUserRoadmap,
    onSuccess: async () => {
      toast.success(t('dashboard.roadmaps.deleted'))
      setIsMenuOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('dashboard.roadmaps.deleteFailed'))
    },
  })

  return (
    <article className={['group relative rounded-squircle border border-(--border) bg-(--surface) p-4 transition hover:-translate-y-0.5 hover:border-(--accent-border)', isMenuOpen ? 'z-30' : ''].join(' ')}>
      <div className="flex items-center justify-between gap-4">
        <Link to={roadmapPath} className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-(--text-h)">{roadmap.template?.title ?? t('profile.unknownRoadmap')}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-(--text)">{roadmap.status ?? 'assigned'}</p>
        </Link>
        <div className="flex items-center gap-3 text-sm text-(--text)">
          <span>{progress}%</span>
          <button
            type="button"
            className="grid size-8 cursor-pointer place-items-center rounded-squircle text-(--text) transition hover:bg-(--surface-2) hover:text-(--text-h)"
            aria-label={t('dashboard.roadmaps.openActions')}
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
          </button>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-(--surface-3)">
        <div className="h-full rounded-full bg-(--gd-primary)" style={{ width: progressWidth(progress) }} />
      </div>
      {isMenuOpen ? (
        <div className="absolute right-3 top-12 z-90 grid min-w-40 gap-1 rounded-squircle border border-(--border) bg-(--surface-2) p-2 shadow-(--shadow)">
          <button
            type="button"
            disabled={deleteMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-squircle px-3 py-2 text-left text-sm font-medium text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setIsConfirmDeleteOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            {deleteMutation.isPending ? t('dashboard.roadmaps.deleting') : t('dashboard.roadmaps.delete')}
          </button>
        </div>
      ) : null}
      {isConfirmDeleteOpen ? (
        <div className="fixed inset-0 z-120 grid place-items-center bg-black/70 px-4 py-8">
          <section className="w-full max-w-md rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-squircle border border-[rgba(226,33,52,0.35)] bg-[rgba(226,33,52,0.08)] text-(--error)">
                <HugeiconsIcon icon={Alert02Icon} size={22} />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-(--text-h)">
                  {t('dashboard.roadmaps.confirmDeleteTitle', 'Delete roadmap?')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-(--text)">
                  {t('dashboard.roadmaps.confirmDeleteSingleText', {
                    roadmap: roadmap.template?.title ?? t('profile.unknownRoadmap'),
                    defaultValue: 'This roadmap will be removed from your learning list.',
                  })}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2)"
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                {t('adminUi.common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.35)] px-4 py-2 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:opacity-60"
                onClick={() => deleteMutation.mutate(roadmap._id)}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                {deleteMutation.isPending ? t('dashboard.roadmaps.deleting') : t('dashboard.roadmaps.delete')}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  )
}

function StarredRoadmapCard({ roadmap }: { roadmap: DashboardRoadmap }) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const roadmapPath = `/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`
  const deleteMutation = useMutation({
    mutationFn: deleteUserRoadmap,
    onSuccess: async () => {
      toast.success(t('dashboard.roadmaps.deleted'))
      setIsMenuOpen(false)
      setIsConfirmDeleteOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('dashboard.roadmaps.deleteFailed'))
    },
  })

  return (
    <article className={['relative flex items-center justify-between gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border)', isMenuOpen ? 'z-30' : ''].join(' ')}>
      <Link to={roadmapPath} className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-(--text-h)">
          {roadmap.template?.title ?? t('profile.unknownRoadmap')}
        </span>
        <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-(--text)">
          {roadmap.template?.targetLevel ?? t('dashboard.roadmaps.starred', 'Starred')}
        </span>
      </Link>

      <span data-starred="true" className="star-toggle-button grid size-9 shrink-0 place-items-center rounded-squircle border border-(--accent-border) bg-(--accent-bg) text-(--accent)">
        <HugeiconsIcon icon={BookmarkRemove02Icon} size={17} className="star-toggle-icon star-toggle-icon-active" />
      </span>

      <button
        type="button"
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-squircle text-(--text) transition hover:bg-(--surface) hover:text-(--text-h)"
        aria-label={t('dashboard.roadmaps.openActions')}
        onClick={() => setIsMenuOpen((value) => !value)}
      >
        <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
      </button>

      {isMenuOpen ? (
        <div className="absolute right-3 top-12 z-90 grid min-w-44 gap-1 rounded-squircle border border-(--border) bg-(--surface) p-2 shadow-(--shadow)">
          <button
            type="button"
            disabled={deleteMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-squircle px-3 py-2 text-left text-sm font-medium text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => setIsConfirmDeleteOpen(true)}
          >
            <HugeiconsIcon icon={BookmarkRemove02Icon} size={16} />
            {deleteMutation.isPending
              ? t('dashboard.roadmaps.deleting')
              : t('dashboard.roadmaps.unstar', 'Remove')}
          </button>
        </div>
      ) : null}

      {isConfirmDeleteOpen ? (
        <div className="fixed inset-0 z-120 grid place-items-center bg-black/70 px-4 py-8">
          <section className="w-full max-w-md rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-squircle border border-[rgba(226,33,52,0.35)] bg-[rgba(226,33,52,0.08)] text-(--error)">
                <HugeiconsIcon icon={Alert02Icon} size={22} />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-(--text-h)">
                  {t('dashboard.roadmaps.confirmUnstarTitle', 'Remove starred roadmap?')}
                </h2>
                <p className="mt-2 text-sm leading-6 text-(--text)">
                  {t('dashboard.roadmaps.confirmUnstarText', {
                    roadmap: roadmap.template?.title ?? t('profile.unknownRoadmap'),
                    defaultValue: 'This roadmap will be removed from your starred roadmaps.',
                  })}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2)"
                onClick={() => setIsConfirmDeleteOpen(false)}
              >
                {t('adminUi.common.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.35)] px-4 py-2 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:opacity-60"
                onClick={() => deleteMutation.mutate(roadmap._id)}
              >
                <HugeiconsIcon icon={BookmarkRemove02Icon} size={16} />
                {deleteMutation.isPending ? t('dashboard.roadmaps.deleting') : t('dashboard.roadmaps.unstar', 'Remove star')}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  )
}

export function SavedRoadmapsSection({ roadmaps }: { roadmaps: DashboardRoadmap[] }) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  if (!roadmaps.length) return null

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
            {t('dashboard.savedRoadmaps.title', { defaultValue: 'Starred roadmaps' })}
          </h2>
          <p className="mt-2 text-sm text-(--text)">
            {t('dashboard.savedRoadmaps.subtitle', { defaultValue: 'Roadmaps starred in your profile and ready to start.' })}
          </p>
        </div>
        <Link
          to={`/${language}/my-roadmaps?status=assigned`}
          className="inline-flex items-center gap-2 rounded-squircle border border-(--border) px-3 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border)"
        >
          <HugeiconsIcon icon={BookmarkRemove02Icon} size={18} className="star-toggle-icon star-toggle-icon-active text-(--accent)" />
          {t('dashboard.savedRoadmaps.viewAll', 'View all')}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roadmaps.map((roadmap) => (
          <StarredRoadmapCard key={roadmap._id} roadmap={roadmap} />
        ))}
      </div>
    </section>
  )
}

function activityTitle(activity: DashboardActivity, t: (key: string, options?: Record<string, unknown>) => string) {
  const roadmapTitle = activity.roadmap?.template?.title ?? t('profile.unknownRoadmap')
  const courseTitle = activity.course?.title ?? t('dashboard.unknownCourse')
  const count = Number(activity.metadata?.topicsCount ?? activity.metadata?.completedSteps ?? 1)

  if (activity.type === 'roadmap_start') return t('dashboard.activity.started', { count, roadmap: roadmapTitle })
  if (activity.type === 'roadmap_step_complete') return t('dashboard.activity.completed', { count, roadmap: roadmapTitle })
  if (activity.type === 'course_enroll') return t('dashboard.activity.enrolled', { course: courseTitle })
  if (activity.type === 'course_complete') return t('dashboard.activity.courseCompleted', { course: courseTitle })
  if (activity.type === 'ai_roadmap_draft') return t('dashboard.activity.aiDraft', { defaultValue: 'Generated an AI roadmap draft' })
  if (activity.type === 'ai_roadmap_save') return t('dashboard.activity.aiSave', { defaultValue: 'Saved an AI roadmap' })
  if (activity.type === 'ai_topic_explain') return t('dashboard.activity.aiExplain', { defaultValue: 'Asked AI to explain a topic' })
  if (activity.type === 'login') return t('dashboard.activity.login')

  return t('dashboard.activity.updated')
}

function activityTone(activity: DashboardActivity) {
  if (activity.type.startsWith('ai_')) return 'border-(--accent-border) bg-(--accent-bg)'
  if (activity.type.startsWith('roadmap_')) return 'border-[rgba(80,160,255,0.35)] bg-[rgba(80,160,255,0.08)]'
  if (activity.type.startsWith('course_') || activity.type === 'lesson_complete') return 'border-[rgba(245,155,35,0.35)] bg-[rgba(245,155,35,0.08)]'
  return 'border-(--border) bg-(--surface-2)'
}

export function ActivityItem({
  activity,
  isDeleting,
  onDelete,
}: {
  activity: DashboardActivity
  isDeleting?: boolean
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const tags = activity.roadmap?.template?.tags?.slice(0, 3) ?? []
  const occurredLabel = activity.occurredAt || activity.createdAt
    ? new Date(activity.occurredAt ?? activity.createdAt ?? '').toLocaleDateString()
    : ''

  return (
    <article className="relative border-b border-(--border) py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-squircle border text-(--accent) ${activityTone(activity)}`}>
          <HugeiconsIcon icon={Activity01Icon} size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-(--text-h)">
            {activityTitle(activity, t)}{' '}
            <span className="text-(--text)">{relativeTime(activity.occurredAt ?? activity.createdAt, t)}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-(--text)">
            <span className="rounded-md bg-(--surface-2) px-2 py-1">{activity.type.replaceAll('_', ' ')}</span>
            {occurredLabel ? <span className="rounded-md bg-(--surface-2) px-2 py-1">{occurredLabel}</span> : null}
          </div>
          {tags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-md bg-(--surface-2) px-2 py-1 text-xs text-(--text-h)">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {onDelete ? (
          <button
            type="button"
            disabled={isDeleting}
            className="grid size-8 shrink-0 place-items-center rounded-squircle text-(--text) transition hover:bg-[rgba(226,33,52,0.08)] hover:text-(--error) disabled:opacity-50"
            aria-label={t('dashboard.activity.delete', 'Delete activity')}
            onClick={onDelete}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function ContinueFollowingSection({ roadmaps }: { roadmaps: DashboardRoadmap[] }) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">{t('dashboard.continueTitle')}</h2>
          <p className="mt-2 text-sm text-(--text)">{t('dashboard.continueSubtitle')}</p>
        </div>
        <Link
          to={`/${language}/my-roadmaps`}
          className="inline-flex items-center gap-2 rounded-squircle border border-(--border) px-3 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border)"
        >
          <HugeiconsIcon icon={Route03Icon} size={18} className="text-(--accent)" />
          {t('dashboard.roadmaps.viewAll')}
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roadmaps.length ? (
          roadmaps.map((roadmap) => <ContinueRoadmapCard key={roadmap._id} roadmap={roadmap} />)
        ) : (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-(--border) bg-(--surface-soft) p-6 sm:p-8 text-center flex flex-col items-center justify-center">
            {/* Onboarding Icon */}
            <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-(--accent-bg) text-(--accent) border border-(--accent-border) shadow-inner">
              <HugeiconsIcon icon={AiMagicIcon} size={28} className="animate-pulse" />
              <div className="absolute inset-0 rounded-2xl bg-(--accent) opacity-5 blur-xl pointer-events-none" />
            </div>

            {/* Welcoming content */}
            <h3 className="text-base font-bold text-(--text-h)">
              {t('dashboard.onboarding.title', { defaultValue: 'Kickstart Your Learning Journey!' })}
            </h3>
            <p className="mt-2 max-w-md text-xs leading-5 text-(--text)">
              {t('dashboard.onboarding.subtitle', { defaultValue: 'You have not started tracking any roadmap yet. Generate a custom roadmap tailored by AI, or explore standard templates.' })}
            </p>

            {/* Call to actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <Link
                to={`/${language}/ai`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-squircle bg-(--gd-primary) hover:bg-(--gd-primary-hover) text-white font-semibold text-xs px-5 py-3 shadow-lg shadow-(--gd-primary)/10 transition-all duration-200 hover:-translate-y-0.5"
              >
                <HugeiconsIcon icon={AiMagicIcon} size={15} />
                {t('dashboard.onboarding.ctaAi', { defaultValue: 'Generate AI Roadmap' })}
              </Link>
              <Link
                to={`/${language}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-squircle border border-(--border) bg-(--surface) hover:bg-(--surface-2) text-(--text-h) font-semibold text-xs px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
              >
                <HugeiconsIcon icon={Route03Icon} size={15} />
                {t('dashboard.onboarding.ctaBrowse', { defaultValue: 'Browse Templates' })}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function recommendationActionLabel(action: string, t: (key: string, options?: Record<string, unknown>) => string) {
  return t(`dashboard.ai.actions.${action}`, {
    defaultValue: action
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  })
}

function RecommendationCard({
  title,
  eyebrow,
  reason,
  score,
  action,
  to,
  className = 'bg-(--surface-2)',
}: {
  title: string
  eyebrow: string
  reason: string
  score: number
  action: string
  to?: string
  className?: string
}) {
  const content = (
    <article className={`flex h-full flex-col rounded-3xl border border-(--border) p-4 transition hover:border-(--accent-border) ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--accent)">{eyebrow}</p>
          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-(--text-h)">{title}</h3>
        </div>
        <span className="shrink-0 rounded-md border border-(--accent-border) px-2 py-1 text-xs font-semibold text-(--accent)">
          {score}%
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-(--text)">{reason}</p>
      <span className="mt-auto pt-4 text-sm font-semibold text-(--text-h)">{action}</span>
    </article>
  )

  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : content
}

function buildRecommendationCards({
  data,
  language,
  t,
}: {
  data?: AiRecommendationsData
  language: string
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  type RecommendationCardData = {
    key: string
    title: string
    eyebrow: string
    reason: string
    score: number
    action: string
    to?: string
  }

  const nextSteps =
    data?.recommendations.nextSteps.slice(0, 2).map<RecommendationCardData>((item: AiRecommendationNextStep) => ({
      key: `step-${item.roadmap._id}-${item.step.stepKey}`,
      title: item.step.title ?? t('dashboard.ai.unknownStep'),
      eyebrow: t('dashboard.ai.nextStep'),
      reason: item.reason,
      score: item.matchScore,
      action: recommendationActionLabel(item.nextAction, t),
      to: item.roadmap.slug ? `/${language}/roadmaps/${item.roadmap.slug}` : `/${language}/roadmaps`,
    })) ?? []

  const courses =
    data?.recommendations.courses.slice(0, 2).map<RecommendationCardData>((item: AiRecommendationCourse) => ({
      key: `course-${item.course._id}`,
      title: item.course.title,
      eyebrow: item.course.category || t('dashboard.ai.course'),
      reason: item.reason,
      score: item.matchScore,
      action: recommendationActionLabel(item.nextAction, t),
    })) ?? []

  const roadmaps =
    data?.recommendations.roadmaps.slice(0, 2).map<RecommendationCardData>((item: AiRecommendationRoadmap) => ({
      key: `roadmap-${item.roadmap._id}`,
      title: item.roadmap.title ?? t('profile.unknownRoadmap'),
      eyebrow: item.roadmap.templateType || t('dashboard.ai.roadmap'),
      reason: item.reason,
      score: item.matchScore,
      action: recommendationActionLabel(item.nextAction, t),
      to: item.roadmap.slug ? `/${language}/roadmaps/${item.roadmap.slug}` : `/${language}/roadmaps`,
    })) ?? []

  return [...nextSteps, ...courses, ...roadmaps].slice(0, 6)
}

export function CompletionCelebrationSection({
  completedRoadmaps,
  recommendations,
  isLoadingRecommendations,
}: {
  completedRoadmaps: DashboardRoadmap[]
  recommendations?: AiRecommendationsData
  isLoadingRecommendations: boolean
}) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const latestCompleted = completedRoadmaps[0]

  if (!completedRoadmaps.length) return null

  return (
    <section className="overflow-hidden rounded-3xl border border-(--accent-border) bg-(--surface) shadow-(--shadow)">
      <div className="grid gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
              {t('dashboard.completion.overline')}
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-(--text-h)">
              {t('dashboard.completion.title')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-(--text)">
              {t('dashboard.completion.subtitle', {
                roadmap: latestCompleted.template?.title ?? t('profile.unknownRoadmap'),
              })}
            </p>
          </div>
          <Link
            to={`/${language}/my-roadmaps?status=completed`}
            className="inline-flex shrink-0 items-center gap-2 rounded-squircle border border-(--border) px-3 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border)"
          >
            <HugeiconsIcon icon={Route03Icon} size={18} className="text-(--accent)" />
            {t('dashboard.completion.viewAllCompleted')}
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {completedRoadmaps.slice(0, 4).map((roadmap) => (
            <Link
              key={roadmap._id}
              to={`/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`}
              className="rounded-squircle border border-(--border) bg-(--surface-2) p-3 transition hover:border-(--accent-border)"
            >
              <span className="block truncate text-sm font-semibold text-(--text-h)">
                {roadmap.template?.title ?? t('profile.unknownRoadmap')}
              </span>
              <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-(--accent)">
                {t('dashboard.completion.completed')}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-(--border) bg-(--surface-2) p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
              {t('dashboard.completion.nextTitle')}
            </h3>
            <p className="mt-1 text-sm text-(--text)">
              {t('dashboard.completion.nextSubtitle')}
            </p>
          </div>
          <HugeiconsIcon icon={AiMagicIcon} size={20} className="shrink-0 text-(--accent)" />
        </div>
        <AiRecommendationCardsGrid
          data={recommendations}
          isLoading={isLoadingRecommendations}
          limit={3}
          className="mt-4 grid gap-3 md:grid-cols-3"
          itemClassName="bg-(--surface)"
          emptyClassName="md:col-span-3 bg-(--surface)"
        />
      </div>
    </section>
  )
}

export function RoadmapCompletionSection(props: {
  completedRoadmaps: DashboardRoadmap[]
  recommendations?: AiRecommendationsData
  isLoadingRecommendations: boolean
}) {
  return <CompletionCelebrationSection {...props} />
}

export function AiRecommendationCardsGrid({
  data,
  isLoading,
  limit = 6,
  className = 'mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3',
  itemClassName,
  emptyClassName = 'md:col-span-2 xl:col-span-3',
}: {
  data?: AiRecommendationsData
  isLoading: boolean
  limit?: number
  className?: string
  itemClassName?: string
  emptyClassName?: string
}) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const cards = buildRecommendationCards({ data, language, t }).slice(0, limit)
  const emptyStateClassName = `rounded-3xl border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text) ${emptyClassName}`

  return (
    <div className={className}>
      {isLoading ? (
        <p className={emptyStateClassName}>{t('dashboard.ai.loading')}</p>
      ) : cards.length ? (
        cards.map((card) => (
          <RecommendationCard
            key={card.key}
            title={card.title}
            eyebrow={card.eyebrow}
            reason={card.reason}
            score={card.score}
            action={card.action}
            to={card.to}
            className={itemClassName}
          />
        ))
      ) : (
        <div className={`rounded-xl border border-dashed border-(--border) bg-(--surface-soft) p-6 text-center flex flex-col items-center justify-center min-h-[160px] ${emptyClassName}`}>
          <HugeiconsIcon icon={ZapIcon} size={24} className="text-(--text) opacity-60 mb-2.5 animate-pulse" />
          <p className="max-w-md text-xs leading-5 text-(--text)">
            {t('dashboard.ai.empty')}
          </p>
          <Link
            to={`/${language}/preferences`}
            className="mt-3 text-xs font-semibold text-(--accent) hover:underline transition"
          >
            {t('dashboard.ai.updatePrefsCta', { defaultValue: 'Set your preferences' })} &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}

export function AiRecommendationsSection({
  data,
  isLoading,
}: {
  data?: AiRecommendationsData
  isLoading: boolean
}) {
  const { t } = useTranslation()

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">{t('dashboard.ai.title')}</h2>
          <p className="mt-2 text-sm text-(--text)">{t('dashboard.ai.subtitle')}</p>
        </div>
        <HugeiconsIcon icon={AiMagicIcon} size={20} className="text-(--accent)" />
      </div>
      <AiRecommendationCardsGrid data={data} isLoading={isLoading} />
    </section>
  )
}

export function LearningActivitySection({
  activities,
  isLoading,
}: {
  activities: DashboardActivity[]
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const initialActivityLimit = 6
  const activityPageSize = 6
  type ActivityDateFilter = 'all' | 'today' | 'week' | 'month' | 'older'
  const [dateFilter, setDateFilter] = useState<ActivityDateFilter>('all')
  const [visibleActivityCount, setVisibleActivityCount] = useState(initialActivityLimit)
  const [activityFilterClock] = useState(() => {
    const now = Date.now()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    return {
      now,
      startOfToday: startOfToday.getTime(),
    }
  })
  const deleteActivityMutation = useMutation({
    mutationFn: deleteDashboardActivity,
    onSuccess: async () => {
      toast.success(t('dashboard.activity.deleted', 'Activity deleted.'))
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('dashboard.activity.deleteFailed', 'Could not delete activity.'))
    },
  })
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const timestamp = new Date(activity.occurredAt ?? activity.createdAt ?? 0).getTime()

      if (!timestamp) return dateFilter === 'all'
      if (dateFilter === 'today') return timestamp >= activityFilterClock.startOfToday
      if (dateFilter === 'week') return activityFilterClock.now - timestamp <= 7 * 86400000
      if (dateFilter === 'month') return activityFilterClock.now - timestamp <= 30 * 86400000
      if (dateFilter === 'older') return activityFilterClock.now - timestamp > 30 * 86400000
      return true
    })
  }, [activities, activityFilterClock, dateFilter])
  const visibleActivities = filteredActivities.slice(0, visibleActivityCount)
  const hiddenActivityCount = Math.max(0, filteredActivities.length - visibleActivities.length)
  const roadmapEvents = activities.filter((activity) => activity.type.startsWith('roadmap_')).length
  const courseEvents = activities.filter((activity) => activity.type.startsWith('course_') || activity.type === 'lesson_complete').length
  const aiEvents = activities.filter((activity) => activity.type.startsWith('ai_')).length
  const dateOptions: Array<{ value: ActivityDateFilter; label: string }> = [
    { value: 'all', label: t('dashboard.activity.filters.all', 'All activity') },
    { value: 'today', label: t('dashboard.activity.filters.today', 'Today') },
    { value: 'week', label: t('dashboard.activity.filters.week', 'Last 7 days') },
    { value: 'month', label: t('dashboard.activity.filters.month', 'Last 30 days') },
    { value: 'older', label: t('dashboard.activity.filters.older', 'Older') },
  ]

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">{t('dashboard.activity.title')}</h2>
          <p className="mt-2 text-sm text-(--text)">
            {t('dashboard.activity.subtitle', 'Track recent roadmap, course, AI, and login activity.')}
          </p>
        </div>
        <CustomDropdown
          value={dateFilter}
          options={dateOptions}
          onChange={(value) => {
            setDateFilter(value)
            setVisibleActivityCount(initialActivityLimit)
          }}
          className="w-full sm:w-44"
          buttonClassName="bg-(--surface-2)"
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {[
          { label: t('dashboard.activity.metrics.total', 'Total'), value: activities.length },
          { label: t('dashboard.activity.metrics.roadmaps', 'Roadmaps'), value: roadmapEvents },
          { label: t('dashboard.activity.metrics.courses', 'Courses'), value: courseEvents },
          { label: t('dashboard.activity.metrics.ai', 'AI'), value: aiEvents },
        ].map((metric) => (
          <div key={metric.label} className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-(--text)">{metric.label}</p>
            <p className="mt-1 text-lg font-semibold text-(--text-h)">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        {isLoading ? (
          <p className="rounded-3xl border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text)">{t('dashboard.loading')}</p>
        ) : filteredActivities.length ? (
          <>
            {visibleActivities.map((activity) => (
              <ActivityItem
                key={activity._id}
                activity={activity}
                isDeleting={deleteActivityMutation.isPending}
                onDelete={() => deleteActivityMutation.mutate(activity._id)}
              />
            ))}
            {hiddenActivityCount ? (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) hover:bg-(--surface-2)"
                  onClick={() => setVisibleActivityCount((count) => count + activityPageSize)}
                >
                  {t('dashboard.activity.loadMore', {
                    count: Math.min(activityPageSize, hiddenActivityCount),
                    defaultValue: `Load more (${Math.min(activityPageSize, hiddenActivityCount)})`,
                  })}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="rounded-squircle border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text)">{t('dashboard.activity.empty')}</p>
        )}
      </div>
    </section>
  )
}


export function SubscriptionSection({
  subscription,
}: {
  subscription?: {
    plan?: 'free' | 'pro'
    status?: 'inactive' | 'active' | 'trialing' | 'pastDue' | 'canceled'
    currentPeriodEnd?: string | number | Date | null
  }
}) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  const plan = subscription?.plan ?? 'free'
  const status = subscription?.status ?? 'inactive'
  const currentPeriodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null
  const isPro = plan === 'pro' && ['active', 'trialing'].includes(status)

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
        {t('dashboard.subscription.title', 'Subscription')}
      </h2>

      <div className="mt-4 rounded-squircle border border-(--border) bg-(--surface-2) p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-(--text-h)">
              {isPro ? t('dashboard.subscription.pro', 'Pro Plan') : t('dashboard.subscription.free', 'Free Plan')}
            </p>

            <p className="mt-1 text-sm text-(--text)">
              {t('dashboard.subscription.status', 'Status')}: {status}
            </p>

            {currentPeriodEnd && (
              <p className="mt-1 text-sm text-(--text)">
                {t('dashboard.subscription.renewsAt', 'Current period ends')}: {currentPeriodEnd}
              </p>
            )}
          </div>

          <span className="rounded-full border border-(--border) px-3 py-1 text-xs font-semibold uppercase text-(--accent)">
            {plan}
          </span>
        </div>

        {!isPro && (
          <Link
            to={`/${language}/upgrade`}
            className="mt-4 inline-flex items-center gap-2 rounded-squircle bg-(--accent) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
          >
            <HugeiconsIcon icon={CrownIcon} size={17} />
            {t('dashboard.subscription.upgrade', 'Upgrade to Pro')}
          </Link>
        )}
      </div>
    </section>
  )
}

type DashboardTranslator = (key: string, options?: Record<string, unknown>) => string

function countRecentActiveDays(activities: DashboardSummary['activities'] = []) {
  const cutoff = Date.now() - 7 * 86400000
  const activeDays = new Set<string>()

  activities.forEach((activity) => {
    const timestamp = new Date(activity.occurredAt ?? activity.createdAt ?? 0).getTime()
    if (!timestamp || timestamp < cutoff) return
    activeDays.add(new Date(timestamp).toDateString())
  })

  return activeDays.size
}

function nextSkillLevel(level?: UserPreferences['skillLevel']) {
  if (level === 'beginner') return 'intermediate'
  if (level === 'intermediate') return 'advanced'
  return null
}

function buildPreferenceInsights({
  preferences,
  summary,
  t,
}: {
  preferences?: UserPreferences | null
  summary?: DashboardSummary
  t: DashboardTranslator
}) {
  const activeDays = countRecentActiveDays(summary?.activities ?? [])
  const weeklyHours = preferences?.weeklyStudyHours ?? 0
  const activeLearning = (summary?.totals.activeRoadmaps ?? 0) + (summary?.totals.activeCourses ?? 0)
  const completedLearning = (summary?.totals.completedRoadmaps ?? 0) + (summary?.totals.completedCourses ?? 0)
  const averageProgress = Math.round(summary?.totals.averageRoadmapProgress ?? 0)
  const latestRoadmapProgress = Math.max(0, ...(summary?.roadmaps ?? []).map((roadmap) => Math.round(roadmap.progressPercent ?? 0)))
  const upgradeLevel = nextSkillLevel(preferences?.skillLevel)

  const schedule =
    !summary
      ? t('dashboard.preferences.insights.waiting', { defaultValue: 'Activity notes appear after your dashboard loads.' })
      : weeklyHours >= 6 && activeDays <= 1
        ? t('dashboard.preferences.insights.decreaseTime', { defaultValue: 'Recent activity is lighter than this target; decrease hours or split sessions.' })
        : weeklyHours <= 3 && activeDays >= 4
          ? t('dashboard.preferences.insights.increaseTime', { defaultValue: 'Your activity is steady; you can increase weekly time if it feels good.' })
          : activeLearning > 0
            ? t('dashboard.preferences.insights.keepTime', { defaultValue: 'Your current pace matches recent learning activity.' })
            : t('dashboard.preferences.insights.startTime', { defaultValue: 'Start a roadmap so ILMA can compare your target with real activity.' })

  const level =
    upgradeLevel && (completedLearning > 0 || averageProgress >= 75)
      ? t('dashboard.preferences.insights.levelUp', {
          level: t(`landing.levels.${upgradeLevel}`, { defaultValue: upgradeLevel }),
          defaultValue: `Progress suggests you may be ready for ${upgradeLevel}.`,
        })
      : averageProgress >= 35 || activeDays >= 3
        ? t('dashboard.preferences.insights.levelBuilding', { defaultValue: 'You are building evidence for the next skill level.' })
        : t('dashboard.preferences.insights.levelHold', { defaultValue: 'Stay at this level until more roadmap work is completed.' })

  const goals =
    completedLearning > 0
      ? t('dashboard.preferences.insights.goalReview', { defaultValue: 'A learning path ended; check whether your goals were reached.' })
      : latestRoadmapProgress >= 85
        ? t('dashboard.preferences.insights.goalNear', { defaultValue: 'A roadmap is near the end; prepare to review your goals.' })
        : activeLearning > 0
          ? t('dashboard.preferences.insights.goalTracking', { defaultValue: 'ILMA is tracking progress toward these goals.' })
          : t('dashboard.preferences.insights.goalStart', { defaultValue: 'When a roadmap ends, ILMA will ask if these goals were reached.' })

  return { schedule, level, goals }
}

export function PreferencesPreviewSection({ summary }: { summary?: DashboardSummary }) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const preferencesQuery = useQuery({
    queryKey: ['auth', 'preferences'],
    queryFn: fetchCurrentUserPreferences,
  })
  const preferences = preferencesQuery.data
  const hasPreferences = Boolean(preferences)
  const insights = buildPreferenceInsights({ preferences, summary, t })
  const listLabel = (items?: string[], fallback = t('dashboard.preferences.notSet', 'Not set')) =>
    items?.length ? items.slice(0, 3).join(', ') : fallback
  const preferenceItems = hasPreferences
    ? [
        {
          label: t('dashboard.preferences.items.interests', 'Interests'),
          value: listLabel(preferences?.interests),
        },
        {
          label: t('dashboard.preferences.items.goals', 'Learning goals'),
          value: listLabel(preferences?.learningGoals),
          insight: insights.goals,
        },
        {
          label: t('dashboard.preferences.items.level', 'Current skill level'),
          value: preferences?.skillLevel ?? t('dashboard.preferences.notSet', 'Not set'),
          insight: insights.level,
        },
        {
          label: t('dashboard.preferences.items.schedule', 'Weekly study time'),
          value: t('dashboard.preferences.hours', {
            count: preferences?.weeklyStudyHours ?? 0,
            defaultValue: `${preferences?.weeklyStudyHours ?? 0} hours / week`,
          }),
          insight: insights.schedule,
        },
      ]
    : [
        {
          label: t('dashboard.preferences.items.interests', 'Interests'),
          value: t('dashboard.preferences.emptyItem', 'Choose topics you want to learn'),
        },
        {
          label: t('dashboard.preferences.items.level', 'Current skill level'),
          value: t('dashboard.preferences.emptyLevel', 'Set your level and difficulty'),
        },
        {
          label: t('dashboard.preferences.items.schedule', 'Weekly study time'),
          value: t('dashboard.preferences.emptySchedule', 'Pick your learning pace'),
        },
      ]

  return (
    <section className="rounded-3xl border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
            {t('dashboard.preferences.title', 'Preferences')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-(--text)">
            {hasPreferences
              ? t('dashboard.preferences.subtitleReady', 'Your recommendations use your saved interests, goals, level, and weekly schedule.')
              : t('dashboard.preferences.subtitleSetup', 'Answer a few setup questions so roadmaps, courses, and AI suggestions match your learning plan.')}
          </p>
        </div>
        <HugeiconsIcon icon={UserSettings01Icon} size={20} className="text-(--accent)" />
      </div>
      <div className="mt-4 grid gap-2">
        {preferencesQuery.isLoading ? (
          <div className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2 text-sm text-(--text)">
            {t('dashboard.loading')}
          </div>
        ) : preferenceItems.map((item) => (
          <div key={item.label} className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-3 text-sm min-[520px]:grid-cols-[minmax(0,1fr)_minmax(9rem,0.9fr)]">
            <span className="flex min-w-0 items-start gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-(--accent)" />
              <span className="grid min-w-0 gap-1">
                <span className="font-semibold text-(--text-h)">{item.label}</span>
                <span className="wrap-break-word text-xs text-(--text)">{item.value}</span>
              </span>
            </span>
            {'insight' in item && item.insight ? (
              <span className="rounded-squircle border border-(--accent-border) bg-(--accent-bg) px-3 py-2 text-xs leading-5 text-(--text-h)">
                {item.insight}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <Link
        to={`/${language}/preferences`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-squircle border border-(--accent-border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--accent-bg)"
      >
        <HugeiconsIcon icon={AiMagicIcon} size={16} className="text-(--accent)" />
        {hasPreferences
          ? t('dashboard.preferences.update', 'Update preferences')
          : t('dashboard.preferences.start', 'Set preferences')}
      </Link>
    </section>
  )
}
