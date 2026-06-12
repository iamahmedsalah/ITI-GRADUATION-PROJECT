import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, Cancel02Icon, UserAccountIcon, UserEdit01Icon, UserSettings01Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import {
  Link,
} from 'react-router-dom'
import {
  createAdminRoadmap,
  deleteAdminRoadmap,
  fetchAdminRoadmaps,
  toggleAdminRoadmapPublish,
  updateAdminRoadmap,
} from '../../libs/admin-api'
import type { AdminRoadmapRow } from '../../libs/admin-api'
import { AdminFilterToggleButton, AdminStatusToggleButton } from '../../components/ui/AdminActionButtons'
import AdminPagination from '../../components/ui/AdminPagination'
import CustomDropdown from '../../components/ui/CustomDropdown'
import AdminRoadmapFormModal from '../../components/models/AdminRoadmapFormModal'
import ConfirmActionModal from '../../components/models/ConfirmActionModal'

type RoleOption = 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
type LevelOption = 'beginner' | 'intermediate' | 'advanced'
type TemplateTypeOption = 'roleBased' | 'skillBased'
type RoadmapSourceKind = NonNullable<AdminRoadmapRow['displaySource']>

const sourceIconByKind = {
  manual: UserEdit01Icon,
  ai: AiMagicIcon,
  admin: UserSettings01Icon,
  'std-ai': UserAccountIcon,
} satisfies Record<RoadmapSourceKind, typeof AiMagicIcon>

function getRoadmapSourceKind(roadmap: AdminRoadmapRow): RoadmapSourceKind {
  return roadmap.displaySource ?? roadmap.source ?? 'manual'
}

function RoadmapSourceBadge({ roadmap, label }: { roadmap: AdminRoadmapRow; label: string }) {
  const sourceKind = getRoadmapSourceKind(roadmap)

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-squircle border border-(--border) bg-(--surface-soft) px-2 py-1 text-xs font-semibold uppercase text-(--text-h)">
      <HugeiconsIcon icon={sourceIconByKind[sourceKind]} size={14} className="shrink-0 text-(--accent)" />
      {label}
    </span>
  )
}

