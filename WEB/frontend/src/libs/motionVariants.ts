import type { Variants } from 'framer-motion'

export type MotionDirection = 'ltr' | 'rtl'

function getDirectionX(direction: MotionDirection, amount: number) {
  return direction === 'rtl' ? amount : -amount
}

export function createPageVariants(direction: MotionDirection): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 18,
      x: getDirectionX(direction, 14),
      filter: 'blur(6px)',
    },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        when: 'beforeChildren',
        staggerChildren: direction === 'rtl' ? 0.14 : 0.1,
        delayChildren: 0.08,
      },
    },
  }
}

export function createHeroLineVariants(direction: MotionDirection): Variants {
  return {
    hidden: { opacity: 0, y: 14, x: getDirectionX(direction, 10) },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  }
}

export function createStaggerContainerVariants(direction: MotionDirection): Variants {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: direction === 'rtl' ? 0.14 : 0.12,
        delayChildren: direction === 'rtl' ? 0.14 : 0.08,
      },
    },
  }
}

export function createCardVariants(direction: MotionDirection): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 28,
      x: getDirectionX(direction, 18),
      scale: 0.94,
      rotate: direction === 'rtl' ? -1.5 : 1.5,
    },
    show: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }
}

export function createListItemVariants(direction: MotionDirection): Variants {
  return {
    hidden: {
      opacity: 0,
      x: getDirectionX(direction, 16),
    },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.34,
        ease: 'easeOut',
      },
    },
  }
}

export function getCardHoverShift(direction: MotionDirection) {
  return direction === 'rtl' ? -8 : 8
}

export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: 'blur(6px)',
  },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
}

export const heroLineVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
}

export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -14,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28,
      ease: 'easeOut',
    },
  },
}

export const toggleWrapperVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.12,
    rotate: -4,
    transition: {
      duration: 0.24,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.9,
    rotate: 0,
    transition: {
      duration: 0.1,
      ease: 'easeOut',
    },
  },
}

export const authFormVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.04,
    },
  },
}

export const authFormSectionVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
}

export const authFormFieldGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
}

export const authFormFieldItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}
