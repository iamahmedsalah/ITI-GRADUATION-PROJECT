import { motion, type Variants } from 'framer-motion'
import type { AuthUser } from '../../utils/route-utils'

type Props = {
  user: AuthUser
  t: (k: string) => string
  variants?: Variants
}

export default function ProfileStatusCard({ user, t, variants }: Props) {
  const items = [
    { label: t('profile.role'), value: user.role },
    { label: t('profile.verified'), value: user.isVerified ? t('profile.verifiedYes') : t('profile.verifiedNo') },
    { label: t('profile.lastLogin'), value: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('profile.never') },
  ]

  return (
    <motion.article variants={variants} className="rounded-4xl border border-(--border) bg-(--surface) p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-(--text-h)">{t('profile.status')}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text)">{item.label}</p>
            <p className="mt-1 wrap-break-word text-sm font-semibold text-(--text-h)">{item.value}</p>
          </div>
        ))}
      </div>
    </motion.article>
  )
}
