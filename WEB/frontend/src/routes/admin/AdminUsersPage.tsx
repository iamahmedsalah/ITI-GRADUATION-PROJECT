import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  UserEdit01Icon,
  UserSquareIcon,
} from '@hugeicons/core-free-icons';
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import { fetchAdminUsers, updateAdminUser } from '../../libs/admin-api'
import { AdminFilterToggleButton, AdminStatusToggleButton } from '../../components/ui/AdminActionButtons'
import AdminPagination from '../../components/ui/AdminPagination'
import CustomDropdown from '../../components/ui/CustomDropdown'

type AdminUserRole = 'student' | 'instructor' | 'admin'

function badgeClass(value: boolean) {
  return value
    ? 'border-[rgba(29,185,84,0.25)] bg-[rgba(29,185,84,0.12)] text-(--success)'
    : 'border-[rgba(226,33,52,0.25)] bg-[rgba(226,33,52,0.12)] text-(--error)'
}

export default function AdminUsersPage() {
  const { direction } = useLanguage()
  const { t } = useTranslation()
  const pageVariants = createPageVariants(direction)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isVerified, setIsVerified] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminUserRole>>({})
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const queryKey = useMemo(
    () => ['admin', 'users', search, role, isVerified, isActive, page],
    [search, role, isVerified, isActive, page],
  )

  const roleOptions = [
    { value: '', label: t('adminUi.users.filters.allRoles') },
    { value: 'student', label: t('adminUi.roles.student') },
    { value: 'instructor', label: t('adminUi.roles.instructor') },
    { value: 'admin', label: t('adminUi.roles.admin') },
  ]
  const verificationOptions = [
    { value: '', label: t('adminUi.users.filters.allVerification') },
    { value: 'true', label: t('adminUi.status.verified') },
    { value: 'false', label: t('adminUi.status.unverified') },
  ]
  const statusOptions = [
    { value: '', label: t('adminUi.users.filters.allStatus') },
    { value: 'true', label: t('adminUi.status.active') },
    { value: 'false', label: t('adminUi.status.inactive') },
  ]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminUsers({
        q: search || undefined,
        role: role || undefined,
        isVerified: isVerified || undefined,
        isActive: isActive || undefined,
        page,
        limit: 10,
      }),
    staleTime: 0,
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string
      payload: Partial<{
        role: 'student' | 'instructor' | 'admin'
        isVerified: boolean
        isActive: boolean
        deactivationReason: string
      }>
    }) => updateAdminUser(userId, payload),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: () => {
      toast.error(t('adminUi.users.updateFailed'))
    },
  })
  const visibleUsers = data?.data ?? []
  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every((user) => selectedIds.includes(user._id))

  return (
    <motion.main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <section className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface) p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:gap-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">{t('adminUi.users.overline')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-(--text-h)">{t('adminUi.users.title')}</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">{t('adminUi.users.subtitle')}</p>
          </div>
          <div className="rounded-squircle border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            {isFetching ? t('adminUi.common.refreshing') : data ? t('adminUi.users.total', { count: data.pagination.total }) : t('adminUi.common.noData')}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {selectedIds.length ? (
            <AdminStatusToggleButton
              active
              size="md"
              disabled={updateMutation.isPending}
              onClick={() => {
                selectedIds.forEach((userId) => updateMutation.mutate({ userId, payload: { isActive: false, deactivationReason: 'Bulk admin action' } }))
                setSelectedIds([])
              }}
              activeLabel={t('adminUi.users.actions.deactivateSelected', { count: selectedIds.length })}
              inactiveLabel={t('adminUi.users.actions.deactivateSelected', { count: selectedIds.length })}
            />
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
            placeholder={t('adminUi.users.searchPlaceholder')}
            className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none transition focus:border-(--accent-border)"
          />
          <CustomDropdown value={role} options={roleOptions} onChange={(value) => { setRole(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={isVerified} options={verificationOptions} onChange={(value) => { setIsVerified(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
          <CustomDropdown value={isActive} options={statusOptions} onChange={(value) => { setIsActive(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
        </div> : null}

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <div className="grid gap-3 p-2 sm:p-3 md:hidden">
            {isLoading ? (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.users.loading')}
              </div>
            ) : visibleUsers.length ? visibleUsers.map((user) => (
              <article key={user._id} className="grid min-w-0 gap-4 rounded-3xl border border-(--border) bg-(--surface-muted) p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="admin-checkbox mt-1"
                    checked={selectedIds.includes(user._id)}
                    onChange={(event) => {
                      setSelectedIds((previous) =>
                        event.target.checked
                          ? Array.from(new Set([...previous, user._id]))
                          : previous.filter((id) => id !== user._id),
                      )
                    }}
                    aria-label={user.email}
                  />
                  <div className="min-w-0 flex-1 justify-content">
                      <HugeiconsIcon  icon={UserSquareIcon} />
                    <div className="wrap-break-word font-semibold text-(--text-h)">{user.Fname} {user.Lname}</div>
                    <div className="wrap-break-word text-xs text-(--text)">{user.username} | {user.email}</div>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.users.table.role')}</span>
                    <CustomDropdown<AdminUserRole>
                      value={roleDrafts[user._id] ?? (user.role as AdminUserRole)}
                      options={roleOptions.filter((option) => option.value !== '') as { value: AdminUserRole; label: string }[]}
                      onChange={(nextRole) => {
                        setRoleDrafts((previous) => ({ ...previous, [user._id]: nextRole }))
                        if (nextRole !== user.role) {
                          updateMutation.mutate({
                            userId: user._id,
                            payload: { role: nextRole },
                          })
                        }
                      }}
                      buttonClassName="bg-(--surface)! py-2! text-xs!"
                    />
                  </div>

                  <div className="grid gap-2 min-[420px]:grid-cols-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(user.isVerified)}`}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                      {user.isVerified ? t('adminUi.status.verified') : t('adminUi.status.unverified')}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(user.isActive)}`}>
                      <HugeiconsIcon icon={UserEdit01Icon} size={14} />
                      {user.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}
                    </span>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.users.table.lastLogin')}</span>
                    <span className="text-(--text-h)">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('profile.never')}</span>
                  </div>
                </div>

                <div className="admin-mobile-card-actions grid gap-2 min-[420px]:grid-cols-2">
                  <AdminStatusToggleButton
                    active={user.isVerified}
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      updateMutation.mutate({
                        userId: user._id,
                        payload: { isVerified: !user.isVerified },
                      })
                    }}
                    activeLabel={t('adminUi.users.actions.unverify')}
                    inactiveLabel={t('adminUi.users.actions.verify')}
                  />
                  <AdminStatusToggleButton
                    active={user.isActive}
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      const nextActive = !user.isActive
                      let deactivationReason = ''

                      if (!nextActive) {
                        deactivationReason = window.prompt(t('adminUi.users.actions.deactivationPrompt')) ?? ''
                      }

                      updateMutation.mutate({
                        userId: user._id,
                        payload: {
                          isActive: nextActive,
                          deactivationReason: deactivationReason.trim() || undefined,
                        },
                      })
                    }}
                    activeLabel={t('adminUi.users.actions.deactivate')}
                    inactiveLabel={t('adminUi.users.actions.activate')}
                  />
                </div>
              </article>
            )) : (
              <div className="rounded-squircle border border-(--border) bg-(--surface-muted) p-4 text-sm text-(--text)">
                {t('adminUi.users.empty')}
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
                        setSelectedIds((previous) => Array.from(new Set([...previous, ...visibleUsers.map((user) => user._id)])))
                      } else {
                        setSelectedIds((previous) => previous.filter((id) => !visibleUsers.some((user) => user._id === id)))
                      }
                    }}
                    aria-label={t('adminUi.common.selectAll')}
                  />
                </th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.user')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.role')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.lastLogin')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={6}>{t('adminUi.users.loading')}</td></tr>
              ) : visibleUsers.length ? visibleUsers.map((user) => (
                <tr key={user._id} className="border-t border-(--border)">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedIds.includes(user._id)}
                      onChange={(event) => {
                        setSelectedIds((previous) =>
                          event.target.checked
                            ? Array.from(new Set([...previous, user._id]))
                            : previous.filter((id) => id !== user._id),
                        )
                      }}
                      aria-label={user.email}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <HugeiconsIcon  icon={UserSquareIcon} />
                      <div className="font-semibold text-(--text-h)">{user.Fname} {user.Lname}</div>
                    </div>
                    <div className="text-xs text-(--text)">{user.username} | {user.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <CustomDropdown<AdminUserRole>
                        value={roleDrafts[user._id] ?? (user.role as AdminUserRole)}
                        options={roleOptions.filter((option) => option.value !== '') as { value: AdminUserRole; label: string }[]}
                        onChange={(nextRole) => {
                          setRoleDrafts((previous) => ({ ...previous, [user._id]: nextRole }))
                          if (nextRole !== user.role) {
                            updateMutation.mutate({
                              userId: user._id,
                              payload: { role: nextRole },
                            })
                          }
                        }}
                        className="min-w-32"
                        buttonClassName="bg-(--surface-muted)! py-2! text-xs!"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(user.isVerified)}`}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                        {t('adminUi.users.emailStatus')}: {user.isVerified ? t('adminUi.status.verified') : t('adminUi.status.unverified')}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(user.isActive)}`}>
                        <HugeiconsIcon icon={UserEdit01Icon} size={14} />
                        {t('adminUi.users.accountStatus')}: {user.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-(--text)">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('profile.never')}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <AdminStatusToggleButton
                        active={user.isVerified}
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            userId: user._id,
                            payload: { isVerified: !user.isVerified },
                          })
                        }}
                        activeLabel={t('adminUi.users.actions.unverify')}
                        inactiveLabel={t('adminUi.users.actions.verify')}
                      />
                      <AdminStatusToggleButton
                        active={user.isActive}
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          const nextActive = !user.isActive
                          let deactivationReason = ''

                          if (!nextActive) {
                            deactivationReason = window.prompt(t('adminUi.users.actions.deactivationPrompt')) ?? ''
                          }

                          updateMutation.mutate({
                            userId: user._id,
                            payload: {
                              isActive: nextActive,
                              deactivationReason: deactivationReason.trim() || undefined,
                            },
                          })
                        }}
                        activeLabel={t('adminUi.users.actions.deactivate')}
                        inactiveLabel={t('adminUi.users.actions.activate')}
                      />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={6}>{t('adminUi.users.empty')}</td></tr>
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
