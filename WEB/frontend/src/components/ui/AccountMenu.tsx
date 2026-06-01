import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare03Icon,
  Login03Icon,
  Route03Icon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons';
import { clearAccessToken } from '../../utils/api'
import { authQueryKey, logoutCurrentUser } from '../../libs/react-query'
import type { AuthUser } from '../../utils/route-utils'

type Props = {
  user: AuthUser
  language: string
  isRtl?: boolean
}

export default function AccountMenu({ user, language, isRtl = false }: Props) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const accountInitials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  const logoutMutation = useMutation({
    mutationFn: logoutCurrentUser,
    onSuccess: () => {
      clearAccessToken()
      queryClient.setQueryData(authQueryKey, null)
      navigate(`/${language}/login`, { replace: true })
    },
    onError: () => {
      clearAccessToken()
      queryClient.setQueryData(authQueryKey, null)
      navigate(`/${language}/login`, { replace: true })
    },
  })

  return (
    <div className="relative hidden lg:block isolate z-80">
      <button
        type="button"
        className="inline-flex items-center gap-3 rounded-squircle border border-(--border) bg-(--surface) px-3 py-2 text-start text-(--text-h) transition-colors hover:bg-(--surface-2) cursor-pointer relative z-81"
        aria-expanded={open}
        aria-label={t('navbar.accountMenu')}
        onClick={() => setOpen((s) => !s)}
        style={
          open
            ? {
                boxShadow: '0 0 0 3px rgba(255,255,255,0.06), 0 10px 30px rgba(29,185,84,0.12)'
              }
            : undefined
        }
      >
        <span
          className="grid size-10 place-items-center rounded-squircle text-sm font-semibold text-white shadow-[0_12px_24px_rgba(12,107,80,0.28)] ring-1 ring-white/10"
          style={{
            background:
              'linear-gradient(145deg, #0c6b50 0%, #33ab6a 34%, #36e28a 66%, #9fd95b 100%)',
          }}
        >
          {accountInitials}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-[0.22em] text-(--text-secondary)">{t('navbar.account')}</span>
          <span className="max-w-36 truncate text-sm font-semibold text-(--text-h)">{user.name}</span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="account-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-[calc(100%+0.75rem)] z-90 mt-0 w-72 overflow-hidden rounded-3xl border border-(--border) bg-(--surface) p-2 shadow-[0_24px_80px_rgba(0,0,0,0.32)] pointer-events-auto ${isRtl ? 'left-0' : 'right-0'}`}
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.32), 0 0 0 2px rgba(255,255,255,0.03)' }}
          >
            <div className="rounded-squircle border border-(--border) bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.12),rgba(255,255,255,0.02))] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-(--text-secondary)">{t('navbar.signedInAs')}</p>
              <p className="mt-1 truncate text-sm font-semibold text-(--text-h)">{user.name}</p>
              <p className="truncate text-xs text-(--text)">{user.email}</p>
            </div>

            <div className="mt-2 grid gap-1">
              <NavLink to={`/${language}/dashboard`} className={({ isActive }) => `flex w-full items-center gap-2 rounded-squircle px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-(--surface-3) text-(--text-h)' : 'text-(--text-secondary) hover:bg-(--surface-soft-hover) hover:text-(--text-h)'} cursor-pointer`} onClick={() => setOpen(false)}>
                <span className="grid size-8 place-items-center rounded-squircle bg-[linear-gradient(135deg,rgba(29,185,84,0.22),rgba(30,215,96,0.08))] text-(--text-h)">
                  <HugeiconsIcon icon={DashboardSquare03Icon} size={16} />
                </span>
                <span>{t('layout.dashboard')}</span>
              </NavLink>

              <NavLink to={`/${language}/profile`} className={({ isActive }) => `flex w-full items-center gap-2 rounded-squircle px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-(--surface-3) text-(--text-h)' : 'text-(--text-secondary) hover:bg-(--surface-soft-hover) hover:text-(--text-h)'} cursor-pointer`} onClick={() => setOpen(false)}>
                <span className="grid size-8 place-items-center rounded-squircle bg-[linear-gradient(135deg,rgba(29,185,84,0.18),rgba(10,140,70,0.08))] text-(--text-h)">
                  <HugeiconsIcon icon={UserEdit01Icon} size={16} />
                </span>
                <span>{t('navbar.myProfile')}</span>
              </NavLink>

              <NavLink to={`/${language}/roadmaps/frontend`} className={({ isActive }) => `flex w-full items-center gap-2 rounded-squircle px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-(--surface-3) text-(--text-h)' : 'text-(--text-secondary) hover:bg-(--surface-soft-hover) hover:text-(--text-h)'} cursor-pointer`} onClick={() => setOpen(false)}>
                <span className="grid size-8 place-items-center rounded-squircle bg-[linear-gradient(135deg,rgba(29,185,84,0.18),rgba(6,95,70,0.1))] text-(--text-h)">
                  <HugeiconsIcon icon={Route03Icon} size={16} />
                </span>
                <span>{t('navbar.roadmaps')}</span>
              </NavLink>

              <button type="button" onClick={() => logoutMutation.mutate()} className="flex w-full items-center gap-2 rounded-squircle px-4 py-3 text-start text-sm font-medium text-(--error) transition-colors hover:bg-[rgba(226,33,52,0.08)] hover:text-(--error) cursor-pointer">
                <span className="grid size-8 place-items-center rounded-squircle bg-[linear-gradient(135deg,rgba(226,33,52,0.18),rgba(226,33,52,0.06))] text-(--error)">
                  <HugeiconsIcon icon={Login03Icon} size={16} />
                </span>
                <span>{t('navbar.logout')}</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
