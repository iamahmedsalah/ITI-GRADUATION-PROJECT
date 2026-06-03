import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { createPageVariants, type MotionDirection } from '../../libs/motionVariants'

type AuthShellProps = {
  direction: MotionDirection
  aside: ReactNode
  children: ReactNode
  gridClassName?: string
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function AuthShell({
  direction,
  aside,
  children,
  gridClassName = 'lg:grid-cols-[0.92fr_1.08fr]',
}: AuthShellProps) {
  const isRtl = direction === 'rtl'

  return (
    <motion.main
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
      variants={createPageVariants(direction)}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-sm"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-squircle bg-[radial-gradient(circle,rgba(29,185,84,0.42)_0%,rgba(29,185,84,0.16)_40%,rgba(29,185,84,0)_72%)] blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-squircle bg-[radial-gradient(circle,rgba(var(--glow-neutral-rgb),0.18)_0%,rgba(var(--glow-neutral-rgb),0.06)_45%,rgba(var(--glow-neutral-rgb),0)_78%)] blur-3xl" />

        <div className={`relative grid ${gridClassName}`}>
          <motion.section
            className={`border-b border-(--border) px-6 py-8 sm:px-8 lg:border-b-0 ${isRtl ? 'lg:border-l' : 'lg:border-r'}`}
            variants={itemVariants}
          >
            {aside}
          </motion.section>

          {children}
        </div>
      </motion.div>
    </motion.main>
  )
}
