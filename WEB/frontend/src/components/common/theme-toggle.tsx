import { createElement } from 'react'
import { DeviceAccessIcon, Moon01Icon, Sun01Icon,  } from '@hugeicons/core-free-icons'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { toggleWrapperVariants } from '../../libs/motionVariants'

type HugeIconData = typeof Sun01Icon

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

export function ThemeToggleButton() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <motion.div variants={toggleWrapperVariants} initial="rest" animate="rest" whileHover="hover" whileTap="tap">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Theme: ${theme}`}
        aria-pressed={theme !== 'system' ? resolvedTheme === 'dark' : false}
        className="grid size-11 place-items-center rounded-full border border-(--border) bg-transparent text-(--text-h) cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'system' ? (
            <motion.div
              key={`system-${resolvedTheme}`}
              className="relative grid place-items-center"
              initial={{ opacity: 0, scale: 0.72, rotate: -28, y: 8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.72, rotate: 28, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <RenderHugeIcon icon={DeviceAccessIcon} className="size-4.5" />
              <motion.span
                aria-hidden="true"
                className={`absolute -top-1.5 -right-1.5 size-2 rounded-full border-2 border-(--bg) ${
                  resolvedTheme === 'dark' ? 'bg-(--gd-primary)' : 'bg-(--gd-secondary)'
                }`}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.16 }}
              />
            </motion.div>
          ) : resolvedTheme === 'dark' ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, scale: 0.68, rotate: -55, y: 6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.68, rotate: 55, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <RenderHugeIcon icon={Moon01Icon} className="size-4.5" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, scale: 0.68, rotate: 55, y: 6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.68, rotate: -55, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <RenderHugeIcon icon={Sun01Icon} className="size-4.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

export default ThemeToggleButton
