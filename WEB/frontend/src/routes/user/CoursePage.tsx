import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  Clock01Icon,
  Layers01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { fetchPublishedCourseBySlug } from '../../libs/courses-api'

function formatDuration(minutes?: number) {
  const value = Math.max(Number(minutes) || 0, 0)
  if (!value) return ''

  const hours = Math.floor(value / 60)
  const remaining = value % 60

  if (!hours) return `${remaining}m`
  if (!remaining) return `${hours}h`
  return `${hours}h ${remaining}m`
}

export default function CoursePage() {
  const { t } = useTranslation()
  const { language, direction } = useLanguage()
  const { slug = '' } = useParams()

  const courseQuery = useQuery({
    queryKey: ['courses', 'published', slug],
    queryFn: () => fetchPublishedCourseBySlug(slug),
    enabled: Boolean(slug),
  })

  const course = courseQuery.data
  const duration = formatDuration(course?.durationMinutes)

  return (
    <main className="min-h-screen bg-(--bg) px-4 py-8 text-(--text-h) sm:px-6 lg:px-8" dir={direction}>
      <div className="mx-auto grid max-w-5xl gap-6">
        <Link
          to={`/${language}/roadmaps`}
          className="inline-flex w-fit items-center gap-2 rounded-squircle border border-(--border) bg-(--surface) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border)"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={17} />
          {t('courseDetail.back')}
        </Link>

        {courseQuery.isLoading ? (
          <section className="rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
            <p className="text-sm text-(--text)">{t('courseDetail.loading')}</p>
          </section>
        ) : courseQuery.isError || !course ? (
          <section className="rounded-xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
            <h1 className="text-2xl font-bold text-(--text-h)">{t('courseDetail.notFoundTitle')}</h1>
            <p className="mt-2 text-sm leading-7 text-(--text)">{t('courseDetail.notFoundText')}</p>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-(--shadow)">
              {course.bannerUrl || course.thumbnailUrl ? (
                <img
                  src={course.bannerUrl || course.thumbnailUrl}
                  alt=""
                  className="h-56 w-full object-cover"
                />
              ) : null}
              <div className="p-6">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
                  <HugeiconsIcon icon={BookOpen01Icon} size={17} />
                  {t('courseDetail.overline')}
                </p>
                <h1 className="mt-3 text-3xl font-bold text-(--text-h) sm:text-4xl">{course.title}</h1>
                <p className="mt-4 text-sm leading-7 text-(--text)">
                  {course.description || course.shortDescription || t('courseDetail.descriptionFallback')}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {course.level ? (
                    <span className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1 text-xs font-semibold text-(--text-h)">
                      {course.level}
                    </span>
                  ) : null}
                  {course.category ? (
                    <span className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1 text-xs font-semibold text-(--text-h)">
                      {course.category}
                    </span>
                  ) : null}
                  {duration ? (
                    <span className="inline-flex items-center gap-1 rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1 text-xs font-semibold text-(--text-h)">
                      <HugeiconsIcon icon={Clock01Icon} size={14} />
                      {duration}
                    </span>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-(--text-h)">
                  <HugeiconsIcon icon={StarIcon} size={18} />
                  {t('courseDetail.outcomes')}
                </h2>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-(--text)">
                  {(course.learningOutcomes?.length ? course.learningOutcomes : [t('courseDetail.outcomesFallback')]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-(--text-h)">
                  <HugeiconsIcon icon={Layers01Icon} size={18} />
                  {t('courseDetail.prerequisites')}
                </h2>
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-(--text)">
                  {(course.prerequisites?.length ? course.prerequisites : [t('courseDetail.prerequisitesFallback')]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="grid gap-4">
              <h2 className="text-2xl font-bold text-(--text-h)">{t('courseDetail.sections')}</h2>
              {course.sections?.length ? (
                course.sections.map((section, index) => (
                  <article key={section.sectionKey || section.title} className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
                      {t('courseDetail.sectionNumber', { count: index + 1 })}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-(--text-h)">{section.title}</h3>
                    {section.description ? (
                      <p className="mt-2 text-sm leading-6 text-(--text)">{section.description}</p>
                    ) : null}
                    {section.lessons?.length ? (
                      <ul className="mt-4 grid gap-2">
                        {section.lessons.map((lesson) => (
                          <li key={lesson.lessonKey} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-(--text-h)">{lesson.title}</span>
                              {lesson.durationMinutes ? (
                                <span className="text-xs text-(--text)">{formatDuration(lesson.durationMinutes)}</span>
                              ) : null}
                            </div>
                            {lesson.summary ? (
                              <p className="mt-1 text-sm leading-6 text-(--text)">{lesson.summary}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-(--border) bg-(--surface) p-5 text-sm text-(--text) shadow-(--shadow)">
                  {t('courseDetail.emptySections')}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
