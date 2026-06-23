import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, Cancel01Icon, Route03Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import type { AiRecommendationsData } from '../../libs/user-api'
import { AiRecommendationCardsGrid } from '../dashboard/DashboardRecommendations'
import ThreeSceneLoader from '../ui/ThreeSceneLoader'

type RoadmapCompletionPopupProps = {
  open: boolean
  roadmapTitle: string
  recommendations?: AiRecommendationsData
  isLoadingRecommendations: boolean
  onClose: () => void
}

export function RoadmapCompletionPopup({
  open,
  roadmapTitle,
  recommendations,
  isLoadingRecommendations,
  onClose,
}: RoadmapCompletionPopupProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-120 grid place-items-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm">
      <section className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-(--accent-border) bg-(--surface) shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          className="absolute inset-e-4 top-4 z-10 grid size-10 cursor-pointer place-items-center rounded-squircle border border-(--border) bg-(--surface-2) text-(--text-h) transition hover:border-(--accent-border)"
          aria-label={t('adminUi.common.close', 'Close')}
          onClick={onClose}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid content-center gap-4 pe-10 lg:pe-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
              {t('roadmapDetail.completionPopup.overline')}
            </p>
            <div>
              <h2 className="text-3xl font-semibold leading-tight text-(--text-h)">
                {t('roadmapDetail.completionPopup.title')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text)">
                {t('roadmapDetail.completionPopup.subtitle', { roadmap: roadmapTitle })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/${language}/dashboard`}
                className="inline-flex items-center gap-2 rounded-squircle bg-(--accent) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
                onClick={onClose}
              >
                <HugeiconsIcon icon={Route03Icon} size={17} />
                {t('roadmapDetail.completionPopup.dashboard')}
              </Link>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) hover:bg-(--surface-2)"
                onClick={onClose}
              >
                {t('roadmapDetail.completionPopup.keepViewing')}
              </button>
            </div>
          </div>

          <div className="relative min-h-64 overflow-hidden rounded-lg border border-(--border) bg-(--surface-2)">
            <ThreeSceneLoader cycleDurationMs={1700} />
          </div>
        </div>

        <div className="border-t border-(--border) bg-(--surface-2) p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-(--text)">
                {t('roadmapDetail.completionPopup.nextTitle')}
              </h3>
              <p className="mt-1 text-sm text-(--text)">
                {t('roadmapDetail.completionPopup.nextSubtitle')}
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
    </div>
  )
}
