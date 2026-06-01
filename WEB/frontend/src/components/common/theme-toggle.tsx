import {
  DeviceAccessIcon,
  Moon02Icon,
  Sun01Icon,
} from '@hugeicons/core-free-icons';
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { toggleWrapperVariants } from '../../libs/motionVariants'
import { HugeiconsIcon } from '@hugeicons/react';

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
        className="grid size-11 place-items-center rounded-squircle border border-(--border) bg-transparent text-(--text-h) cursor-pointer"
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
              <HugeiconsIcon icon={DeviceAccessIcon} size={18} className="size-4.5" />
              <motion.span
                aria-hidden="true"
                className={`absolute -top-1.5 -right-1.5 size-2 rounded-squircle border-2 border-(--bg) ${
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
              <HugeiconsIcon icon={Moon02Icon} size={18} className="size-4.5" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, scale: 0.68, rotate: 55, y: 6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.68, rotate: -55, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <HugeiconsIcon icon={Sun01Icon} size={18} className="size-4.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}

export default ThemeToggleButton
