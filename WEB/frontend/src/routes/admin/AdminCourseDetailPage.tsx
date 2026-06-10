import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import { fetchAdminCourseDetail } from '../../libs/admin-api'

function formatMinutes(minutes?: number) {
  if (!minutes) return '0m'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export default function AdminCourseDetailPage() {
  const { direction, language } = useLanguage()
  const { t } = useTranslation()
  const { courseId = '' } = useParams()
  const pageVariants = createPageVariants(direction)
  const courseQuery = useQuery({
    queryKey: ['admin', 'courses', courseId],
    queryFn: () => fetchAdminCourseDetail(courseId),
    enabled: Boolean(courseId),
  })
  const course = courseQuery.data
  const sections = course?.sections ?? []

  return (
    <motion.main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <section className="grid gap-5 rounded-3xl border border-(--border) bg-(--surface) p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to={`/${language}/admin/courses`} className="text-sm font-semibold text-(--accent)">
              {t('adminUi.courses.detail.back')}
            </Link>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.courses.detail.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{course?.title ?? t('adminUi.courses.title')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-(--text)">
              {course?.description ?? (courseQuery.isLoading ? t('adminUi.courses.loading') : t('adminUi.common.noData'))}
            </p>
          </div>
          <div className="grid gap-2 text-sm text-(--text)">
            <span className={course?.isPublished ? 'text-(--success)' : 'text-(--error)'}>
              {course?.isPublished ? t('adminUi.courses.status.published') : t('adminUi.courses.status.unpublished')}
            </span>
            <span>{course?.isFeatured ? t('adminUi.courses.status.featured') : t('adminUi.courses.status.notFeatured')}</span>
          </div>
        </div>

        {course?.bannerUrl || course?.thumbnailUrl ? (
          <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface-2)">
            <img src={course.bannerUrl || course.thumbnailUrl} alt={course.title} className="max-h-80 w-full object-cover" />
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-4">
          {[
            [t('adminUi.courses.table.level'), course?.level ?? t('adminUi.common.notAvailable')],
            [t('adminUi.courses.uncategorized'), course?.category ?? t('adminUi.courses.uncategorized')],
            [t('adminUi.courses.detail.duration'), formatMinutes(course?.durationMinutes)],
            [t('adminUi.courses.detail.enrollments'), course?.stats?.enrollmentsCount ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-(--border) bg-(--surface-2) p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-(--text)">{label}</p>
              <p className="mt-2 text-lg font-semibold text-(--text-h)">{value}</p>
            </div>
          ))}
        </div>

        <section className="rounded-lg border border-(--border) bg-(--surface-2) p-5">
          <h2 className="text-lg font-semibold text-(--text-h)">{t('adminUi.courses.detail.sections')}</h2>
          <div className="mt-4 grid gap-3">
            {sections.length ? sections.map((section) => (
              <article key={section.sectionKey || section.title} className="rounded-lg border border-(--border) bg-(--surface) p-4">
                <h3 className="font-semibold text-(--text-h)">{section.title}</h3>
                {section.description ? <p className="mt-2 text-sm leading-6 text-(--text)">{section.description}</p> : null}
                <div className="mt-3 grid gap-2">
                  {(section.lessons ?? []).map((lesson) => (
                    <div key={lesson.lessonKey || lesson.title} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-(--surface-2) px-3 py-2 text-sm">
                      <span className="font-medium text-(--text-h)">{lesson.title}</span>
                      <span className="text-(--text)">{formatMinutes(lesson.durationMinutes)}</span>
                    </div>
                  ))}
                </div>
              </article>
            )) : (
              <p className="text-sm text-(--text)">{t('adminUi.courses.detail.noSections')}</p>
            )}
          </div>
        </section>
      </section>
    </motion.main>
  )
}
