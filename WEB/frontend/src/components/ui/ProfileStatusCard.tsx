import { motion, type Variants } from 'framer-motion'
import type { AuthUser } from '../../utils/route-utils'

type Props = {
  user: AuthUser
  t: (k: string) => string
  variants?: Variants
}

export default function ProfileStatusCard({ user, t, variants }: Props) {
  return (
    <motion.article variants={variants} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
      <h2 className="text-lg font-semibold text-(--text-h)">{t('profile.status')}</h2>
      <p className="mt-2 text-sm leading-6 text-(--text)">{t('profile.role')}: {user.role}</p>
      <p className="text-sm leading-6 text-(--text)">{t('profile.verified')}: {user.isVerified ? t('profile.verifiedYes') : t('profile.verifiedNo')}</p>
      <p className="text-sm leading-6 text-(--text)">{t('profile.lastLogin')}: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('profile.never')}</p>
    </motion.article>
  )
}
