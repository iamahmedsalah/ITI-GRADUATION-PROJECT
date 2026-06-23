import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, BookmarkRemove02Icon, Delete02Icon, EyeIcon, Route03Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { useCurrentUser } from '../../hooks/queries/useAuth'
import { deleteUserRoadmap, fetchUserRoadmaps, updateRoadmapVisibility, type UserRoadmap } from '../../libs/roadmaps-api'
import CustomDropdown, { type DropdownOption } from '../../components/ui/CustomDropdown'
import ConfirmActionModal from '../../components/models/ConfirmActionModal'

type RoadmapStatusFilter = '' | 'assigned' | 'inProgress' | 'paused' | 'completed'
type RoadmapTypeFilter = '' | 'roleBased' | 'skillBased'

const statusOptionKeys: Array<{ value: RoadmapStatusFilter; labelKey: string }> = [
  { value: '', labelKey: 'dashboard.roadmaps.allStatuses' },
  { value: 'assigned', labelKey: 'dashboard.roadmaps.status.assigned' },
  { value: 'inProgress', labelKey: 'dashboard.roadmaps.status.inProgress' },
  { value: 'paused', labelKey: 'dashboard.roadmaps.status.paused' },
  { value: 'completed', labelKey: 'dashboard.roadmaps.status.completed' },
]

const typeOptionKeys: Array<{ value: RoadmapTypeFilter; labelKey: string }> = [
  { value: '', labelKey: 'dashboard.roadmaps.allTypes' },
  { value: 'roleBased', labelKey: 'landing.roleRoadmaps' },
  { value: 'skillBased', labelKey: 'landing.skillRoadmaps' },
]

