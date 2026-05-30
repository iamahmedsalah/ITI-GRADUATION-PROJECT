
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import {
  createCardVariants,
  createHeroLineVariants,
  createListItemVariants,
  createPageVariants,
  createStaggerContainerVariants,
  getCardHoverShift,
} from '../libs/motionVariants'
import LangToggleButton from '../components/common/lang-toggle'
import ThemeToggleButton from '../components/common/theme-toggle'

function HomePage() {
  const { t } = useTranslation()
  const { language, direction } = useLanguage()


  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)
  const staggerContainerVariants = createStaggerContainerVariants(direction)
  const cardVariants = createCardVariants(direction)
  const listItemVariants = createListItemVariants(direction)
  const cardHoverShift = getCardHoverShift(direction)
  const roadmapPath = `/${language}/roadmaps/frontend`

  return (
    <motion.main
      className="relative isolate overflow-hidden px-8 py-8"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        initial={false}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(29,185,84,0.45)_0%,rgba(29,185,84,0.16)_35%,rgba(29,185,84,0)_70%)] blur-3xl"
          animate={{
            x: [0, direction === 'rtl' ? -18 : 18, 0],
            y: [0, -14, 0],
            scale: [1, 1.1, 1],
            opacity: [0.45, 0.78, 0.45],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -left-20 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(var(--glow-neutral-rgb),0.18)_0%,rgba(var(--glow-neutral-rgb),0.08)_30%,rgba(var(--glow-neutral-rgb),0)_70%)] blur-3xl"
          animate={{
            x: [0, direction === 'rtl' ? 16 : -16, 0],
            y: [0, 18, 0],
            scale: [1, 1.08, 1],
            opacity: [0.16, 0.34, 0.16],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.div className="flex items-center gap-3" variants={heroLineVariants}>
        <motion.h1 className="m-0" variants={heroLineVariants}>
          {t('title')}
        </motion.h1>
        <LangToggleButton />
        <ThemeToggleButton />
      </motion.div>

      <motion.p variants={heroLineVariants} className="max-w-140">
        {t('subtitle')}
      </motion.p>

      <motion.section className="mt-10 grid gap-4 md:grid-cols-3" variants={staggerContainerVariants} initial="hidden" animate="show">
        {[
          {
            title: 'Theme Motion',
            text: 'Sun, moon, and device states now transition with stronger movement.',
          },
          {
            title: 'Language Motion',
            text: 'English and Arabic switching feels smoother and more immediate.',
          },
          {
            title: 'Page Motion',
            text: 'Cards and list items reveal with staggered timing for a richer entry.',
          },
        ].map((item) => (
          <motion.article
            key={item.title}
            variants={cardVariants}
            className="rounded-2xl border border-(--border) bg-(--surface) p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] will-change-transform"
            whileHover={{ y: -10, x: cardHoverShift, scale: 1.03, rotate: direction === 'rtl' ? -0.5 : 0.5 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, mass: 0.8 }}
          >
            <h2 className="mb-2 text-lg font-semibold text-(--text-h)">{item.title}</h2>
            <p className="text-sm leading-6 text-(--text)">{item.text}</p>
          </motion.article>
        ))}
      </motion.section>

      <motion.section className="mt-10" variants={staggerContainerVariants} initial="hidden" animate="show">
        <motion.h2 variants={heroLineVariants} className="mb-3 text-base uppercase tracking-[0.18em] text-(--text)">
          Motion Preview
        </motion.h2>
        <motion.ul variants={staggerContainerVariants} className="grid gap-3">
          {['Dramatic icon swaps', 'Staggered card entrance', 'Animated header reveal'].map((label) => (
            <motion.li
              key={label}
              variants={listItemVariants}
              className="rounded-xl border border-(--border) bg-(--surface) px-4 py-3 text-left text-sm text-(--text-h) will-change-transform"
              whileHover={{ x: direction === 'rtl' ? -8 : 8, scale: 1.015 }}
              whileTap={{ scale: 0.995 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, mass: 0.7 }}
            >
              {label}
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>

      <motion.section className="mt-10 grid gap-4 rounded-2xl border border-(--border) bg-(--surface) p-5" variants={staggerContainerVariants} initial="hidden" animate="show">
        <motion.h2 variants={heroLineVariants} className="text-base font-semibold text-(--text-h)">
          Route structure
        </motion.h2>
        <motion.p variants={heroLineVariants} className="text-sm leading-6 text-(--text)">
          Current language: {language}. Future routes can follow the pattern /{language}/roadmaps/frontend and keep the locale synced from the URL.
        </motion.p>
        <motion.div variants={heroLineVariants} className="pt-2">
          <Link
            to={roadmapPath}
            className="inline-flex items-center rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-h) transition-transform duration-200 hover:-translate-y-0.5"
          >
            Open sample roadmap
          </Link>
        </motion.div>
        <motion.div variants={heroLineVariants} className="flex flex-wrap gap-3 pt-2">
          <Link to={`/${language}/login`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            User login
          </Link>
          <Link to={`/${language}/signup`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            Sign up
          </Link>
          <Link to={`/${language}/admin/login`} className="rounded-full border border-(--border) px-4 py-2 text-sm text-(--text-h)">
            Admin login
          </Link>
        </motion.div>
      </motion.section>
    </motion.main>
  )
}

export default HomePage
