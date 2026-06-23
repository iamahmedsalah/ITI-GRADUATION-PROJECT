import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiMagicIcon,
  ArrowRight01Icon,
  CrownIcon,
  EyeIcon,
  Route03Icon,
  Share03Icon,
  SidebarRightIcon,
} from '@hugeicons/core-free-icons';
import { useLanguage } from '../../context/LanguageContext'
import type { AiFeatureAccess } from '../../libs/ai-api'
import {
  fetchRoadmapTemplates,
  fetchUserRoadmaps,
  updateRoadmapVisibility,
  type RoadmapTemplate,
  type UserRoadmap,
} from '../../libs/roadmaps-api'
import type { AuthUser } from '../../utils/route-utils'

type AiRoadmapManagerProps = {
  access?: AiFeatureAccess
  currentUser?: AuthUser | null
  isAuthenticated: boolean
  onToggle?: () => void
}

function getOwnerId(owner?: RoadmapTemplate['owner']) {
  return typeof owner === 'object' ? owner._id : owner
}

function getOwnerName(owner?: RoadmapTemplate['owner']) {
  if (!owner || typeof owner !== 'object') return ''
  return [owner.Fname, owner.Lname].filter(Boolean).join(' ') || owner.username
}

function isAiRoadmap(roadmap: UserRoadmap) {
  return roadmap.template?.source === 'user-ai' || roadmap.template?.source === 'ai'
}

function RoadmapAvatar({ template }: { template: RoadmapTemplate }) {
  const owner = template.owner

  if (owner && typeof owner === 'object' && owner.avatarUrl) {
    return (
      <img
        src={owner.avatarUrl}
        alt={owner.username}
        className="size-8 shrink-0 rounded-squircle object-cover"
      />
    )
  }

  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-squircle bg-(--surface-3) text-(--accent)">
      <HugeiconsIcon icon={Route03Icon} size={16} />
    </span>
  )
}

