import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { createHeroLineVariants, createPageVariants } from '../libs/motionVariants'

function AdminLoginPage() {
  const { language, direction } = useLanguage()
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)

  return (
    <motion.main className="px-8 py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.section className="rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)]" variants={heroLineVariants}>
        <motion.h1 variants={heroLineVariants} className="text-2xl font-semibold text-(--text-h)">
          Admin Login
        </motion.h1>
        <motion.p variants={heroLineVariants} className="mt-2 text-sm leading-6 text-(--text)">
          This is the admin login page for the {language} locale.
        </motion.p>
        <motion.div variants={heroLineVariants} className="mt-4 flex flex-wrap gap-3">
          <Link to={`/${language}`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            Back home
          </Link>
          <Link to={`/${language}/login`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            User login
          </Link>
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default AdminLoginPage
