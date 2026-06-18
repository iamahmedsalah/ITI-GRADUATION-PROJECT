import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchAdminRoadmapDetail } from '../../libs/admin-api'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminRoadmapDetailPage() {
  const { templateId = '' } = useParams()
  const { language } = useLanguage()
  const { t } = useTranslation()
  const [showAssignedUsers, setShowAssignedUsers] = useState(false)

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

            <div className="grid gap-3 md:grid-cols-4">
              <button
                type="button"
                className="rounded-squircle border border-(--border) bg-(--surface-2) p-4 text-left transition hover:border-(--accent-border)"
                onClick={() => setShowAssignedUsers((value) => !value)}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.detail.assigned')}</p>
                <p className="mt-2 text-3xl font-bold text-(--text-h)">{roadmap.assignedUsers ?? 0}</p>
                <p className="mt-1 text-xs text-(--accent)">
                  {showAssignedUsers ? t('adminUi.common.hide', 'Hide') : t('adminUi.common.view', 'View')}
                </p>
              </button>
              <article className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.detail.steps')}</p>
                <p className="mt-2 text-3xl font-bold text-(--text-h)">{roadmap.steps?.length ?? 0}</p>
              </article>
              <article className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.detail.stepProgress')}</p>
                <p className="mt-2 text-3xl font-bold text-(--text-h)">{roadmap.totalStepProgressRecords ?? 0}</p>
              </article>
              <article className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{t('adminUi.roadmaps.table.source', 'Source')}</p>
                <p className="mt-2 text-lg font-bold uppercase text-(--text-h)">{roadmap.displaySource ?? roadmap.source ?? 'manual'}</p>
                <p className="mt-1 truncate text-xs text-(--text)">
                  {roadmap.owner
                    ? roadmap.owner.username || roadmap.owner.email
                    : roadmap.createdBy?.username || roadmap.createdBy?.email || t('adminUi.common.notAvailable')}
                </p>
              </article>
            </div>

            {showAssignedUsers ? (
              <section className="rounded-2xl border border-(--border) bg-(--surface-2) p-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-(--text-h)">
                    {t('adminUi.roadmaps.detail.assignedUsers', 'Assigned users')}
                  </h2>
                  <span className="text-sm text-(--text)">{roadmap.assignedUsersList?.length ?? 0}</span>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {roadmap.assignedUsersList?.length ? roadmap.assignedUsersList.map((assignment) => (
                    <article key={assignment._id} className="rounded-squircle border border-(--border) bg-(--surface) p-3">
                      <p className="font-semibold text-(--text-h)">
                        {assignment.user?.Fname} {assignment.user?.Lname}
                      </p>
                      <p className="mt-1 text-xs text-(--text)">
                        {assignment.user?.username} | {assignment.user?.email}
                      </p>
                      <p className="mt-2 text-xs text-(--text)">
                        {assignment.status ?? 'assigned'} | {Math.round(assignment.progressPercent ?? 0)}%
                      </p>
                    </article>
                  )) : (
                    <p className="rounded-squircle border border-(--border) bg-(--surface) p-4 text-sm text-(--text) md:col-span-2">
                      {t('adminUi.roadmaps.detail.noAssignedUsers', 'No assigned users yet.')}
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-(--border)">
              <div className="grid gap-3 p-3 lg:hidden">
                {roadmap.steps?.length ? roadmap.steps.map((step) => (
                  <article key={step.stepKey} className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text)">
                      {step.stepKey}
                    </p>
                    <h2 className="mt-2 text-base font-semibold text-(--text-h)">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-(--text)">
                      {step.description || t('adminUi.common.notAvailable')}
                    </p>
                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="rounded-lg border border-(--border) bg-(--surface) p-3">
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-(--text)">
                          {t('adminUi.roadmaps.detail.dependencies')}
                        </span>
                        <span className="mt-1 block wrap-break-word text-(--text-h)">
                          {step.dependsOn?.join(', ') || t('adminUi.common.notAvailable')}
                        </span>
                      </div>
                      <div className="rounded-lg border border-(--border) bg-(--surface) p-3">
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-(--text)">
                          {t('adminUi.roadmaps.detail.resources')}
                        </span>
                        <span className="mt-1 block text-(--text-h)">{step.resources?.length ?? 0}</span>
                      </div>
                    </div>
                  </article>
                )) : (
                  <p className="rounded-squircle border border-(--border) bg-(--surface-2) p-4 text-sm text-(--text)">
                    {t('adminUi.roadmaps.detail.noSteps')}
                  </p>
                )}
              </div>
              <div className="hidden overflow-x-auto lg:block">
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
            </div>
          </>
        ) : (
          <p className="text-(--text)">{t('adminUi.roadmaps.empty')}</p>
        )}
      </section>
    </main>
  )
}
