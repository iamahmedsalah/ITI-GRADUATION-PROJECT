import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { Route03Icon, StarIcon } from '@hugeicons/core-free-icons'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../../context/LanguageContext'
import {
  assignRoadmap,
  deleteUserRoadmap,
  fetchRoadmapTemplates,
  fetchUserRoadmaps,
  searchRoadmaps,
  type RoadmapTemplate,
} from '../../libs/roadmaps-api'
import {SeparatorRoadmaps,SeparatorCourses} from '../ui/saparator'
import AvailableCoursesSection from './AvailableCoursesSection'

function uniqueBySlug(roadmaps: RoadmapTemplate[]) {
  const seen = new Set<string>()

  return roadmaps.filter((roadmap) => {
    const key = roadmap.slug || roadmap._id
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function formatLevel(level?: string) {
  if (!level) {
    return 'Roadmap'
  }

  return level.charAt(0).toUpperCase() + level.slice(1)
}

type RoadmapCardProps = {
  roadmap: RoadmapTemplate
}

export function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const tags = roadmap.tags?.slice(0, 2) ?? []
  const userRoadmapsQuery = useQuery({
    queryKey: ['roadmaps', 'mine'],
    queryFn: fetchUserRoadmaps,
    retry: false,
    staleTime: 10_000,
  })
  const starredRoadmap = (userRoadmapsQuery.data ?? []).find(
    (userRoadmap) => userRoadmap.status === 'assigned' && userRoadmap.template?._id === roadmap._id,
  )
  const isStarred = Boolean(starredRoadmap)
  const starMutation = useMutation({
    mutationFn: async () => {
      if (starredRoadmap?._id) {
        await deleteUserRoadmap(starredRoadmap._id)
        return true
      }

      await assignRoadmap(roadmap._id)
      return true
    },
    onSuccess: async () => {
      toast.success(
        isStarred
          ? t('landing.unstarredRoadmap', { defaultValue: 'Roadmap removed from starred.' })
          : t('landing.savedRoadmap', { defaultValue: 'Roadmap starred in your profile.' }),
      )
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('landing.saveFailed', { defaultValue: 'Could not save roadmap.' }))
    },
  })

  return (
    <article className="group flex min-h-16 items-center justify-between gap-3 rounded-squircle border border-(--border) bg-(--surface) px-4 py-4 text-left text-(--text-h) shadow-(--shadow) transition duration-200 hover:-translate-y-1 hover:border-(--accent-border) hover:bg-(--surface-soft-hover)">
      <Link to={`/${language}/roadmaps/${roadmap.slug}`} className="min-w-0 flex-1">
        <span className="block truncate text-lg font-medium text-(--text-h)">{roadmap.title}</span>
        <span className="mt-1 flex flex-wrap gap-2 text-xs text-(--text)">
          <span>
            {t(`landing.levels.${roadmap.targetLevel ?? 'roadmap'}`, { defaultValue: formatLevel(roadmap.targetLevel) })}
          </span>
          {tags.map((tag) => <span key={tag}>#{tag}</span>)}
        </span>
      </Link>
      <button
        type="button"
        disabled={starMutation.isPending}
        data-starred={isStarred}
        className={[
          'star-toggle-button grid size-9 shrink-0 cursor-pointer place-items-center rounded-squircle border transition disabled:cursor-not-allowed disabled:opacity-60',
          isStarred
            ? 'border-(--accent-border) bg-(--accent-bg) text-(--accent)'
            : 'border-(--border) text-(--text) hover:border-(--accent-border) hover:bg-(--accent-bg) hover:text-(--accent)',
        ].join(' ')}
        aria-label={isStarred
          ? t('landing.unstar', { defaultValue: 'Unstar roadmap' })
          : t('landing.save', { defaultValue: 'Star roadmap' })}
        title={isStarred
          ? t('landing.unstar', { defaultValue: 'Unstar roadmap' })
          : t('landing.save', { defaultValue: 'Star roadmap' })}
        onClick={() => starMutation.mutate()}
      >
        <HugeiconsIcon icon={StarIcon} size={17} className={isStarred ? 'star-toggle-icon star-toggle-icon-active' : 'star-toggle-icon'} />
      </button>
      <Link
        to={`/${language}/roadmaps/${roadmap.slug}`}
        className="grid size-9 shrink-0 place-items-center rounded-squircle border border-(--border) text-(--text) transition group-hover:border-(--accent-border) group-hover:text-(--accent)"
        aria-label={roadmap.title}
      >
        <HugeiconsIcon icon={Route03Icon} size={17} />
      </Link>
    </article>
  )
}


function RoadmapListSkeleton() {
  const { t } = useTranslation()

  return (
    <div
      className="rounded-lg border border-(--border) bg-(--surface) p-4 shadow-(--shadow)"
      role="status"
      aria-live="polite"
      aria-label={t('landing.loadingRoadmaps')}
    >
      <div className="mb-5 flex items-center gap-3 text-sm font-medium text-(--text-h)">
        <span className="size-4 animate-spin rounded-full border-2 border-(--border) border-t-(--accent)" />
        <span>{t('landing.loadingRoadmaps')}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className={[
              'h-14 overflow-hidden rounded-squircle border border-(--border)',
              'bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-2)_42%,var(--surface)_100%)]',
              'relative before:absolute before:inset-0 before:-translate-x-full',
              'before:animate-[shimmer_1.8s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  )
}

export default function RoadmapLanding() {
  const { t } = useTranslation()
  const { direction, language } = useLanguage()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const selectedType = searchParams.get('type') === 'skillBased'
    ? 'skillBased'
    : searchParams.get('type') === 'roleBased'
      ? 'roleBased'
      : null

  const templatesQuery = useQuery({
    queryKey: ['roadmaps', 'templates', 50, selectedType],
    queryFn: () => fetchRoadmapTemplates(50, selectedType ?? undefined),
    staleTime: 60_000,
  })

  const searchQuery = useQuery({
    queryKey: ['roadmaps', 'search', trimmedQuery, selectedType],
    queryFn: () => searchRoadmaps(trimmedQuery, 18, selectedType ?? undefined),
    enabled: trimmedQuery.length > 0,
    staleTime: 30_000,
  })

  const searchRoadmapsList = useMemo(() => {
    const roadmaps = trimmedQuery ? searchQuery.data?.roadmaps ?? [] : templatesQuery.data ?? []

    return uniqueBySlug(roadmaps).slice(0, 18)
  }, [searchQuery.data?.roadmaps, templatesQuery.data, trimmedQuery])
  const groupedRoadmaps = useMemo(() => {
    const templates = uniqueBySlug(templatesQuery.data ?? [])

    return {
      roleBased: templates.filter((roadmap) => (roadmap.templateType ?? 'roleBased') === 'roleBased').slice(0, 30),
      skillBased: templates.filter((roadmap) => roadmap.templateType === 'skillBased').slice(0, 30),
    }
  }, [templatesQuery.data])
  const topicResults = searchQuery.data?.topics?.slice(0, 6) ?? []
  const isSearching = trimmedQuery.length > 0 && searchQuery.isFetching
  const isRoadmapListLoading = trimmedQuery ? searchQuery.isLoading : templatesQuery.isLoading

  return (
    <section className="bg-(--bg) text-(--text-h)" dir={direction}>
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl flex-col px-6 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-(--accent)">
            {t('landing.badge')}
          </p>
          <h1 className="text-5xl font-extrabold leading-tight text-(--text-h) sm:text-6xl lg:text-7xl">
            {t('landing.roadmapsTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-5xl text-balance text-xl leading-9 text-(--text)">
            {t('landing.roadmapsSubtitle')}
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-3xl">
          <label className="sr-only" htmlFor="roadmap-search">
            {t('landing.searchLabel')}
          </label>
          <div className="flex items-center gap-3 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 shadow-(--shadow)">
            <span aria-hidden="true" className="relative size-4 rounded-full border-2 border-(--text) after:absolute after:-bottom-1 after:-right-1 after:h-2 after:w-0.5 after:-rotate-45 after:rounded-full after:bg-(--text)" />
            <input
              id="roadmap-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('landing.searchPlaceholder')}
              className="min-w-0 flex-1 bg-transparent text-base text-(--text-h) outline-none placeholder:text-(--text)"
            />
            {isSearching ? <span className="text-xs text-(--text)">{t('landing.searching')}</span> : null}
          </div>
        </div>

        <div className="mt-16">
          {isRoadmapListLoading ? (
            <RoadmapListSkeleton />
          ) : trimmedQuery ? (
            <SeparatorRoadmaps title={t('landing.searchResults')} roadmaps={searchRoadmapsList} />
          ) : (
            <div className="grid gap-16">
              {selectedType !== 'skillBased' ? (
                <SeparatorRoadmaps title={t('landing.roleRoadmaps')} roadmaps={groupedRoadmaps.roleBased} />
              ) : null}
              {selectedType !== 'roleBased' ? (
                <SeparatorRoadmaps title={t('landing.skillRoadmaps')} roadmaps={groupedRoadmaps.skillBased} />
              ) : null}
            </div>
          )}

                  <SeparatorCourses/>

        <AvailableCoursesSection />
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-squircle border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
              {t('landing.templateSectionLabel')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-(--text-h)">
              {t('landing.templateSectionTitle')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-(--text)">
              {t('landing.templateSectionText')}
            </p>
          </section>

          <section className="rounded-squircle border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
              {t('landing.topicSectionLabel')}
            </p>
            <div className="mt-4 grid gap-3">
              {topicResults.length ? (
                topicResults.map((topic) => (
                  <Link
                    key={`${topic.templateSlug}-${topic.topic.stepKey}`}
                    to={`/${language}/roadmaps/${topic.templateSlug}`}
                    className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) transition hover:border-(--accent-border)"
                  >
                    <span className="block font-semibold text-(--text-h)">{topic.topic.title}</span>
                    <span className="mt-1 block text-(--text)">{topic.templateTitle}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm leading-6 text-(--text)">
                  {t('landing.topicSectionText')}
                </p>
              )}
            </div>
          </section>
        </div>


      </div>
    </section>
  )
}
