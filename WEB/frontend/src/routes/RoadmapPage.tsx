import { motion } from 'framer-motion'
import { useLoaderData } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { createHeroLineVariants, createPageVariants } from '../libs/motionVariants'
import type { RoadmapLoaderData } from '../utils/route-utils'

function RoadmapPage() {
  const { language: routeLanguage, slug } = useLoaderData() as RoadmapLoaderData
  const { direction } = useLanguage()
  const pageVariants = createPageVariants(direction)
  const heroLineVariants = createHeroLineVariants(direction)

  return (
    <motion.main className="px-8 py-8" variants={pageVariants} initial="hidden" animate="show">
      <motion.div className="rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)]" variants={heroLineVariants}>
        <motion.h1 variants={heroLineVariants} className="text-2xl font-semibold text-(--text-h)">
          Roadmap: {slug}
        </motion.h1>
        <motion.p variants={heroLineVariants} className="mt-2 text-sm leading-6 text-(--text)">
          Language from URL: {routeLanguage}. This route is ready for a future roadmap loader and action.
        </motion.p>
      </motion.div>
    </motion.main>
  )
}

export default RoadmapPage