export default function AiRoadmapManager({
  access,
  currentUser,
  isAuthenticated,
  onToggle,
}: AiRoadmapManagerProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const queryClient = useQueryClient()

  const roadmapsQuery = useQuery({
    queryKey: ['roadmaps', 'mine'],
    queryFn: fetchUserRoadmaps,
    staleTime: 10_000,
    enabled: isAuthenticated,
  })

  const publicAiRoadmapsQuery = useQuery({
    queryKey: ['roadmaps', 'public-ai'],
    queryFn: () => fetchRoadmapTemplates(10, undefined, 'user-ai'),
    staleTime: 30_000,
  })

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ templateId, visibility }: { templateId: string; visibility: 'public' | 'private' }) => {
      await updateRoadmapVisibility(templateId, visibility)
      return { templateId, visibility }
    },
    onSuccess: async () => {
      toast.success(t('aiRoadmap.visibilityUpdated'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['roadmaps', 'public-ai'] }),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiRoadmap.saveFailed'))
    },
  })

  const userAiRoadmaps = useMemo(
    () => (roadmapsQuery.data ?? []).filter(isAiRoadmap),
    [roadmapsQuery.data],
  )

  const sharedUserRoadmaps = useMemo(
    () => userAiRoadmaps.filter((roadmap) => roadmap.template?.visibility === 'public'),
    [userAiRoadmaps],
  )

  const publicAiRoadmaps = publicAiRoadmapsQuery.data ?? []

  const canManageVisibility = (template?: RoadmapTemplate) =>
    Boolean(
      currentUser &&
      template?.source === 'user-ai' &&
      getOwnerId(template.owner) === currentUser._id,
    )

  const renderUserRoadmap = (roadmap: UserRoadmap) => {
    const template = roadmap.template
    if (!template) return null

    const progress = Math.round(roadmap.progressPercent ?? 0)
    const visibility = template.visibility === 'public' ? 'public' : 'private'
    const canShare = canManageVisibility(template)

    return (
      <li key={roadmap._id}>
        <article className="grid gap-3 rounded-3xl border border-(--border) bg-(--surface) p-3">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-squircle bg-(--surface-3) text-(--accent)">
              <HugeiconsIcon icon={AiMagicIcon} size={17} />
            </span>
            <div className="min-w-0">
              <Link
                to={`/${language}/roadmaps/${template.slug ?? 'roadmap'}`}
                className="block truncate text-sm font-semibold text-(--text-h) transition hover:text-(--accent)"
              >
                {template.title}
              </Link>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-(--surface-3)">
                  <span
                    className="block h-full rounded-full bg-(--gd-primary)"
                    style={{ width: `${progress}%` }}
                  />
                </span>
                <span className="shrink-0 text-[11px] font-bold text-(--text)">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
          {canShare ? (
            <button
              type="button"
              disabled={updateVisibilityMutation.isPending}
              onClick={() => {
                updateVisibilityMutation.mutate({
                  templateId: template._id,
                  visibility: visibility === 'public' ? 'private' : 'public',
                })
              }}
              className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2 text-xs font-semibold text-(--text-h) transition hover:border-(--accent-border) disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HugeiconsIcon
                icon={visibility === 'public' ? EyeIcon : Share03Icon}
                size={15}
                className={visibility === 'public' ? 'text-(--success)' : 'text-(--text)'}
              />
              {visibility === 'public' ? t('aiRoadmap.shared') : t('aiRoadmap.share')}
            </button>
          ) : null}
        </article>
      </li>
    )
  }

  const renderPublicRoadmap = (template: RoadmapTemplate) => {
    const ownerName = getOwnerName(template.owner)

    return (
      <li key={template._id}>
        <Link
          to={`/${language}/roadmaps/${template.slug}`}
          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-squircle border border-(--border) bg-(--surface) p-3 transition hover:border-(--accent-border) hover:bg-(--surface-soft)"
        >
          <RoadmapAvatar template={template} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-(--text-h)">
              {template.title}
            </span>
            {ownerName ? (
              <span className="mt-1 block truncate text-[11px] text-(--text)">
                {ownerName}
              </span>
            ) : null}
          </span>
          <HugeiconsIcon icon={EyeIcon} size={15} className="shrink-0 text-(--accent)" />
        </Link>
      </li>
    )
  }

  return (
    <aside className="grid content-start gap-4 rounded-2xl border border-(--border) bg-(--surface-2)/30 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-(--text-h)">
          <HugeiconsIcon icon={CrownIcon} size={18} className="shrink-0 text-amber-500" />
          <span className="truncate">{t('aiRoadmap.planTitle')}</span>
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-squircle border border-(--border) bg-(--surface) text-(--text) transition hover:border-(--accent-border) hover:text-(--accent)"
            aria-label={t('aiRoadmap.hideManager')}
            title={t('aiRoadmap.hideManager')}
          >
            <HugeiconsIcon icon={SidebarRightIcon} size={18} />
          </button>
        ) : null}
      </div>
      <p className="text-sm leading-6 text-(--text)">
        {!isAuthenticated
          ? t('aiRoadmap.guestPlan')
          : access?.subscription.isSubscriber
            ? t('aiRoadmap.proPlan')
            : t('aiRoadmap.freePlan')}
      </p>

      {isAuthenticated ? (
        <div className="grid gap-2 min-[460px]:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="grid min-h-20 gap-1 rounded-xl border border-(--border) bg-(--surface) p-3">
            <span className="text-2xl font-semibold leading-none text-(--text-h)">
              {access?.usage.draftsRemaining ?? 0}
            </span>
            <span className="text-xs leading-5 text-(--text)">
              {t('aiRoadmap.draftsLeftShort', {
                limit: access?.usage.draftLimit ?? access?.usage.freeDraftLimit ?? 0,
              })}
            </span>
          </div>
          <div className="grid min-h-20 gap-1 rounded-xl border border-(--border) bg-(--surface) p-3">
            <span className="text-2xl font-semibold leading-none text-(--text-h)">
              {userAiRoadmaps.length}
            </span>
            <span className="text-xs leading-5 text-(--text)">
              {t('aiRoadmap.savedMetric')}
            </span>
          </div>
          <div className="grid min-h-20 gap-1 rounded-xl border border-(--border) bg-(--surface) p-3">
            <span className="text-2xl font-semibold leading-none text-(--text-h)">
              {sharedUserRoadmaps.length}
            </span>
            <span className="text-xs leading-5 text-(--text)">
              {t('aiRoadmap.sharedMetric')}
            </span>
          </div>
        </div>
      ) : null}

      {isAuthenticated && access && !access.capabilities.canGenerateDraft ? (
        <p className="rounded-squircle border border-(--border) px-3 py-2 text-sm text-(--text)">
          {t('aiRoadmap.limitReached')}
        </p>
      ) : null}

      {isAuthenticated ? (
        <section className="grid gap-3 border-t border-(--border) pt-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-(--text)">
              {t('aiRoadmap.yourGeneratedPlans')}
            </h3>
            <p className="mt-1 text-xs leading-5 text-(--text)">
              {t('aiRoadmap.yourGeneratedPlansHint')}
            </p>
          </div>
          {roadmapsQuery.isLoading ? (
            <p className="rounded-squircle border border-(--border) bg-(--surface) p-3 text-sm text-(--text)">
              {t('aiRoadmap.loadingPlans')}
            </p>
          ) : userAiRoadmaps.length ? (
            <ul className="grid max-h-88 gap-2 overflow-y-auto pr-1">
              {userAiRoadmaps.map(renderUserRoadmap)}
            </ul>
          ) : (
            <p className="rounded-squircle border border-(--border) bg-(--surface) p-3 text-sm leading-6 text-(--text)">
              {t('aiRoadmap.emptyGeneratedPlans')}
            </p>
          )}
        </section>
      ) : (
        <p className="rounded-squircle border border-(--border) bg-(--surface) p-3 text-sm leading-6 text-(--text)">
          {t('aiRoadmap.loginToManage')}
        </p>
      )}

      <section className="grid gap-3 border-t border-(--border) pt-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-(--text)">
            {t('aiRoadmap.sharedPlans')}
          </h3>
          <p className="mt-1 text-xs leading-5 text-(--text)">
            {t('aiRoadmap.sharedPlansHint')}
          </p>
        </div>
        {publicAiRoadmapsQuery.isLoading ? (
          <p className="rounded-squircle border border-(--border) bg-(--surface) p-3 text-sm text-(--text)">
            {t('aiRoadmap.loadingSharedPlans')}
          </p>
        ) : publicAiRoadmaps.length ? (
          <ul className="grid max-h-64 gap-2 overflow-y-auto pr-1">
            {publicAiRoadmaps.map(renderPublicRoadmap)}
          </ul>
        ) : (
          <p className="rounded-squircle border border-(--border) bg-(--surface) p-3 text-sm leading-6 text-(--text)">
            {t('aiRoadmap.emptySharedPlans')}
          </p>
        )}
      </section>
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--border) bg-(--surface) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) hover:text-(--accent)"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
          {t('aiRoadmap.hideManager')}
        </button>
      ) : null}
    </aside>
  )
}
