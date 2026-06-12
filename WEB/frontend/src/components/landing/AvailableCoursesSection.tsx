import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { CourseIcon } from '@hugeicons/core-free-icons'
import { fetchPublishedCourses, type PublicCourse } from '../../libs/courses-api'

function formatDuration(minutes?: number) {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function CourseCard({ course }: { course: PublicCourse }) {
  const { t } = useTranslation()
  const tags = course.tags?.slice(0, 2) ?? []

  return (
    <article className="overflow-hidden rounded-lg border border-(--border) bg-(--surface) shadow-(--shadow)">
      <div className="aspect-16/8 bg-(--surface-2)">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-(--accent)">
            <HugeiconsIcon icon={CourseIcon} size={34} />
          </div>
        )}
      </div>
      <div className="grid gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold text-(--text-h)">{course.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-(--text)">
            {course.shortDescription || course.description || t('landing.coursesFallback')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-(--text)">
          {course.level ? <span className="rounded-md bg-(--surface-2) px-2 py-1">{course.level}</span> : null}
          {formatDuration(course.durationMinutes) ? <span className="rounded-md bg-(--surface-2) px-2 py-1">{formatDuration(course.durationMinutes)}</span> : null}
          {tags.map((tag) => (
            <span key={tag} className="rounded-md bg-(--surface-2) px-2 py-1">#{tag}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function AvailableCoursesSection() {
  const { t } = useTranslation()
  const coursesQuery = useQuery({
    queryKey: ['courses', 'published', 6],
    queryFn: () => fetchPublishedCourses(6),
    staleTime: 60_000,
  })
  const courses = coursesQuery.data ?? []

  if (!coursesQuery.isLoading && !courses.length) {
    return null
  }

  return (
    <section id="courses" className="mt-16 scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">{t('landing.coursesBadge')}</p>
          <h2 className="mt-3 text-3xl font-semibold text-(--text-h)">{t('landing.coursesTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text)">{t('landing.coursesSubtitle')}</p>
        </div>
      </div>
      {coursesQuery.isLoading ? (
        <div className="rounded-lg border border-(--border) bg-(--surface) p-5 text-sm text-(--text)">
          {t('landing.loadingCourses')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => <CourseCard key={course._id} course={course} />)}
        </div>
      )}
    </section>
  )
}
