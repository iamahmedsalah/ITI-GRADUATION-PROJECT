import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { createCardVariants, createHeroLineVariants, createPageVariants, createStaggerContainerVariants } from '../libs/motionVariants'

function AdminDashboardPage() {
  const { direction, language } = useLanguage()
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)
  const cardVariants = createCardVariants(direction)

  const stats = [
    { label: 'Users', value: '1,248', note: 'Active members across both locales' },
    { label: 'Roadmaps', value: '42', note: 'Published learning paths' },
    { label: 'Support', value: '18', note: 'Pending admin actions' },
  ]

  return (
    <motion.main className="px-6 py-6 lg:px-8 lg:py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="grid gap-6 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]" variants={staggerContainerVariants}>
        <motion.div variants={heroLineVariants} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-(--text)">Admin dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-(--text-h)">Overview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text)">
              Manage content, users, and learning data in the {language} locale from this sidebar-driven layout.
            </p>
          </div>
          <div className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            Sidebar layout active
          </div>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainerVariants}>
          {stats.map((stat) => (
            <motion.article key={stat.label} variants={cardVariants} className="rounded-2xl border border-(--border) bg-(--surface) p-5">
              <p className="text-sm uppercase tracking-[0.16em] text-(--text)">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-(--text-h)">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-(--text)">{stat.note}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div variants={heroLineVariants} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
            <h3 className="text-lg font-semibold text-(--text-h)">Recent activity</h3>
            <ul className="mt-4 grid gap-3 text-sm text-(--text)">
              <li className="rounded-xl border border-(--border) px-4 py-3">12 new users signed up this week.</li>
              <li className="rounded-xl border border-(--border) px-4 py-3">3 roadmap templates were published.</li>
              <li className="rounded-xl border border-(--border) px-4 py-3">2 support messages need review.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
            <h3 className="text-lg font-semibold text-(--text-h)">Next actions</h3>
            <div className="mt-4 grid gap-3 text-sm text-(--text)">
              <div className="rounded-xl border border-(--border) px-4 py-3">Approve pending roadmap edits.</div>
              <div className="rounded-xl border border-(--border) px-4 py-3">Review reported user accounts.</div>
              <div className="rounded-xl border border-(--border) px-4 py-3">Update homepage announcements.</div>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default AdminDashboardPage
