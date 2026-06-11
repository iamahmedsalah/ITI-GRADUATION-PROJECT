import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { Activity01Icon, MoreVerticalIcon, Route03Icon, ZapIcon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import type {
  AiRecommendationCourse,
  AiRecommendationNextStep,
  AiRecommendationRoadmap,
  AiRecommendationsData,
  DashboardActivity,
  DashboardRoadmap,
} from '../../libs/user-api'

function relativeTime(value?: string | number) {
  if (!value) return ''

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`

  const months = Math.floor(diffDays / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
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
    <section className="rounded-lg border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-(--text)">
          {t('dashboard.streak.current')} <strong className="text-(--text-h)">{current}</strong>
        </p>
        <p className="text-sm text-(--text)">
          {t('dashboard.streak.longest')} <strong className="text-(--text-h)">{longest}</strong>
        </p>
      </div>

      <div className="mt-6 grid grid-cols-8 gap-2">
        {days.map((day) => {
          const active = day <= Math.min(current, 8)
          const today = day === Math.min(Math.max(current, 1), 8)

          return (
            <div key={day} className="grid place-items-center gap-1 text-center">
              <span className={[
                'grid size-8 place-items-center rounded-full border text-sm transition',
                active ? 'border-(--accent-border) bg-(--accent-soft) text-(--accent)' : 'border-(--border) bg-(--surface-2) text-(--text)',
                today ? 'ring-2 ring-(--accent-border)' : '',
              ].join(' ')}
              >
                <HugeiconsIcon icon={ZapIcon} size={17} />
              </span>
              <span className={active ? 'text-xs font-semibold text-(--accent)' : 'text-xs text-(--text)'}>
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
  const progress = Math.round(roadmap.progressPercent ?? 0)

  return (
    <Link
      to={`/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`}
      className="group rounded-lg border border-(--border) bg-(--surface) p-4 transition hover:-translate-y-0.5 hover:border-(--accent-border)"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-(--text-h)">{roadmap.template?.title ?? t('profile.unknownRoadmap')}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-(--text)">{roadmap.status ?? 'assigned'}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-(--text)">
          <span>{progress}%</span>
          <HugeiconsIcon icon={MoreVerticalIcon} size={18} />
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-(--surface-3)">
        <div className="h-full rounded-full bg-(--gd-primary)" style={{ width: progressWidth(progress) }} />
      </div>
    </Link>
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
  if (activity.type === 'login') return t('dashboard.activity.login')

  return t('dashboard.activity.updated')
}

export function ActivityItem({ activity }: { activity: DashboardActivity }) {
  const { t } = useTranslation()
  const tags = activity.roadmap?.template?.tags?.slice(0, 3) ?? []

  return (
    <article className="border-b border-(--border) py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-squircle bg-(--surface-2) text-(--accent)">
          <HugeiconsIcon icon={Activity01Icon} size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm leading-6 text-(--text-h)">
            {activityTitle(activity, t)}{' '}
            <span className="text-(--text)">{relativeTime(activity.occurredAt ?? activity.createdAt)}</span>
          </p>
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
      </div>
    </article>
  )
}

export function ContinueFollowingSection({ roadmaps }: { roadmaps: DashboardRoadmap[] }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">{t('dashboard.continueTitle')}</h2>
          <p className="mt-2 text-sm text-(--text)">{t('dashboard.continueSubtitle')}</p>
        </div>
        <HugeiconsIcon icon={Route03Icon} size={20} className="text-(--accent)" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {roadmaps.length ? (
          roadmaps.map((roadmap) => <ContinueRoadmapCard key={roadmap._id} roadmap={roadmap} />)
        ) : (
          <p className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text) md:col-span-2">
            {t('dashboard.emptyRoadmaps')}
          </p>
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
}: {
  title: string
  eyebrow: string
  reason: string
  score: number
  action: string
  to?: string
}) {
  const content = (
    <article className="flex h-full flex-col rounded-lg border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border)">
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

export function AiRecommendationsSection({
  data,
  isLoading,
}: {
  data?: AiRecommendationsData
  isLoading: boolean
}) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const cards = buildRecommendationCards({ data, language, t })

  return (
    <section className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">{t('dashboard.ai.title')}</h2>
          <p className="mt-2 text-sm text-(--text)">{t('dashboard.ai.subtitle')}</p>
        </div>
        <HugeiconsIcon icon={ZapIcon} size={20} className="text-(--accent)" />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <p className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text) md:col-span-2 xl:col-span-3">
            {t('dashboard.ai.loading')}
          </p>
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
            />
          ))
        ) : (
          <p className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text) md:col-span-2 xl:col-span-3">
            {t('dashboard.ai.empty')}
          </p>
        )}
      </div>
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

  return (
    <section className="rounded-lg border border-(--border) bg-(--surface) p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">{t('dashboard.activity.title')}</h2>
      <div className="mt-4">
        {isLoading ? (
          <p className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text)">{t('dashboard.loading')}</p>
        ) : activities.length ? (
          activities.map((activity) => <ActivityItem key={activity._id} activity={activity} />)
        ) : (
          <p className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm text-(--text)">{t('dashboard.activity.empty')}</p>
        )}
      </div>
    </section>
  )
}
