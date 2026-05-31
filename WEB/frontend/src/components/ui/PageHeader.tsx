import { motion } from 'framer-motion'

type Props = {
  title: string
  subtitle?: string
  actions?: React.ReactNode | React.ReactNode[] | null
  variants?: import('framer-motion').Variants
}

export default function PageHeader({ title, subtitle, actions, variants }: Props) {
  return (
    <motion.div variants={variants} className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-h)">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-(--text)">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </motion.div>
  )
}
