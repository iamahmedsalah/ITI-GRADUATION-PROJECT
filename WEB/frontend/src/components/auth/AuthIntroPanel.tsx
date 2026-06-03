import type { ReactNode } from 'react'

type AuthIntroPanelProps = {
  badge: string
  title: string
  subtitle: string
  organizeTitle: string
  helper: string
  children?: ReactNode
  gradientTitle?: boolean
}

export default function AuthIntroPanel({
  badge,
  title,
  subtitle,
  organizeTitle,
  helper,
  children,
  gradientTitle = true,
}: AuthIntroPanelProps) {
  return (
    <>
      <div className="mb-4 inline-flex rounded-squircle border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-(--text)">
        {badge}
      </div>
      <h1
        className={
          gradientTitle
            ? 'bg-linear-to-r from-(--gd-primary) to-(--gd-secondary) bg-clip-text text-3xl font-bold text-transparent sm:text-5xl'
            : 'text-2xl font-bold text-(--text) sm:text-3xl'
        }
      >
        {title}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-(--text)">{subtitle}</p>

      <div className="mt-7 grid gap-3 rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text)">
          {organizeTitle}
        </p>
        <p className="text-sm leading-6 text-(--text)">{helper}</p>
      </div>

      {children}
    </>
  )
}
