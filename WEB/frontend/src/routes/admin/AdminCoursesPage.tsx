import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourses,
  updateAdminCourse,
} from '../../libs/admin-api'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export default function AdminCoursesPage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [isPublished, setIsPublished] = useState('')
  const [isFeatured, setIsFeatured] = useState('')

  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newShortDescription, setNewShortDescription] = useState('')
  const [newLevel, setNewLevel] = useState<CourseLevel>('beginner')
  const [newCategory, setNewCategory] = useState('')
  const [newPublished, setNewPublished] = useState(false)
  const [newFeatured, setNewFeatured] = useState(false)

  const queryKey = useMemo(
    () => ['admin', 'courses', search, level, isPublished, isFeatured],
    [search, level, isPublished, isFeatured],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminCourses({
        q: search || undefined,
        level: level || undefined,
        isPublished: isPublished || undefined,
        isFeatured: isFeatured || undefined,
      }),
    staleTime: 0,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
  }

  const createMutation = useMutation({
    mutationFn: createAdminCourse,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setNewTitle('')
      setNewSlug('')
      setNewDescription('')
      setNewShortDescription('')
      setNewCategory('')
      setNewLevel('beginner')
      setNewPublished(false)
      setNewFeatured(false)
      refresh()
    },
    onError: () => toast.error(t('adminUi.courses.createFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      courseId,
      payload,
    }: {
      courseId: string
      payload: Partial<{
        title: string
        slug: string
        description: string
        shortDescription: string
        level: CourseLevel
        category: string
        isPublished: boolean
        isFeatured: boolean
      }>
    }) => updateAdminCourse(courseId, payload),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      refresh()
    },
    onError: () => toast.error(t('adminUi.courses.updateFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCourse,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      refresh()
    },
    onError: () => toast.error(t('adminUi.courses.deleteFailed')),
  })

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <section className="grid gap-5 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.courses.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{t('adminUi.courses.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">{t('adminUi.courses.subtitle')}</p>
          </div>
          <div className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {isFetching ? t('adminUi.common.refreshing') : data ? t('adminUi.courses.total', { count: data.pagination.total }) : t('adminUi.common.noData')}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) p-4 md:grid-cols-2">
          <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder={t('adminUi.courses.form.title')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={newSlug} onChange={(event) => setNewSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder={t('adminUi.courses.form.slug')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <textarea value={newDescription} onChange={(event) => setNewDescription(event.target.value)} placeholder={t('adminUi.courses.form.description')} rows={3} className="rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <input value={newShortDescription} onChange={(event) => setNewShortDescription(event.target.value)} placeholder={t('adminUi.courses.form.shortDescription')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={t('adminUi.courses.form.category')} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <select value={newLevel} onChange={(event) => setNewLevel(event.target.value as CourseLevel)} className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="beginner">{t('adminUi.levels.beginner')}</option>
            <option value="intermediate">{t('adminUi.levels.intermediate')}</option>
            <option value="advanced">{t('adminUi.levels.advanced')}</option>
          </select>
          <div className="flex items-center gap-4 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h)">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={newPublished} onChange={(event) => setNewPublished(event.target.checked)} />
              <span>{t('adminUi.courses.form.published')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={newFeatured} onChange={(event) => setNewFeatured(event.target.checked)} />
              <span>{t('adminUi.courses.form.featured')}</span>
            </label>
          </div>
          <button
            type="button"
            disabled={createMutation.isPending}
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-(--gd-primary) px-5 py-3 text-sm font-semibold uppercase tracking-[0.04em] text-white shadow-[0_12px_24px_rgba(29,185,84,0.22)] transition-transform duration-200 hover:scale-[1.04] hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            onClick={() => {
              if (newTitle.trim().length < 3 || newSlug.trim().length < 3 || newDescription.trim().length < 10) {
                toast.error(t('adminUi.courses.form.invalid'))
                return
              }

              createMutation.mutate({
                title: newTitle.trim(),
                slug: newSlug.trim(),
                description: newDescription.trim(),
                shortDescription: newShortDescription.trim() || undefined,
                category: newCategory.trim() || undefined,
                level: newLevel,
                isPublished: newPublished,
                isFeatured: newFeatured,
              })
            }}
          >
            {createMutation.isPending ? t('adminUi.common.creating') : t('adminUi.courses.form.create')}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminUi.courses.searchPlaceholder')} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <select value={level} onChange={(event) => setLevel(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.courses.filters.allLevels')}</option>
            <option value="beginner">{t('adminUi.levels.beginner')}</option>
            <option value="intermediate">{t('adminUi.levels.intermediate')}</option>
            <option value="advanced">{t('adminUi.levels.advanced')}</option>
          </select>
          <select value={isPublished} onChange={(event) => setIsPublished(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.courses.filters.allPublish')}</option>
            <option value="true">{t('adminUi.courses.status.published')}</option>
            <option value="false">{t('adminUi.courses.status.unpublished')}</option>
          </select>
          <select value={isFeatured} onChange={(event) => setIsFeatured(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.courses.filters.allFeatured')}</option>
            <option value="true">{t('adminUi.courses.status.featured')}</option>
            <option value="false">{t('adminUi.courses.status.notFeatured')}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-(--surface-soft)">
              <tr className="text-left text-(--text)">
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.course')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.level')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.owner')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={5}>{t('adminUi.courses.loading')}</td></tr>
              ) : data?.data.length ? data.data.map((course) => (
                <tr key={course._id} className="border-t border-(--border)">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-(--text-h)">{course.title}</div>
                    <div className="text-xs text-(--text)">{course.slug} | {course.category || t('adminUi.courses.uncategorized')}</div>
                  </td>
                  <td className="px-4 py-4 text-(--text)">{course.level || t('adminUi.common.notAvailable')}</td>
                  <td className="px-4 py-4 text-(--text)">
                    {course.isPublished ? t('adminUi.courses.status.published') : t('adminUi.courses.status.unpublished')} | {course.isFeatured ? t('adminUi.courses.status.featured') : t('adminUi.courses.status.notFeatured')}
                  </td>
                  <td className="px-4 py-4 text-(--text)">{course.instructor?.username || course.instructor?.email || t('adminUi.courses.unknownOwner')}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            courseId: course._id,
                            payload: { isPublished: !course.isPublished },
                          })
                        }}
                      >
                        {course.isPublished ? t('adminUi.courses.actions.unpublish') : t('adminUi.courses.actions.publish')}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            courseId: course._id,
                            payload: { isFeatured: !course.isFeatured },
                          })
                        }}
                      >
                        {course.isFeatured ? t('adminUi.courses.actions.unfeature') : t('adminUi.courses.actions.feature')}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          const nextTitle = window.prompt(t('adminUi.courses.actions.renamePrompt'), course.title)?.trim()
                          if (!nextTitle || nextTitle.length < 3) {
                            return
                          }

                          updateMutation.mutate({
                            courseId: course._id,
                            payload: { title: nextTitle },
                          })
                        }}
                      >
                        {t('adminUi.courses.actions.rename')}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-[rgba(226,33,52,0.4)] px-3 py-2 text-xs font-semibold text-[#ffb8c0] transition-transform duration-200 hover:scale-[1.04] hover:bg-[rgba(226,33,52,0.08)]"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          const confirmed = window.confirm(t('adminUi.courses.actions.deleteConfirm', { title: course.title }))
                          if (!confirmed) {
                            return
                          }

                          deleteMutation.mutate(course._id)
                        }}
                      >
                        {t('adminUi.courses.actions.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={5}>{t('adminUi.courses.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.main>
  )
}
