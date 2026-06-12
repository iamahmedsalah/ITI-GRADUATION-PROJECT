import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Route03Icon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import { deleteUserRoadmap, fetchUserRoadmaps } from '../../libs/roadmaps-api'
import CustomDropdown, { type DropdownOption } from '../../components/ui/CustomDropdown'
import ConfirmActionModal from '../../components/models/ConfirmActionModal'

type RoadmapStatusFilter = '' | 'assigned' | 'inProgress' | 'paused' | 'completed'
type RoadmapTypeFilter = '' | 'roleBased' | 'skillBased'

const statusOptions: DropdownOption<RoadmapStatusFilter>[] = [
  { value: '', label: 'All statuses' },
  { value: 'assigned', label: 'assigned' },
  { value: 'inProgress', label: 'inProgress' },
  { value: 'paused', label: 'paused' },
  { value: 'completed', label: 'completed' },
]

const typeOptions: DropdownOption<RoadmapTypeFilter>[] = [
  { value: '', label: 'All types' },
  { value: 'roleBased', label: 'Role-based' },
  { value: 'skillBased', label: 'Skill-based' },
]

export default function MyRoadmapsPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RoadmapStatusFilter>('')
  const [type, setType] = useState<RoadmapTypeFilter>('')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  const roadmapsQuery = useQuery({
    queryKey: ['roadmaps', 'mine'],
    queryFn: fetchUserRoadmaps,
    staleTime: 10_000,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUserRoadmap,
    onSuccess: async () => {
      toast.success(t('dashboard.roadmaps.deleted'))
      setSelectedIds([])
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
            <button
              type="button"
              disabled={deleteMutation.isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.35)] px-4 py-2 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => setIsConfirmDeleteOpen(true)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={17} />
              {t('dashboard.roadmaps.deleteSelected', { count: selectedIds.length })}
            </button>
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
            onChange={setStatus}
            options={statusOptions.map((option) =>
              option.value === ''
                ? { ...option, label: t('dashboard.roadmaps.allStatuses') }
                : option,
            )}
            buttonClassName="min-h-12 bg-(--surface) px-4 py-3 text-base"
          />
          <CustomDropdown
            value={type}
            onChange={setType}
            options={typeOptions.map((option) =>
              option.value === ''
                ? { ...option, label: t('dashboard.roadmaps.allTypes', 'All types') }
                : option,
            )}
            buttonClassName="min-h-12 bg-(--surface) px-4 py-3 text-base"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-(--border)">
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
                <th className="px-4 py-3 font-semibold">{t('dashboard.roadmaps.tableProgress')}</th>
              </tr>
            </thead>
            <tbody>
              {roadmapsQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-(--text)">
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
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-squircle bg-(--surface-2) text-(--accent)">
                            <HugeiconsIcon icon={Route03Icon} size={18} />
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/${language}/roadmaps/${roadmap.template?.slug ?? 'roadmap'}`}
                              className="block truncate font-semibold text-(--text-h) transition hover:text-(--accent)"
                            >
                              {roadmap.template?.title ?? t('profile.unknownRoadmap')}
                            </Link>
                            <p className="text-xs text-(--text)">{roadmap.template?.targetLevel ?? 'roadmap'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-(--text)">
                        {roadmap.template?.templateType === 'skillBased'
                          ? t('landing.skillRoadmaps')
                          : t('landing.roleRoadmaps')}
                      </td>
                      <td className="px-4 py-4 text-(--text)">{roadmap.status ?? 'assigned'}</td>
                      <td className="px-4 py-4 text-(--text-h)">{progress}%</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-(--text)">
                    {t('dashboard.emptyRoadmaps')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </main>
  )
}
