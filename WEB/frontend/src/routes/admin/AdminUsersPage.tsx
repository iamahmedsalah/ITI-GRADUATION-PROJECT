import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  CrownIcon,
  Delete02Icon,
  StarHalfIcon,
  UserAccountIcon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons';
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import { deleteAdminUser, fetchAdminUserDetail, fetchAdminUsers, updateAdminUser } from '../../libs/admin-api'
import { AdminFilterToggleButton, AdminStatusToggleButton } from '../../components/ui/AdminActionButtons'
import AdminPagination from '../../components/ui/AdminPagination'
import CustomDropdown from '../../components/ui/CustomDropdown'
import ConfirmActionModal from '../../components/models/ConfirmActionModal'
import DeactivationReasonModal from '../../components/models/DeactivationReasonModal'

type AdminUserRole = 'student' | 'instructor' | 'admin'
type AdminSubscriptionPlan = 'free' | 'pro'

function badgeClass(value: boolean) {
  return value
    ? 'border-[rgba(29,185,84,0.25)] bg-[rgba(29,185,84,0.12)] text-(--success)'
    : 'border-[rgba(226,33,52,0.25)] bg-[rgba(226,33,52,0.12)] text-(--error)'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function humanizeKey(key: string) {
  return key
    .replace(/^_+/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    if (!value.length) return 'None'
    if (value.every((item) => typeof item !== 'object')) {
      return value.join(', ')
    }
    return `${value.length} item${value.length === 1 ? '' : 's'}`
  }
  if (isRecord(value)) {
    const title = value.title ?? value.name ?? value.label
    return typeof title === 'string' && title ? title : `${Object.keys(value).length} fields`
  }
  return String(value)
}

function DetailFieldSection({
  title,
  data,
  emptyLabel,
}: {
  title: string
  data?: Record<string, unknown> | null
  emptyLabel: string
}) {
  const entries = Object.entries(data ?? {}).filter(
    ([key, value]) => !['_id', '__v', 'user', 'createdAt', 'updatedAt'].includes(key) && value !== undefined,
  )

  return (
    <section className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
      <h3 className="font-semibold text-(--text-h)">{title}</h3>
      {entries.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-md bg-(--surface) px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text)">{humanizeKey(key)}</p>
              <p className="mt-1 wrap-break-word text-sm font-semibold text-(--text-h)">{formatDetailValue(value)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-(--text)">{emptyLabel}</p>
      )}
    </section>
  )
}

