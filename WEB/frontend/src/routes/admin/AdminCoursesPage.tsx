import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel02Icon, UserEdit01Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourses,
  updateAdminCourse,
} from '../../libs/admin-api'
import type { AdminCourseRow } from '../../libs/admin-api'
import { AdminFilterToggleButton, AdminStatusToggleButton } from '../../components/ui/AdminActionButtons'
import AdminPagination from '../../components/ui/AdminPagination'
import CustomDropdown from '../../components/ui/CustomDropdown'
import AdminCourseFormModal from '../../components/models/AdminCourseFormModal'
import ConfirmActionModal from '../../components/models/ConfirmActionModal'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export default function AdminCoursesPage() {
  const { direction, language } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [isPublished, setIsPublished] = useState('')
  const [isFeatured, setIsFeatured] = useState('')
  const [page, setPage] = useState(1)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<AdminCourseRow | null>(null)
  const [deleteRequest, setDeleteRequest] = useState<{
    ids: string[]
    title: string
    message: string
  } | null>(null)

  const queryKey = useMemo(
    () => ['admin', 'courses', search, level, isPublished, isFeatured, page],
    [search, level, isPublished, isFeatured, page],
  )

  const levelOptions = [
    { value: '', label: t('adminUi.courses.filters.allLevels') },
    { value: 'beginner', label: t('adminUi.levels.beginner') },
    { value: 'intermediate', label: t('adminUi.levels.intermediate') },
    { value: 'advanced', label: t('adminUi.levels.advanced') },
  ]
  const publishOptions = [
    { value: '', label: t('adminUi.courses.filters.allPublish') },
    { value: 'true', label: t('adminUi.courses.status.published') },
    { value: 'false', label: t('adminUi.courses.status.unpublished') },
  ]
  const featuredOptions = [
    { value: '', label: t('adminUi.courses.filters.allFeatured') },
    { value: 'true', label: t('adminUi.courses.status.featured') },
    { value: 'false', label: t('adminUi.courses.status.notFeatured') },
  ]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminCourses({
        q: search || undefined,
        level: level || undefined,
        isPublished: isPublished || undefined,
        isFeatured: isFeatured || undefined,
        page,
        limit: 10,
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
      setIsCreateModalOpen(false)
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
        thumbnailUrl: string | null
        bannerUrl: string | null
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
      setEditingCourse(null)
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
      setSelectedIds((previous) => previous.filter((id) => id !== result.data?._id))
      refresh()
    },
    onError: () => toast.error(t('adminUi.courses.deleteFailed')),
  })

  const visibleCourses = data?.data ?? []
  const allVisibleSelected = visibleCourses.length > 0 && visibleCourses.every((course) => selectedIds.includes(course._id))

  return (
    <motion.main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <AdminCourseFormModal
        key={isCreateModalOpen ? 'open-course-create' : 'closed-course-create'}
        open={isCreateModalOpen}
        mode="create"
        isPending={createMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
      <AdminCourseFormModal
        key={editingCourse?._id ?? 'closed-course-update'}
        open={Boolean(editingCourse)}
        mode="update"
        course={editingCourse}
        isPending={updateMutation.isPending}
        onClose={() => setEditingCourse(null)}
        onSubmit={(payload) => {
          if (!editingCourse) return
          updateMutation.mutate({ courseId: editingCourse._id, payload })
        }}
      />
      <ConfirmActionModal
        open={Boolean(deleteRequest)}
        title={deleteRequest?.title ?? ''}
        message={deleteRequest?.message ?? ''}
        confirmLabel={t('adminUi.common.delete', 'Delete')}
        cancelLabel={t('adminUi.common.cancel', 'Cancel')}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={() => {
          const ids = deleteRequest?.ids ?? []
          ids.forEach((id) => deleteMutation.mutate(id))
          setDeleteRequest(null)
        }}
      />
      <section className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface) p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:gap-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.courses.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{t('adminUi.courses.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">{t('adminUi.courses.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
              {isFetching ? t('adminUi.common.refreshing') : data ? t('adminUi.courses.total', { count: data.pagination.total }) : t('adminUi.common.noData')}
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-squircle cursor-pointer bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
            >
              {t('adminUi.courses.form.add')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {selectedIds.length ? (
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => {
                setDeleteRequest({
                  ids: selectedIds,
                  title: t('adminUi.courses.actions.deleteSelectedTitle', 'Delete selected courses?'),
                  message: t('adminUi.common.bulkDeleteConfirm', {
                    count: selectedIds.length,
                    defaultValue: `You are about to delete ${selectedIds.length} selected item(s). This cannot be undone.`,
                  }),
                })
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.4)] bg-[rgba(226,33,52,0.08)] px-4 py-2 text-sm font-semibold text-(--error)"
            >
              <HugeiconsIcon icon={Cancel02Icon} size={16} />
              {t('adminUi.common.deleteSelected', { count: selectedIds.length })}
            </button>
          ) : null}
          <AdminFilterToggleButton
            open={isFiltersOpen}
            onClick={() => setIsFiltersOpen((previous) => !previous)}
            showLabel={t('adminUi.common.showFilters')}
            hideLabel={t('adminUi.common.hideFilters')}
          />
        </div>

        {isFiltersOpen ? <div className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-muted) p-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('adminUi.courses.searchPlaceholder')}
            className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border)"
          />
          <CustomDropdown value={level} options={levelOptions} onChange={(value) => { setLevel(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={isPublished} options={publishOptions} onChange={(value) => { setIsPublished(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={isFeatured} options={featuredOptions} onChange={(value) => { setIsFeatured(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
        </div> : null}

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <div className="grid gap-3 p-2 sm:p-3 lg:hidden">
            {isLoading ? (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.courses.loading')}
              </div>
            ) : visibleCourses.length ? visibleCourses.map((course) => (
              <article key={course._id} className="grid min-w-0 gap-4 rounded-3xl border border-(--border) bg-(--surface-muted) p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="admin-checkbox mt-1"
                    checked={selectedIds.includes(course._id)}
                    onChange={(event) => {
                      setSelectedIds((previous) =>
                        event.target.checked
                          ? Array.from(new Set([...previous, course._id]))
                          : previous.filter((id) => id !== course._id),
                      )
                    }}
                    aria-label={course.title}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/${language}/admin/courses/${course._id}`} className="wrap-break-word font-semibold text-(--text-h) hover:text-(--accent)">
                      {course.title}
                    </Link>
                    <div className="wrap-break-word text-xs text-(--text)">{course.slug} | {course.category || t('adminUi.courses.uncategorized')}</div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm min-[460px]:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.courses.table.level')}</span>
                    <span className="text-(--text-h)">{course.level || t('adminUi.common.notAvailable')}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.courses.table.owner')}</span>
                    <span className="wrap-break-word text-(--text-h)">{course.instructor?.username || course.instructor?.email || t('adminUi.courses.unknownOwner')}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.courses.status.published')}</span>
                    <span className={course.isPublished ? 'font-semibold text-(--success)' : 'font-semibold text-(--error)'}>
                      {course.isPublished ? t('adminUi.courses.status.published') : t('adminUi.courses.status.unpublished')}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.courses.status.featured')}</span>
                    <span className={course.isFeatured ? 'font-semibold text-(--success)' : 'font-semibold text-(--error)'}>
                      {course.isFeatured ? t('adminUi.courses.status.featured') : t('adminUi.courses.status.notFeatured')}
                    </span>
                  </div>
                </div>

                <div className="admin-mobile-card-actions grid gap-2 min-[420px]:grid-cols-2">
                  <AdminStatusToggleButton
                    active={course.isPublished}
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      updateMutation.mutate({
                        courseId: course._id,
                        payload: { isPublished: !course.isPublished },
                      })
                    }}
                    activeLabel={t('adminUi.courses.actions.unpublish')}
                    inactiveLabel={t('adminUi.courses.actions.publish')}
                  />
                  <AdminStatusToggleButton
                    active={course.isFeatured}
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      updateMutation.mutate({
                        courseId: course._id,
                        payload: { isFeatured: !course.isFeatured },
                      })
                    }}
                    activeLabel={t('adminUi.courses.actions.unfeature')}
                    inactiveLabel={t('adminUi.courses.actions.feature')}
                  />
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      setEditingCourse(course)
                    }}
                  >
                    <HugeiconsIcon icon={UserEdit01Icon} size={14} />
                    {t('adminUi.courses.actions.update')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(226,33,52,0.4)] px-3 py-2 text-xs font-semibold text-(--error) transition-transform duration-200 hover:scale-[1.04] hover:bg-[rgba(226,33,52,0.08)]"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      setDeleteRequest({
                        ids: [course._id],
                        title: t('adminUi.courses.actions.deleteTitle', 'Delete course?'),
                        message: t('adminUi.courses.actions.deleteConfirm', {
                          title: course.title,
                          defaultValue: `Delete course "${course.title}"? This cannot be undone.`,
                        }),
                      })
                    }}
                  >
                    <HugeiconsIcon icon={Cancel02Icon} size={14} />
                    {t('adminUi.courses.actions.delete')}
                  </button>
                </div>
              </article>
            )) : (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.courses.empty')}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-(--surface-soft)">
              <tr className="text-left text-(--text)">
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds((previous) => Array.from(new Set([...previous, ...visibleCourses.map((course) => course._id)])))
                      } else {
                        setSelectedIds((previous) => previous.filter((id) => !visibleCourses.some((course) => course._id === id)))
                      }
                    }}
                    aria-label={t('adminUi.common.selectAll')}
                  />
                </th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.course')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.level')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.owner')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.courses.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={6}>{t('adminUi.courses.loading')}</td></tr>
              ) : visibleCourses.length ? visibleCourses.map((course) => (
                <tr key={course._id} className="border-t border-(--border)">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedIds.includes(course._id)}
                      onChange={(event) => {
                        setSelectedIds((previous) =>
                          event.target.checked
                            ? Array.from(new Set([...previous, course._id]))
                            : previous.filter((id) => id !== course._id),
                        )
                      }}
                      aria-label={course.title}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link to={`/${language}/admin/courses/${course._id}`} className="font-semibold text-(--text-h) hover:text-(--accent)">
                      {course.title}
                    </Link>
                    <div className="text-xs text-(--text)">{course.slug} | {course.category || t('adminUi.courses.uncategorized')}</div>
                  </td>
                  <td className="px-4 py-4 text-(--text)">{course.level || t('adminUi.common.notAvailable')}</td>
                  <td className="px-4 py-4 text-(--text)">
                    {course.isPublished ? t('adminUi.courses.status.published') : t('adminUi.courses.status.unpublished')} | {course.isFeatured ? t('adminUi.courses.status.featured') : t('adminUi.courses.status.notFeatured')}
                  </td>
                  <td className="px-4 py-4 text-(--text)">{course.instructor?.username || course.instructor?.email || t('adminUi.courses.unknownOwner')}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusToggleButton
                        active={course.isPublished}
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            courseId: course._id,
                            payload: { isPublished: !course.isPublished },
                          })
                        }}
                        activeLabel={t('adminUi.courses.actions.unpublish')}
                        inactiveLabel={t('adminUi.courses.actions.publish')}
                      />
                      <AdminStatusToggleButton
                        active={course.isFeatured}
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            courseId: course._id,
                            payload: { isFeatured: !course.isFeatured },
                          })
                        }}
                        activeLabel={t('adminUi.courses.actions.unfeature')}
                        inactiveLabel={t('adminUi.courses.actions.feature')}
                      />
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          setEditingCourse(course)
                        }}
                      >
                        <HugeiconsIcon icon={UserEdit01Icon} size={14} />
                        {t('adminUi.courses.actions.update')}
                      </button>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(226,33,52,0.4)] px-3 py-2 text-xs font-semibold text-(--error) transition-transform duration-200 hover:scale-[1.04] hover:bg-[rgba(226,33,52,0.08)]"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          setDeleteRequest({
                            ids: [course._id],
                            title: t('adminUi.courses.actions.deleteTitle', 'Delete course?'),
                            message: t('adminUi.courses.actions.deleteConfirm', {
                              title: course.title,
                              defaultValue: `Delete course "${course.title}"? This cannot be undone.`,
                            }),
                          })
                        }}
                      >
                        <HugeiconsIcon icon={Cancel02Icon} size={14} />
                        {t('adminUi.courses.actions.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={6}>{t('adminUi.courses.empty')}</td></tr>
              )}
            </tbody>
            </table>
          </div>
          <AdminPagination
            pagination={data?.pagination}
            onPageChange={setPage}
            previousLabel={t('adminUi.common.previous')}
            nextLabel={t('adminUi.common.next')}
            summaryLabel={t('adminUi.common.pageSummary', {
              page: data?.pagination.page ?? 1,
              pages: data?.pagination.pages ?? 1,
              total: data?.pagination.total ?? 0,
            })}
          />
        </div>
      </section>
    </motion.main>
  )
}