export default function MyRoadmapsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const initialStatus = searchParams.get('status') === 'assigned' ? 'assigned' : ''
  const [status, setStatus] = useState<RoadmapStatusFilter>(initialStatus)
  const [type, setType] = useState<RoadmapTypeFilter>('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [bookmarkRemoveTarget, setBookmarkRemoveTarget] = useState<UserRoadmap | null>(null)

  const { data: currentUser } = useCurrentUser()

  const isOwner = useCallback((roadmap: UserRoadmap) => {
    if (!roadmap.template?.owner || !currentUser) return false
    const ownerId = typeof roadmap.template.owner === 'object' ? roadmap.template.owner._id : roadmap.template.owner
    return ownerId === currentUser._id
  }, [currentUser])

  const roadmapsQuery = useQuery({
    queryKey: ['roadmaps', 'mine'],
    queryFn: fetchUserRoadmaps,
    staleTime: 10_000,
  })

  const selectedManageableRoadmaps = useMemo(() => {
    return (roadmapsQuery.data ?? []).filter(
      (r) => selectedIds.includes(r._id) && r.template?.source === 'user-ai' && isOwner(r)
    )
  }, [roadmapsQuery.data, selectedIds, isOwner])

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ templateId, visibility }: { templateId: string; visibility: 'public' | 'private' }) => {
      await updateRoadmapVisibility(templateId, visibility)
      return { templateId, visibility }
    },
    onSuccess: () => {
      toast.success(t('aiRoadmap.visibilityUpdated'))
      void queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiRoadmap.saveFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUserRoadmap,
    onSuccess: async () => {
      toast.success(t('dashboard.roadmaps.deleted'))
      setSelectedIds([])
      setBookmarkRemoveTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('dashboard.roadmaps.deleteFailed'))
    },
  })

  const roadmaps = useMemo(() => {
    const query = search.trim().toLowerCase()

    return (roadmapsQuery.data ?? []).filter((roadmap) => {
      const matchesStatus = status ? roadmap.status === status : true
      const matchesType = type ? roadmap.template?.templateType === type : true
      const title = roadmap.template?.title?.toLowerCase() ?? ''
      const matchesSearch = query ? title.includes(query) : true

      return matchesStatus && matchesType && matchesSearch
    })
  }, [roadmapsQuery.data, search, status, type])

  const allSelected = roadmaps.length > 0 && roadmaps.every((roadmap) => selectedIds.includes(roadmap._id))
  const statusLabel = (value?: string) =>
    t(`dashboard.roadmaps.status.${value ?? 'assigned'}`, {
      defaultValue: value === 'assigned' ? t('dashboard.roadmaps.starred') : value ?? t('dashboard.roadmaps.starred'),
    })
  const statusOptions: DropdownOption<RoadmapStatusFilter>[] = statusOptionKeys.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  const typeOptions: DropdownOption<RoadmapTypeFilter>[] = typeOptionKeys.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))

  return (
    <main className="min-h-screen bg-(--bg) px-4 py-6 text-(--text-h) sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-5 rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
              {t('dashboard.roadmaps.overline')}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-(--text-h)">
              {t('dashboard.roadmaps.title')}
            </h1>
          </div>
          {selectedIds.length ? (
            <div className="flex flex-wrap items-center gap-2">
              {selectedManageableRoadmaps.length > 0 && (
                <button
                  type="button"
                  disabled={updateVisibilityMutation.isPending}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    selectedManageableRoadmaps.forEach((roadmap) => {
                      if (roadmap.template) {
                        updateVisibilityMutation.mutate({
                          templateId: roadmap.template._id,
                          visibility: roadmap.template.visibility === 'public' ? 'private' : 'public',
                        })
                      }
                    })
                  }}
                >
                  <HugeiconsIcon icon={EyeIcon} size={17} />
                  {t('aiRoadmap.toggleVisibility', 'Toggle Visibility')} ({selectedManageableRoadmaps.length})
                </button>
              )}
              <button
                type="button"
                disabled={deleteMutation.isPending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.35)] px-4 py-2 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setIsConfirmDeleteOpen(true)}
              >
                <HugeiconsIcon icon={Delete02Icon} size={17} />
                {t('dashboard.roadmaps.deleteSelected', { count: selectedIds.length })}
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 md:grid-cols-[minmax(0,1fr)_14rem_14rem]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('dashboard.roadmaps.search')}
            className="rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text-h) outline-none focus:border-(--accent-border)"
          />
          <CustomDropdown
            value={status}
            onChange={(value) => {
              setStatus(value)
              const nextParams = new URLSearchParams(searchParams)
              if (value) {
                nextParams.set('status', value)
              } else {
                nextParams.delete('status')
              }
              setSearchParams(nextParams, { replace: true })
            }}
            options={statusOptions}
            buttonClassName="min-h-12 bg-(--surface) px-4 py-3 text-base"
          />
          <CustomDropdown
            value={type}
            onChange={(value) => setType(value as RoadmapTypeFilter)}
            options={typeOptions}
            buttonClassName="min-h-12 bg-(--surface) px-4 py-3 text-base"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-(--border)">
          <div className="grid gap-3 p-3 lg:hidden">
            {roadmapsQuery.isLoading ? (
              <p className="rounded-squircle border border-(--border) bg-(--surface-2) p-4 text-sm text-(--text)">
                {t('dashboard.loading')}
              </p>
            ) : roadmaps.length ? (
              roadmaps.map((roadmap) => {
                const progress = Math.round(roadmap.progressPercent ?? 0)

                return (
                  <article key={roadmap._id} className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                    <div className="flex flex-col gap-3">
                      {/* Top Header Row with Icon, Title, and Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(roadmap._id)}
                            className="admin-checkbox mt-2"
                            onChange={(event) => {
                              setSelectedIds((current) =>
                                event.target.checked
                                  ? Array.from(new Set([...current, roadmap._id]))
                                  : current.filter((id) => id !== roadmap._id),
                              )
                            }}
                            aria-label={roadmap.template?.title ?? roadmap._id}
                          />

                          {/* Squircle icon container with absolute AI badge */}
                          <div className="relative shrink-0">
                            <span className="grid size-10 place-items-center rounded-squircle bg-(--surface) text-(--accent)">
                              <HugeiconsIcon
                                icon={Route03Icon}
                                size={19}
                              />
                            </span>
                            {(roadmap.template?.source === 'ai' || roadmap.template?.source === 'user-ai' || roadmap.template?.source === 'admin-ai') && (
                              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-(--accent-bg) border border-(--accent-border) text-(--accent) shadow-sm">
                                <HugeiconsIcon icon={AiMagicIcon} size={9} />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`}
                              className="block text-base font-semibold leading-tight text-(--text-h) transition hover:text-(--accent) wrap-break-word"
                            >
                              {roadmap.template?.title ?? t('profile.unknownRoadmap')}
                            </Link>
                            <p className="mt-1 text-xs text-(--text)">
                              {roadmap.template?.targetLevel
                                ? t(`landing.levels.${roadmap.template.targetLevel}`, { defaultValue: roadmap.template.targetLevel })
                                : t('landing.levels.roadmap')}
                            </p>
                          </div>
                        </div>

                        {/* Top Right Action Button: Bookmark/Unstar */}
                        {roadmap.status === 'assigned' && (
                          <button
                            type="button"
                            onClick={() => setBookmarkRemoveTarget(roadmap)}
                            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-squircle text-(--accent) transition hover:bg-(--accent-bg)"
                            aria-label={t('dashboard.roadmaps.unstar', 'Remove')}
                            title={t('dashboard.roadmaps.unstar', 'Remove')}
                          >
                            <HugeiconsIcon icon={BookmarkRemove02Icon} size={15} />
                          </button>
                        )}
                      </div>

                      {/* Visibility button inside its own container */}
                      {roadmap.template?.source === 'user-ai' && isOwner(roadmap) && (
                        <div className="flex justify-start">
                          <button
                            onClick={() => {
                              updateVisibilityMutation.mutate({
                                templateId: roadmap.template!._id,
                                visibility: roadmap.template!.visibility === 'public' ? 'private' : 'public',
                              })
                            }}
                            disabled={updateVisibilityMutation.isPending}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-squircle border border-(--border) bg-(--surface-3) px-2.5 py-1 text-xs font-semibold text-(--text-h) transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                            title={roadmap.template.visibility === 'public' ? t('aiRoadmap.makePrivate') : t('aiRoadmap.makePublic')}
                          >
                            <HugeiconsIcon
                              icon={roadmap.template.visibility === 'public' ? EyeIcon : ViewOffSlashIcon}
                              size={14}
                              className={roadmap.template.visibility === 'public' ? 'text-(--success)' : 'text-(--text)'}
                            />
                            <span>
                              {roadmap.template.visibility === 'public' ? t('aiRoadmap.public') : t('aiRoadmap.private')}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      {/* Type Badge */}
                      <span className="rounded-full bg-(--surface-3) px-2.5 py-1 font-semibold text-(--text-secondary)">
                        {roadmap.template?.templateType === 'skillBased'
                          ? t('landing.skillRoadmaps')
                          : t('landing.roleRoadmaps')}
                      </span>
                      {/* Status Badge */}
                      <span className="rounded-full bg-(--surface-3) px-2.5 py-1 font-semibold text-(--text-secondary)">
                        {statusLabel(roadmap.status)}
                      </span>
                      {/* Progress Bar Badge */}
                      <div className="ms-auto flex items-center gap-2 rounded-full bg-(--surface-3) px-2.5 py-1">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-(--gd-primary)"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px] text-(--text-h)">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <p className="rounded-squircle border border-(--border) bg-(--surface-2) p-4 text-sm text-(--text)">
                {t('dashboard.emptyRoadmaps')}
              </p>
            )}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="bg-(--surface-2) text-left text-(--text)">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      className="admin-checkbox"
                      onChange={(event) => {
                        setSelectedIds(event.target.checked ? roadmaps.map((roadmap) => roadmap._id) : [])
                      }}
                      aria-label={t('adminUi.common.selectAll')}
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.roadmaps.tableRoadmap')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.roadmaps.tableType', 'Type')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.roadmaps.tableStatus')}</th>
                  <th className="px-4 py-3 font-semibold">{t('aiRoadmap.visibility')}</th>
                  <th className="px-4 py-3 font-semibold">{t('dashboard.roadmaps.tableProgress')}</th>
                </tr>
              </thead>
              <tbody>
                {roadmapsQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-(--text)">
                      {t('dashboard.loading')}
                    </td>
                  </tr>
                ) : roadmaps.length ? (
                  roadmaps.map((roadmap) => {
                    const progress = Math.round(roadmap.progressPercent ?? 0)

                    return (
                      <tr key={roadmap._id} className="border-t border-(--border)">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(roadmap._id)}
                            className="admin-checkbox"
                            onChange={(event) => {
                              setSelectedIds((current) =>
                                event.target.checked
                                  ? Array.from(new Set([...current, roadmap._id]))
                                  : current.filter((id) => id !== roadmap._id),
                              )
                            }}
                            aria-label={roadmap.template?.title ?? roadmap._id}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 w-full">
                            {/* Squircle icon container with absolute AI badge */}
                            <div className="relative shrink-0">
                              <span className="grid size-9 place-items-center rounded-squircle bg-(--surface-2) text-(--accent)">
                                <HugeiconsIcon
                                  icon={Route03Icon}
                                  size={18}
                                />
                              </span>
                              {(roadmap.template?.source === 'ai' || roadmap.template?.source === 'user-ai' || roadmap.template?.source === 'admin-ai') && (
                                <span className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-squircle bg-(--surface-3)/80 border border-(--surface) text-(--text) shadow-sm">
                                  <HugeiconsIcon icon={AiMagicIcon} size={14} />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`}
                                  className="block truncate font-semibold text-(--text-h) transition hover:text-(--accent)"
                                >
                                  {roadmap.template?.title ?? t('profile.unknownRoadmap')}
                                </Link>
                                <p className="text-xs text-(--text) mt-0.5">
                                  {roadmap.template?.targetLevel
                                    ? t(`landing.levels.${roadmap.template.targetLevel}`, { defaultValue: roadmap.template.targetLevel })
                                    : t('landing.levels.roadmap')}
                                </p>
                              </div>

                              {/* Bookmark Remove in a fixed position on the right */}
                              {roadmap.status === 'assigned' && (
                                <button
                                  type="button"
                                  onClick={() => setBookmarkRemoveTarget(roadmap)}
                                  className="grid size-7 shrink-0 cursor-pointer place-items-center w-9 h-9 bg-(--accent-bg) rounded-squircle text-(--accent) transition hover:bg-(--accent-bg)"
                                  aria-label={t('dashboard.roadmaps.unstar', 'Remove')}
                                  title={t('dashboard.roadmaps.unstar', 'Remove')}
                                >
                                  <HugeiconsIcon icon={BookmarkRemove02Icon} size={20} />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-(--text)">
                          {roadmap.template?.templateType === 'skillBased'
                            ? t('landing.skillRoadmaps')
                            : t('landing.roleRoadmaps')}
                        </td>
                        <td className="px-4 py-4 text-(--text)">{statusLabel(roadmap.status)}</td>
                        <td className="px-4 py-4">
                          {roadmap.template?.source === 'user-ai' && isOwner(roadmap) ? (
                            <button
                              onClick={() => {
                                updateVisibilityMutation.mutate({
                                  templateId: roadmap.template!._id,
                                  visibility: roadmap.template!.visibility === 'public' ? 'private' : 'public',
                                })
                              }}
                              disabled={updateVisibilityMutation.isPending}
                              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-squircle border border-(--border) bg-(--surface-3) px-3 py-1.5 text-xs font-semibold text-(--text-h) transition hover:border-(--accent-border) disabled:cursor-not-allowed disabled:opacity-50"
                              title={roadmap.template.visibility === 'public' ? t('aiRoadmap.makePrivate') : t('aiRoadmap.makePublic')}
                            >
                              <HugeiconsIcon
                                icon={roadmap.template.visibility === 'public' ? EyeIcon : ViewOffSlashIcon}
                                size={14}
                                className={roadmap.template.visibility === 'public' ? 'text-(--success)' : 'text-(--text)'}
                              />
                              <span>
                                {roadmap.template.visibility === 'public' ? t('aiRoadmap.public') : t('aiRoadmap.private')}
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-(--text)">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-(--surface-3)">
                              <div
                                className="h-full rounded-full bg-(--gd-primary)"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="font-semibold text-xs text-(--text-h)">
                              {progress}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-(--text)">
                      {t('dashboard.emptyRoadmaps')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <ConfirmActionModal
        open={isConfirmDeleteOpen}
        title={t('dashboard.roadmaps.confirmDeleteTitle', 'Delete selected roadmaps?')}
        message={t('dashboard.roadmaps.confirmDeleteText', {
          count: selectedIds.length,
          defaultValue: `You are about to delete ${selectedIds.length} roadmap(s). This cannot be undone.`,
        })}
        confirmLabel={deleteMutation.isPending ? t('dashboard.roadmaps.deleting') : t('dashboard.roadmaps.delete')}
        cancelLabel={t('adminUi.common.cancel', 'Cancel')}
        isPending={deleteMutation.isPending}
        onCancel={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          selectedIds.forEach((id) => deleteMutation.mutate(id))
          setIsConfirmDeleteOpen(false)
        }}
      />
      <ConfirmActionModal
        open={Boolean(bookmarkRemoveTarget)}
        title={t('dashboard.roadmaps.confirmUnstarTitle', 'Remove starred roadmap?')}
        message={t('dashboard.roadmaps.confirmUnstarText', {
          roadmap: bookmarkRemoveTarget?.template?.title ?? t('profile.unknownRoadmap'),
          defaultValue: 'This roadmap will be removed from your starred roadmaps.',
        })}
        confirmLabel={deleteMutation.isPending ? t('dashboard.roadmaps.deleting') : t('dashboard.roadmaps.unstar', 'Remove')}
        cancelLabel={t('adminUi.common.cancel', 'Cancel')}
        isPending={deleteMutation.isPending}
        onCancel={() => setBookmarkRemoveTarget(null)}
        onConfirm={() => {
          if (bookmarkRemoveTarget) deleteMutation.mutate(bookmarkRemoveTarget._id)
        }}
      />
      </main>
  )
}
