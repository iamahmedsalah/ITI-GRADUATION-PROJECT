import { motion, type Variants } from 'framer-motion'
import type { AuthUser } from '../../utils/route-utils'

type Props = {
  user: AuthUser
  t: (k: string) => string
  variants?: Variants
}

export default function ProfileIdentityCard({ user, t, variants }: Props) {
  return (
    <motion.article variants={variants} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
      <h2 className="text-lg font-semibold text-(--text-h)">{t('profile.identity')}</h2>
      <p className="mt-2 text-sm leading-6 text-(--text)">{t('profile.username')}: {user.username}</p>
      <p className="text-sm leading-6 text-(--text)">{t('profile.name')}: {user.name}</p>
      <p className="text-sm leading-6 text-(--text)">{t('profile.email')}: {user.email}</p>
    </motion.article>
  )
}
