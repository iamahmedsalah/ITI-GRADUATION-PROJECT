import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import type { RoadmapTemplate } from '../../types/roadmap'

type Props = {
  template: RoadmapTemplate | null
  progressPercent: number
  isAuthenticated: boolean
}

export function RoadmapHeader({ template, progressPercent, isAuthenticated }: Props) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  return (
    <section className="rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
      <Link
        to={`/${language}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--accent) hover:underline"
      >
        ← {t('roadmapDetail.backToRoadmaps')}
      </Link>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-end">
        {/* Title + description */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--text)">
            {t('roadmapDetail.badge')}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-(--text-h) lg:text-5xl">
            {template?.title ?? t('roadmapDetail.loading')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-(--text)">
            {template?.goal || template?.description || t('roadmapDetail.subtitleFallback')}
          </p>
        </div>

        {/* Progress widget */}
        <div className="rounded-squircle border border-(--border) bg-(--surface-2) p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-(--text-h)">
              {t('roadmapDetail.progress')}
            </span>
            <span className="tabular-nums text-sm text-(--text)">
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 mb-2 h-2.5 overflow-hidden rounded-full bg-(--surface-3)"
          >
            <div
              className="h-full rounded-full bg-(--gd-primary) transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {!isAuthenticated ? (
            <Link
              to={`/${language}/login`}
              className="mt-4  inline-flex text-sm font-semibold text-(--accent) hover:underline"
            >
              {t('roadmapDetail.signInToTrack')}
            </Link>
          ) : (
            <p className="mt-3 text-xs text-(--text)">
              {progressPercent === 100
                ? '🎉 Roadmap complete!'
                : progressPercent > 0
                  ? `Keep going — you're making great progress`
                  : 'Click a step to get started'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