export default function AdminRoadmapsPage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [targetLevel, setTargetLevel] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [ownership, setOwnership] = useState('')
  const [source, setSource] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRoadmap, setEditingRoadmap] = useState<AdminRoadmapRow | null>(null)
  const [deleteRequest, setDeleteRequest] = useState<{
    ids: string[]
    title: string
    message: string
  } | null>(null)

  const queryKey = useMemo(
    () => ['admin', 'roadmaps', search, targetRole, targetLevel, templateType, ownership, source, isActive, page],
    [search, targetRole, targetLevel, templateType, ownership, source, isActive, page],
  )

  const roleOptions = [
    { value: '', label: t('adminUi.roadmaps.filters.allRoles') },
    { value: 'student', label: t('adminUi.roles.student') },
    { value: 'instructor', label: t('adminUi.roles.instructor') },
    { value: 'admin', label: t('adminUi.roles.admin') },
    { value: 'careerSwitcher', label: t('adminUi.roles.careerSwitcher') },
    { value: 'jobSeeker', label: t('adminUi.roles.jobSeeker') },
  ]
  const levelOptions = [
    { value: '', label: t('adminUi.roadmaps.filters.allLevels') },
    { value: 'beginner', label: t('adminUi.levels.beginner') },
    { value: 'intermediate', label: t('adminUi.levels.intermediate') },
    { value: 'advanced', label: t('adminUi.levels.advanced') },
  ]
  const typeOptions = [
    { value: '', label: t('adminUi.roadmaps.filters.allTypes') },
    { value: 'roleBased', label: t('adminUi.roadmapTypes.roleBased') },
    { value: 'skillBased', label: t('adminUi.roadmapTypes.skillBased') },
  ]
  const activeOptions = [
    { value: '', label: t('adminUi.roadmaps.filters.allStatus') },
    { value: 'true', label: t('adminUi.status.active') },
    { value: 'false', label: t('adminUi.status.inactive') },
  ]
  const ownershipOptions = [
    { value: '', label: t('adminUi.roadmaps.filters.allOwners', 'All creators') },
    { value: 'admin', label: t('adminUi.roadmaps.filters.adminCreated', 'Admin-created') },
    { value: 'student', label: t('adminUi.roadmaps.filters.studentCreated', 'Student-created') },
  ]
  const sourceOptions = [
    { value: '', label: t('adminUi.roadmaps.filters.allSources', 'All sources') },
    { value: 'manual', label: t('adminUi.roadmaps.sources.manual', 'Manual'), icon: UserEdit01Icon },
    { value: 'ai', label: t('adminUi.roadmaps.sources.ai', 'AI'), icon: AiMagicIcon },
    { value: 'admin', label: t('adminUi.roadmaps.sources.admin', 'Admin'), icon: UserSettings01Icon },
  ]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminRoadmaps({
        q: search || undefined,
        targetRole: targetRole || undefined,
        targetLevel: targetLevel || undefined,
        templateType: templateType || undefined,
        ownership: ownership || undefined,
        source: source || undefined,
        isActive: isActive || undefined,
        page,
        limit: 10,
      }),
    staleTime: 0,
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'roadmaps'] })
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
  }

  const createMutation = useMutation({
    mutationFn: createAdminRoadmap,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setIsCreateModalOpen(false)
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.createFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string
      payload: Partial<{
        title: string
        slug: string
        goal: string
        description: string
        targetRole: RoleOption
        targetLevel: LevelOption
        templateType: TemplateTypeOption
        isActive: boolean
      }>
    }) => updateAdminRoadmap(templateId, payload),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setEditingRoadmap(null)
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.updateFailed')),
  })

  const publishMutation = useMutation({
    mutationFn: ({ templateId, makeActive }: { templateId: string; makeActive: boolean }) =>
      toggleAdminRoadmapPublish(templateId, makeActive),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.publishFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminRoadmap,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setSelectedIds((previous) => previous.filter((id) => id !== result.data?._id))
      refresh()
    },
    onError: () => toast.error(t('adminUi.roadmaps.deleteFailed')),
  })

  const visibleRoadmaps = data?.data ?? []
  const allVisibleSelected = visibleRoadmaps.length > 0 && visibleRoadmaps.every((roadmap) => selectedIds.includes(roadmap._id))

  return (
    <motion.main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <AdminRoadmapFormModal
        open={isCreateModalOpen}
        mode="create"
        isPending={createMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload as Parameters<typeof createAdminRoadmap>[0])}
      />
      <AdminRoadmapFormModal
        key={editingRoadmap?._id ?? 'closed-roadmap-update'}
        open={Boolean(editingRoadmap)}
        mode="update"
        roadmap={editingRoadmap}
        isPending={updateMutation.isPending}
        onClose={() => setEditingRoadmap(null)}
        onSubmit={(payload) => {
          if (!editingRoadmap) return
          updateMutation.mutate({ templateId: editingRoadmap._id, payload })
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
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.roadmaps.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{t('adminUi.roadmaps.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">{t('adminUi.roadmaps.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
              {isFetching ? t('adminUi.common.refreshing') : data ? t('adminUi.roadmaps.total', { count: data.pagination.total }) : t('adminUi.common.noData')}
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-squircle cursor-pointer bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover)"
            >
              {t('adminUi.roadmaps.form.add')}
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
                  title: t('adminUi.roadmaps.actions.deleteSelectedTitle', 'Delete selected roadmaps?'),
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

        {isFiltersOpen ? <div className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-muted) p-4 md:grid-cols-4 xl:grid-cols-7">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('adminUi.roadmaps.searchPlaceholder')}
            className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border)"
          />
          <CustomDropdown value={targetRole} options={roleOptions} onChange={(value) => { setTargetRole(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={targetLevel} options={levelOptions} onChange={(value) => { setTargetLevel(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={templateType} options={typeOptions} onChange={(value) => { setTemplateType(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={ownership} options={ownershipOptions} onChange={(value) => { setOwnership(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={source} options={sourceOptions} onChange={(value) => { setSource(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={isActive} options={activeOptions} onChange={(value) => { setIsActive(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
        </div> : null}

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <div className="grid gap-3 p-2 sm:p-3 md:hidden">
            {isLoading ? (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.roadmaps.loading')}
              </div>
            ) : visibleRoadmaps.length ? visibleRoadmaps.map((roadmap) => (
              <article key={roadmap._id} className="grid min-w-0 gap-4 rounded-3xl border border-(--border) bg-(--surface-muted) p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="admin-checkbox mt-1"
                    checked={selectedIds.includes(roadmap._id)}
                    onChange={(event) => {
                      setSelectedIds((previous) =>
                        event.target.checked
                          ? Array.from(new Set([...previous, roadmap._id]))
                          : previous.filter((id) => id !== roadmap._id),
                      )
                    }}
                    aria-label={roadmap.title}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={roadmap._id} className="block wrap-break-word font-semibold text-(--text-h) hover:text-(--gd-primary)">
                      {roadmap.title}
                    </Link>
                    <div className="wrap-break-word text-xs text-(--text)">{roadmap.slug}</div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm min-[460px]:grid-cols-2">
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.roadmaps.table.status')}</span>
                    <span className={roadmap.isActive ? 'font-semibold text-(--success)' : 'font-semibold text-(--error)'}>
                      {roadmap.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.roadmaps.table.type')}</span>
                    <span className="wrap-break-word text-(--text-h)">{t(`adminUi.roadmapTypes.${roadmap.templateType ?? 'roleBased'}`)}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.roadmaps.table.source', 'Source')}</span>
                    <RoadmapSourceBadge roadmap={roadmap} label={roadmap.displaySource ?? roadmap.source ?? 'manual'} />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.roadmaps.table.target')}</span>
                    <span className="wrap-break-word text-(--text-h)">{roadmap.targetRole || t('adminUi.common.any')} | {roadmap.targetLevel || t('adminUi.common.any')}</span>
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.roadmaps.table.assigned')}</span>
                    <span className="text-(--text-h)">{roadmap.assignedUsers ?? 0}</span>
                  </div>
                </div>

                <div className="admin-mobile-card-actions grid gap-2 min-[420px]:grid-cols-2">
                  <AdminStatusToggleButton
                    active={roadmap.isActive}
                    disabled={publishMutation.isPending}
                    onClick={() => publishMutation.mutate({ templateId: roadmap._id, makeActive: !roadmap.isActive })}
                    activeLabel={t('adminUi.roadmaps.actions.unpublish')}
                    inactiveLabel={t('adminUi.roadmaps.actions.publish')}
                  />
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-squircle border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      setEditingRoadmap(roadmap)
                    }}
                  >
                    <HugeiconsIcon icon={UserEdit01Icon} size={14} />
                    {t('adminUi.roadmaps.actions.update')}
                  </button>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-squircle border border-[rgba(226,33,52,0.4)] px-3 py-2 text-xs font-semibold text-(--error) transition-transform duration-200 hover:scale-[1.04] hover:bg-[rgba(226,33,52,0.08)]"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      setDeleteRequest({
                        ids: [roadmap._id],
                        title: t('adminUi.roadmaps.actions.deleteTitle', 'Delete roadmap?'),
                        message: t('adminUi.roadmaps.actions.deleteConfirm', {
                          title: roadmap.title,
                          defaultValue: `Delete roadmap "${roadmap.title}"? This cannot be undone.`,
                        }),
                      })
                    }}
                  >
                    <HugeiconsIcon icon={Cancel02Icon} size={14} />
                    {t('adminUi.roadmaps.actions.delete')}
                  </button>
                </div>
              </article>
            )) : (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.roadmaps.empty')}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                        setSelectedIds((previous) => Array.from(new Set([...previous, ...visibleRoadmaps.map((roadmap) => roadmap._id)])))
                      } else {
                        setSelectedIds((previous) => previous.filter((id) => !visibleRoadmaps.some((roadmap) => roadmap._id === id)))
                      }
                    }}
                    aria-label={t('adminUi.common.selectAll')}
                  />
                </th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.template')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.type')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.source', 'Source')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.target')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.assigned')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.roadmaps.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={8}>{t('adminUi.roadmaps.loading')}</td></tr>
              ) : visibleRoadmaps.length ? visibleRoadmaps.map((roadmap) => (
                <tr key={roadmap._id} className="border-t border-(--border)">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedIds.includes(roadmap._id)}
                      onChange={(event) => {
                        setSelectedIds((previous) =>
                          event.target.checked
                            ? Array.from(new Set([...previous, roadmap._id]))
                            : previous.filter((id) => id !== roadmap._id),
                        )
                      }}
                      aria-label={roadmap.title}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Link to={roadmap._id} className="font-semibold text-(--text-h) hover:text-(--gd-primary)">
                      {roadmap.title}
                    </Link>
                    <div className="text-xs text-(--text)">{roadmap.slug}</div>
                  </td>
                  <td className="px-4 py-4 text-(--text)">{t(`adminUi.roadmapTypes.${roadmap.templateType ?? 'roleBased'}`)}</td>
                  <td className="px-4 py-4 text-(--text)">
                    <RoadmapSourceBadge roadmap={roadmap} label={roadmap.displaySource ?? roadmap.source ?? 'manual'} />
                    {roadmap.owner ? (
                      <div className="mt-1 text-xs text-(--text)">
                        {roadmap.owner.username || roadmap.owner.email}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-(--text)">{roadmap.targetRole || t('adminUi.common.any')} | {roadmap.targetLevel || t('adminUi.common.any')}</td>
                  <td className="px-4 py-4 text-(--text)">{roadmap.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}</td>
                  <td className="px-4 py-4 text-(--text)">{roadmap.assignedUsers ?? 0}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusToggleButton
                        active={roadmap.isActive}
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate({ templateId: roadmap._id, makeActive: !roadmap.isActive })}
                        activeLabel={t('adminUi.roadmaps.actions.unpublish')}
                        inactiveLabel={t('adminUi.roadmaps.actions.publish')}
                      />
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-squircle border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          setEditingRoadmap(roadmap)
                        }}
                      >
                        <HugeiconsIcon icon={UserEdit01Icon} size={14} />
                        {t('adminUi.roadmaps.actions.update')}
                      </button>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-squircle border border-[rgba(226,33,52,0.4)] px-3 py-2 text-xs font-semibold text-(--error) transition-transform duration-200 hover:scale-[1.04] hover:bg-[rgba(226,33,52,0.08)]"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          setDeleteRequest({
                            ids: [roadmap._id],
                            title: t('adminUi.roadmaps.actions.deleteTitle', 'Delete roadmap?'),
                            message: t('adminUi.roadmaps.actions.deleteConfirm', {
                              title: roadmap.title,
                              defaultValue: `Delete roadmap "${roadmap.title}"? This cannot be undone.`,
                            }),
                          })
                        }}
                      >
                        <HugeiconsIcon icon={Cancel02Icon} size={14} />
                        {t('adminUi.roadmaps.actions.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={8}>{t('adminUi.roadmaps.empty')}</td></tr>
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
