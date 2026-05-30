import { createElement } from 'react'
import { TranslateIcon } from '@hugeicons/core-free-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { toggleWrapperVariants } from '../../libs/motionVariants'

type HugeIconData = typeof TranslateIcon

function RenderHugeIcon({ icon, size = 18, className }: { icon: HugeIconData; size?: number; className?: string }) {
  const children = icon.map(([tag, attrs], index) =>
    createElement(tag, {
      ...attrs,
      key: attrs.key ?? index,
    }),
  )

  return createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      role: 'img',
      'aria-hidden': 'true',
      className,
    },
    children,
  )
}

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
            <RenderHugeIcon icon={TranslateIcon} className="size-4.5" />
          </motion.span>
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

export default LangToggleButton
