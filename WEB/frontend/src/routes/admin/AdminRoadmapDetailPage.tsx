import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchAdminRoadmapDetail } from '../../libs/admin-api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminRoadmapDetailPage() {
  const { templateId = '' } = useParams()
  const { language } = useLanguage()
  const { t } = useTranslation()

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['admin', 'roadmaps', 'detail', templateId],
    queryFn: () => fetchAdminRoadmapDetail(templateId),
    enabled: Boolean(templateId),
  })

  return (
    <main className="px-6 py-6 lg:px-8 lg:py-8">
      <section className="grid gap-5 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
        <Link to={`/${language}/admin/roadmaps`} className="text-sm font-semibold text-(--gd-primary) hover:underline">
          {t('adminUi.roadmaps.detail.back')}
        </Link>

        {isLoading ? (
          <p className="text-(--text)">{t('adminUi.roadmaps.loading')}</p>
        ) : roadmap ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{roadmap.slug}</p>
                <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{roadmap.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-(--text)">{roadmap.goal || roadmap.description}</p>
              </div>
              <span className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
                {roadmap.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.detail.assigned')}</p>
                <p className="mt-2 text-3xl font-bold text-(--text-h)">{roadmap.assignedUsers ?? 0}</p>
              </article>
              <article className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.detail.steps')}</p>
                <p className="mt-2 text-3xl font-bold text-(--text-h)">{roadmap.steps?.length ?? 0}</p>
              </article>
              <article className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.detail.stepProgress')}</p>
                <p className="mt-2 text-3xl font-bold text-(--text-h)">{roadmap.totalStepProgressRecords ?? 0}</p>
              </article>
            </div>

            <div className="overflow-hidden rounded-2xl border border-(--border)">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-(--surface-soft)">
                  <tr className="text-left text-(--text)">
                    <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.detail.step')}</th>
                    <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.detail.dependencies')}</th>
                    <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.detail.resources')}</th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.steps?.length ? roadmap.steps.map((step) => (
                    <tr key={step.stepKey} className="border-t border-(--border)">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-(--text-h)">{step.title}</p>
                        <p className="mt-1 text-xs text-(--text)">{step.description || step.stepKey}</p>
                      </td>
                      <td className="px-4 py-4 text-(--text)">{step.dependsOn?.join(', ') || t('adminUi.common.notAvailable')}</td>
                      <td className="px-4 py-4 text-(--text)">{step.resources?.length ?? 0}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-6 text-(--text)" colSpan={3}>{t('adminUi.roadmaps.detail.noSteps')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-(--text)">{t('adminUi.roadmaps.empty')}</p>
        )}
      </section>
    </main>
  )
}
