import { motion } from 'framer-motion'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useLanguage } from '../context/LanguageContext'
import { createCardVariants, createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../libs/motionVariants'
import { clearAccessToken } from '../utils/api'
import type { DashboardLoaderData } from '../utils/route-utils'
import { authQueryKey, logoutCurrentUser } from '../libs/react-query'

function DashboardPage() {
  const { language, direction } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useLoaderData() as DashboardLoaderData
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)
  const cardVariants = createCardVariants(direction)

  const logoutMutation = useMutation({
    mutationFn: logoutCurrentUser,
    onSuccess: async () => {
      clearAccessToken()
      queryClient.setQueryData(authQueryKey, null)
      toast.info(t('auth.logoutSuccess'))
      navigate(`/${language}/login`, { replace: true })
    },
    onError: (error) => {
      clearAccessToken()
      toast.error(error instanceof Error ? error.message : t('auth.logoutFailed'))
    },
  })

  return (
    <motion.main className="px-8 py-8 -z-20"  variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="grid gap-6 rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)]" variants={staggerContainerVariants}>
        <motion.div variants={heroLineVariants} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-(--text-h)">User dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-(--text)">
              Protected route for the signed-in user in the {language} locale.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/${language}`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
              Home
            </Link>
            <Link to={`/${language}/verify-email`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
              Verify email
            </Link>
            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)"
            >
              Logout
            </button>
          </div>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-2" variants={staggerContainerVariants}>
          <motion.article variants={cardVariants} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
            <h2 className="text-lg font-semibold text-(--text-h)">Account</h2>
            <p className="mt-2 text-sm leading-6 text-(--text)">Username: {user.username}</p>
            <p className="text-sm leading-6 text-(--text)">Name: {user.name}</p>
            <p className="text-sm leading-6 text-(--text)">Email: {user.email}</p>
          </motion.article>
          <motion.article variants={cardVariants} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
            <h2 className="text-lg font-semibold text-(--text-h)">Status</h2>
            <p className="mt-2 text-sm leading-6 text-(--text)">Role: {user.role}</p>
            <p className="text-sm leading-6 text-(--text)">Verified: {user.isVerified ? 'Yes' : 'No'}</p>
            <p className="text-sm leading-6 text-(--text)">Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
          </motion.article>
        </motion.div>

        {!user.isVerified ? (
          <motion.div variants={heroLineVariants} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
            <h2 className="text-lg font-semibold text-(--text-h)">Verify your account</h2>
            <p className="mt-2 text-sm leading-6 text-(--text)">
              Your dashboard is available, but verification is still required to unlock the full account flow.
            </p>
            <Link to={`/${language}/verify-email`} className="mt-4 inline-flex rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
              Open verification page
            </Link>
          </motion.div>
        ) : null}
      </motion.section>
    </motion.main>
  )
}

export default DashboardPage
