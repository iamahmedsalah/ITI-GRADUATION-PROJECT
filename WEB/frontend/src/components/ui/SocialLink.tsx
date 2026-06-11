import { motion, type Variants } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  GitlabIcon,
} from '@hugeicons/core-free-icons';














type SocialLinkProps = {
  href: string
  label: string
  icon: typeof GitlabIcon
  variants: Variants;
}

export function SocialLink({ href, label, icon, variants }: SocialLinkProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      variants={variants}
      whileHover={{ x: 10, borderColor: 'var(--gd-primary)' }}
      className="inline-flex min-h-12 items-center gap-3 rounded-squircle border border-(--border) bg-(--surface) px-4 py-3 text-sm font-bold hover:bg-(--gd-primary)/50 text-(--text-h) transition"
    >
      <HugeiconsIcon icon={icon} size={22} className="text-(--gd-primary)" />
      <span>{label}</span>
    </motion.a>
  )
}