function StatusCountList({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items?: Array<{ _id: string; count: number }>
  emptyLabel: string
}) {
  return (
    <section className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
      <h3 className="font-semibold text-(--text-h)">{title}</h3>
      {items?.length ? (
        <div className="mt-3 grid gap-2">
          {items.map((item) => (
            <div key={item._id} className="flex items-center justify-between gap-3 rounded-md bg-(--surface) px-3 py-2 text-sm">
              <span className="text-(--text)">{humanizeKey(item._id)}</span>
              <span className="font-semibold text-(--text-h)">{item.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-(--text)">{emptyLabel}</p>
      )}
    </section>
  )
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
  const [subscriptionPlan, setSubscriptionPlan] = useState('')
  const [page, setPage] = useState(1)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminUserRole>>({})
  const [planDrafts, setPlanDrafts] = useState<Record<string, AdminSubscriptionPlan>>({})
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailUserId, setDetailUserId] = useState('')
  const [deleteRequest, setDeleteRequest] = useState<{
    ids: string[]
    title: string
    message: string
  } | null>(null)
  const [deactivationRequest, setDeactivationRequest] = useState<{
    ids: string[]
    title: string
    message: string
  } | null>(null)

  const queryKey = useMemo(
    () => ['admin', 'users', search, role, isVerified, isActive, subscriptionPlan, page],
    [search, role, isVerified, isActive, subscriptionPlan, page],
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
  const subscriptionOptions = [
    { value: '', label: t('adminUi.users.filters.allPlans') },
    { value: 'free', label: t('adminUi.users.subscription.free'), icon: StarHalfIcon },
    { value: 'pro', label: t('adminUi.users.subscription.pro'), icon: CrownIcon },
  ]

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminUsers({
        q: search || undefined,
        role: role || undefined,
        isVerified: isVerified || undefined,
        isActive: isActive || undefined,
        subscriptionPlan: subscriptionPlan || undefined,
        page,
        limit: 10,
      }),
    staleTime: 0,
  })

  const detailQuery = useQuery({
    queryKey: ['admin', 'users', 'detail', detailUserId],
    queryFn: () => fetchAdminUserDetail(detailUserId),
    enabled: Boolean(detailUserId),
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
        subscriptionPlan: 'free' | 'pro'
        subscriptionStatus: 'inactive' | 'active' | 'trialing' | 'pastDue' | 'canceled'
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
  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
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
      toast.error(t('adminUi.users.deleteFailed', 'Failed to delete user.'))
    },
  })
  const visibleUsers = data?.data ?? []
  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every((user) => selectedIds.includes(user._id))
  const deactivateUsers = (ids: string[], reason: string) => {
    ids.forEach((userId) => updateMutation.mutate({ userId, payload: { isActive: false, deactivationReason: reason } }))
    setSelectedIds((previous) => previous.filter((id) => !ids.includes(id)))
  }

  return (
    <motion.main className="px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
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
          ids.forEach((userId) => deleteMutation.mutate(userId))
          setSelectedIds((previous) => previous.filter((id) => !ids.includes(id)))
          setDeleteRequest(null)
        }}
      />
      <DeactivationReasonModal
        open={Boolean(deactivationRequest)}
        title={deactivationRequest?.title ?? ''}
        message={deactivationRequest?.message ?? ''}
        reasonLabel={t('adminUi.users.actions.deactivationReason', 'Deactivation reason')}
        reasonPlaceholder={t('adminUi.users.actions.deactivationPlaceholder', 'Explain why this account is being deactivated')}
        confirmLabel={t('adminUi.users.actions.deactivate', 'Deactivate')}
        cancelLabel={t('adminUi.common.cancel', 'Cancel')}
        isPending={updateMutation.isPending}
        onCancel={() => setDeactivationRequest(null)}
        onConfirm={(reason) => {
          deactivateUsers(deactivationRequest?.ids ?? [], reason)
          setDeactivationRequest(null)
        }}
      />
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
            <>
              <AdminStatusToggleButton
                active={false}
                size="md"
                disabled={updateMutation.isPending}
                onClick={() => {
                  selectedIds.forEach((userId) => updateMutation.mutate({ userId, payload: { isVerified: true } }))
                  setSelectedIds([])
                }}
                activeLabel={t('adminUi.users.actions.verifySelected', { count: selectedIds.length, defaultValue: `Verify selected (${selectedIds.length})` })}
                inactiveLabel={t('adminUi.users.actions.verifySelected', { count: selectedIds.length, defaultValue: `Verify selected (${selectedIds.length})` })}
              />
              <AdminStatusToggleButton
                active
                size="md"
                disabled={updateMutation.isPending}
                onClick={() => {
                  setDeactivationRequest({
                    ids: selectedIds,
                    title: t('adminUi.users.actions.deactivateSelectedTitle', 'Deactivate selected users?'),
                    message: t('adminUi.users.actions.deactivateSelectedMessage', {
                      count: selectedIds.length,
                      defaultValue: `Add a reason before deactivating ${selectedIds.length} selected user(s).`,
                    }),
                  })
                }}
                activeLabel={t('adminUi.users.actions.deactivateSelected', { count: selectedIds.length })}
                inactiveLabel={t('adminUi.users.actions.deactivateSelected', { count: selectedIds.length })}
              />
              <button
                type="button"
                disabled={deleteMutation.isPending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-squircle border border-(--error) hover:bg-(--error)/10 px-4 py-2 text-sm font-semibold text-(--error) disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  setDeleteRequest({
                    ids: selectedIds,
                    title: t('adminUi.users.actions.deleteSelectedTitle', 'Delete selected users?'),
                    message: t('adminUi.users.actions.deleteSelectedConfirm', {
                      count: selectedIds.length,
                      defaultValue: `Delete ${selectedIds.length} selected user(s)? This cannot be undone.`,
                    }),
                  })
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                {t('adminUi.users.actions.deleteSelected', { count: selectedIds.length, defaultValue: `Delete selected (${selectedIds.length})` })}
              </button>
            </>
          ) : null}
          <AdminFilterToggleButton
            open={isFiltersOpen}
            onClick={() => setIsFiltersOpen((previous) => !previous)}
            showLabel={t('adminUi.common.showFilters')}
            hideLabel={t('adminUi.common.hideFilters')}
          />
        </div>

        {isFiltersOpen ? <div className="grid gap-3 rounded-3xl border border-(--border) bg-(--surface-muted) p-4 md:grid-cols-5">
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
          <CustomDropdown value={subscriptionPlan} options={subscriptionOptions} onChange={(value) => { setSubscriptionPlan(value); setPage(1) }} buttonClassName="bg-(--surface-muted)! px-4! py-3!" />
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
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setDetailUserId(user._id)}
                  >
                      <HugeiconsIcon  icon={UserAccountIcon} />
                    <div className="wrap-break-word font-semibold text-(--text-h)">{user.Fname} {user.Lname}</div>
                    <div className="wrap-break-word text-xs text-(--text)">{user.username} | {user.email}</div>
                  </button>
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

                  <div className="grid gap-1">
                    <span className="text-xs font-medium uppercase text-(--text)">{t('adminUi.users.table.subscription')}</span>
                    <CustomDropdown<AdminSubscriptionPlan>
                      value={planDrafts[user._id] ?? ((user.subscription?.plan || 'free') as AdminSubscriptionPlan)}
                      options={subscriptionOptions.filter((option) => option.value !== '') as { value: AdminSubscriptionPlan; label: string }[]}
                      onChange={(nextPlan) => {
                        setPlanDrafts((previous) => ({ ...previous, [user._id]: nextPlan }))
                        updateMutation.mutate({
                          userId: user._id,
                          payload: {
                            subscriptionPlan: nextPlan,
                            subscriptionStatus: nextPlan === 'pro' ? 'active' : 'inactive',
                          },
                        })
                      }}
                      buttonClassName="bg-(--surface)! py-2! text-xs!"
                    />
                  </div>

                  <div className="grid gap-2 min-[420px]:grid-cols-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-squircle border px-3 py-1 text-xs font-medium ${badgeClass(user.isVerified)}`}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
                      {user.isVerified ? t('adminUi.status.verified') : t('adminUi.status.unverified')}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-squircle border px-3 py-1 text-xs font-medium ${badgeClass(user.isActive)}`}>
                      <HugeiconsIcon icon={UserEdit01Icon} size={22} />
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

                      if (!nextActive) {
                        setDeactivationRequest({
                          ids: [user._id],
                          title: t('adminUi.users.actions.deactivateTitle', 'Deactivate user?'),
                          message: t('adminUi.users.actions.deactivateMessage', {
                            name: `${user.Fname} ${user.Lname}`,
                            defaultValue: `Add a reason before deactivating ${user.Fname} ${user.Lname}.`,
                          }),
                        })
                        return
                      }

                      updateMutation.mutate({
                        userId: user._id,
                        payload: { isActive: nextActive },
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
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.subscription')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.lastLogin')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={7}>{t('adminUi.users.loading')}</td></tr>
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
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => setDetailUserId(user._id)}
                    >
                      <HugeiconsIcon  icon={UserAccountIcon} />
                      <div className="font-semibold text-(--text-h)">{user.Fname} {user.Lname}</div>
                    </button>
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
                    <div className="flex items-center gap-2">
                      <CustomDropdown<AdminSubscriptionPlan>
                        value={planDrafts[user._id] ?? ((user.subscription?.plan || 'free') as AdminSubscriptionPlan)}
                        options={subscriptionOptions.filter((option) => option.value !== '') as { value: AdminSubscriptionPlan; label: string }[]}
                        onChange={(nextPlan) => {
                          setPlanDrafts((previous) => ({ ...previous, [user._id]: nextPlan }))
                          updateMutation.mutate({
                            userId: user._id,
                            payload: {
                              subscriptionPlan: nextPlan,
                              subscriptionStatus: nextPlan === 'pro' ? 'active' : 'inactive',
                            },
                          })
                        }}
                        className="min-w-28"
                        buttonClassName="bg-(--surface-muted)! py-2! text-xs!"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-squircle border px-3 py-1 text-xs font-medium ${badgeClass(user.isVerified)}`}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
                        {t('adminUi.users.emailStatus')}: {user.isVerified ? t('adminUi.status.verified') : t('adminUi.status.unverified')}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-squircle border px-3 py-1 text-xs font-medium ${badgeClass(user.isActive)}`}>
                        <HugeiconsIcon icon={UserEdit01Icon} size={22} />
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

                          if (!nextActive) {
                            setDeactivationRequest({
                              ids: [user._id],
                              title: t('adminUi.users.actions.deactivateTitle', 'Deactivate user?'),
                              message: t('adminUi.users.actions.deactivateMessage', {
                                name: `${user.Fname} ${user.Lname}`,
                                defaultValue: `Add a reason before deactivating ${user.Fname} ${user.Lname}.`,
                              }),
                            })
                            return
                          }

                          updateMutation.mutate({
                            userId: user._id,
                            payload: { isActive: nextActive },
                          })
                        }}
                        activeLabel={t('adminUi.users.actions.deactivate')}
                        inactiveLabel={t('adminUi.users.actions.activate')}
                      />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={7}>{t('adminUi.users.empty')}</td></tr>
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
      {detailUserId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-8">
          <section className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
                  {t('adminUi.users.detail.title')}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-(--text-h)">
                  {detailQuery.data?.user.Fname} {detailQuery.data?.user.Lname}
                </h2>
                <p className="mt-1 text-sm text-(--text)">{detailQuery.data?.user.email}</p>
              </div>
              <button
                type="button"
                className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h)"
                onClick={() => setDetailUserId('')}
              >
                {t('adminUi.common.close')}
              </button>
            </div>

            {detailQuery.isLoading ? (
              <p className="mt-6 text-sm text-(--text)">{t('adminUi.common.loading')}</p>
            ) : detailQuery.data ? (
              <div className="mt-6 grid gap-5">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { label: t('adminUi.users.table.role'), value: detailQuery.data.user.role },
                    { label: t('adminUi.users.table.subscription'), value: detailQuery.data.user.subscription?.plan ?? 'free' },
                    { label: t('adminUi.users.detail.roadmaps'), value: detailQuery.data.roadmaps?.length ?? 0 },
                    { label: t('adminUi.users.detail.courses'), value: detailQuery.data.courses?.length ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-(--text)">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-(--text-h)">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                    <h3 className="font-semibold text-(--text-h)">{t('adminUi.users.detail.roadmaps')}</h3>
                    <div className="mt-3 grid gap-2">
                      {detailQuery.data.roadmaps?.length ? detailQuery.data.roadmaps.map((roadmap) => (
                        <article key={roadmap._id} className="rounded-md bg-(--surface) px-3 py-2">
                          <p className="font-semibold text-(--text-h)">{roadmap.template?.title ?? t('profile.unknownRoadmap')}</p>
                          <p className="text-xs text-(--text)">{roadmap.status} | {Math.round(roadmap.progressPercent ?? 0)}%</p>
                        </article>
                      )) : <p className="text-sm text-(--text)">{t('dashboard.emptyRoadmaps')}</p>}
                    </div>
                  </section>

                  <section className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                    <h3 className="font-semibold text-(--text-h)">{t('adminUi.users.detail.courses')}</h3>
                    <div className="mt-3 grid gap-2">
                      {detailQuery.data.courses?.length ? detailQuery.data.courses.map((courseProgress) => (
                        <article key={courseProgress._id} className="rounded-md bg-(--surface) px-3 py-2">
                          <p className="font-semibold text-(--text-h)">{courseProgress.course?.title ?? t('dashboard.unknownCourse')}</p>
                          <p className="text-xs text-(--text)">{courseProgress.status} | {Math.round(courseProgress.progressPercent ?? 0)}%</p>
                        </article>
                      )) : <p className="text-sm text-(--text)">{t('dashboard.emptyCourses')}</p>}
                    </div>
                  </section>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <DetailFieldSection
                    title={t('adminUi.users.detail.profileData', 'Profile')}
                    data={detailQuery.data.profile}
                    emptyLabel={t('adminUi.users.detail.emptyProfile', 'No profile data has been saved yet.')}
                  />
                  <DetailFieldSection
                    title={t('adminUi.users.detail.preferencesData', 'Preferences')}
                    data={detailQuery.data.preferences}
                    emptyLabel={t('adminUi.users.detail.emptyPreferences', 'No learning preferences have been saved yet.')}
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  <StatusCountList
                    title={t('adminUi.users.detail.roadmapStats', 'Roadmap stats')}
                    items={detailQuery.data.stats?.roadmapsByStatus}
                    emptyLabel={t('adminUi.users.detail.emptyRoadmapStats', 'No roadmap stats yet.')}
                  />
                  <StatusCountList
                    title={t('adminUi.users.detail.courseStats', 'Course stats')}
                    items={detailQuery.data.stats?.coursesByStatus}
                    emptyLabel={t('adminUi.users.detail.emptyCourseStats', 'No course stats yet.')}
                  />
                  <section className="rounded-squircle border border-(--border) bg-(--surface-2) p-4">
                    <h3 className="font-semibold text-(--text-h)">{t('adminUi.users.detail.activity', 'Activity')}</h3>
                    <div className="mt-3 rounded-md bg-(--surface) px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-(--text)">
                        {t('adminUi.users.detail.activityCount', 'Activity count')}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-(--text-h)">
                        {detailQuery.data.stats?.activityCount ?? 0}
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-(--text)">{t('adminUi.common.noData')}</p>
            )}
          </section>
        </div>
      ) : null}
    </motion.main>
  )
}
