import { TranslateIcon } from '@hugeicons/core-free-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { useLanguage } from '../../context/LanguageContext'
import { toggleWrapperVariants } from '../../libs/motionVariants'

export function LangToggleButton() {
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()

  const toggleLanguage = () => {
    const nextLanguage = language === 'en' ? 'ar' : 'en'
    const nextPath = location.pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${nextLanguage}`)
    const targetPath = nextPath === location.pathname ? `/${nextLanguage}` : nextPath

    setLanguage(nextLanguage)
    navigate(`${targetPath}${location.search}${location.hash}`, { replace: true })
  }

  return (
    <motion.div variants={toggleWrapperVariants} initial="rest" animate="rest" whileHover="hover" whileTap="tap">
      <button
        type="button"
        onClick={toggleLanguage}
        aria-label={`Language: ${language}`}
        aria-pressed={language === 'ar'}
        className="grid size-11 place-items-center rounded-full border border-(--border) bg-transparent text-(--text-h) cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={language}
            initial={{ opacity: 0, scale: 0.68, rotate: language === 'ar' ? -35 : 35, y: 6 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.68, rotate: language === 'ar' ? 35 : -35, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <HugeiconsIcon icon={TranslateIcon} size={18} className="size-4.5" />
          </motion.span>
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

export default LangToggleButton
