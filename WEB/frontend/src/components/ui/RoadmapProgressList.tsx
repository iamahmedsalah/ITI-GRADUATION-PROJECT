import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import type { UserRoadmap } from '../../libs/roadmaps-api'

type RoadmapProgressListProps = {
  roadmaps: UserRoadmap[]
}

export default function RoadmapProgressList({ roadmaps }: RoadmapProgressListProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()

  if (!roadmaps.length) {
    return (
      <div className="rounded-lg border border-(--border) bg-(--surface-2) p-5 text-sm leading-6 text-(--text)">
        {t('profile.roadmapsEmpty')}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {roadmaps.map((roadmap) => {
        const progress = Math.round(roadmap.progressPercent ?? 0)
        const template = roadmap.template

        return (
          <Link
            key={roadmap._id}
            to={`/${language}/roadmaps/${template?.slug ?? 'roadmap'}`}
            className="rounded-lg border border-(--border) bg-(--surface-2) p-4 transition hover:border-(--accent-border)"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-(--text-h)">{template?.title ?? t('profile.unknownRoadmap')}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-(--text)">{roadmap.status ?? 'assigned'}</p>
              </div>
              <span className="text-sm font-semibold text-(--text-h)">{progress}%</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-(--surface-3)">
              <div className="h-full rounded-full bg-(--gd-primary)" style={{ width: `${progress}%` }} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
