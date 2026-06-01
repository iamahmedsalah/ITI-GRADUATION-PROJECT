import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../../context/LanguageContext'
import { createPageVariants } from '../../libs/motionVariants'
import { fetchAdminUsers, updateAdminUser } from '../../libs/admin-api'

function badgeClass(value: boolean) {
  return value
    ? 'border-[rgba(29,185,84,0.25)] bg-[rgba(29,185,84,0.12)] text-[#7ef0a5]'
    : 'border-[rgba(226,33,52,0.25)] bg-[rgba(226,33,52,0.12)] text-[#ff8f9d]'
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
  const [roleDrafts, setRoleDrafts] = useState<Record<string, 'student' | 'instructor' | 'admin'>>({})

  const queryKey = useMemo(
    () => ['admin', 'users', search, role, isVerified, isActive],
    [search, role, isVerified, isActive],
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminUsers({
        q: search || undefined,
        role: role || undefined,
        isVerified: isVerified || undefined,
        isActive: isActive || undefined,
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

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <section className="grid gap-5 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
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

        <div className="grid gap-3 md:grid-cols-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminUi.users.searchPlaceholder')} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.users.filters.allRoles')}</option>
            <option value="student">{t('adminUi.roles.student')}</option>
            <option value="instructor">{t('adminUi.roles.instructor')}</option>
            <option value="admin">{t('adminUi.roles.admin')}</option>
          </select>
          <select value={isVerified} onChange={(event) => setIsVerified(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.users.filters.allVerification')}</option>
            <option value="true">{t('adminUi.status.verified')}</option>
            <option value="false">{t('adminUi.status.unverified')}</option>
          </select>
          <select value={isActive} onChange={(event) => setIsActive(event.target.value)} className="rounded-squircle border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--text-h) outline-none">
            <option value="">{t('adminUi.users.filters.allStatus')}</option>
            <option value="true">{t('adminUi.status.active')}</option>
            <option value="false">{t('adminUi.status.inactive')}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-(--border)">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-(--surface-soft)">
              <tr className="text-left text-(--text)">
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.user')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.role')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.status')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.lastLogin')}</th>
                <th className="px-4 py-3 font-medium">{t('adminUi.users.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={5}>{t('adminUi.users.loading')}</td></tr>
              ) : data?.data.length ? data.data.map((user) => (
                <tr key={user._id} className="border-t border-(--border)">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-(--text-h)">{user.Fname} {user.Lname}</div>
                    <div className="text-xs text-(--text)">{user.username} | {user.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={roleDrafts[user._id] ?? (user.role as 'student' | 'instructor' | 'admin')}
                        onChange={(event) => {
                          const nextRole = event.target.value as 'student' | 'instructor' | 'admin'
                          setRoleDrafts((previous) => ({ ...previous, [user._id]: nextRole }))
                        }}
                        className="rounded-squircle border border-(--border) bg-(--surface-muted) px-3 py-2 text-xs text-(--text-h) outline-none"
                      >
                        <option value="student">{t('adminUi.roles.student')}</option>
                        <option value="instructor">{t('adminUi.roles.instructor')}</option>
                        <option value="admin">{t('adminUi.roles.admin')}</option>
                      </select>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        onClick={() => {
                          const selectedRole = roleDrafts[user._id] ?? (user.role as 'student' | 'instructor' | 'admin')
                          if (selectedRole === user.role) {
                            return
                          }

                          updateMutation.mutate({
                            userId: user._id,
                            payload: { role: selectedRole },
                          })
                        }}
                        disabled={updateMutation.isPending}
                      >
                        {t('adminUi.users.actions.saveRole')}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(user.isVerified)}`}>{user.isVerified ? t('adminUi.status.verified') : t('adminUi.status.unverified')}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(user.isActive)}`}>{user.isActive ? t('adminUi.status.active') : t('adminUi.status.inactive')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-(--text)">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('profile.never')}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            userId: user._id,
                            payload: { isVerified: !user.isVerified },
                          })
                        }}
                      >
                        {user.isVerified ? t('adminUi.users.actions.unverify') : t('adminUi.users.actions.verify')}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-h) transition-transform duration-200 hover:scale-[1.04] hover:bg-(--surface-soft)"
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
                      >
                        {user.isActive ? t('adminUi.users.actions.deactivate') : t('adminUi.users.actions.activate')}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-4 py-6 text-(--text)" colSpan={5}>{t('adminUi.users.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.main>
  )
}
