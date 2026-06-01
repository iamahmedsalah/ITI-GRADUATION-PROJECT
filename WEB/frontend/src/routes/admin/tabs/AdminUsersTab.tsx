import { Link } from 'react-router-dom'

type AdminUsersTabProps = {
  to: string
  count: number
  title: string
  subtitle: string
}

export default function AdminUsersTab({ to, count, title, subtitle }: AdminUsersTabProps) {
  return (
    <Link
      to={to}
      className="group rounded-2xl bg-(--surface) px-5 py-5 transition-transform duration-200 hover:scale-[1.02] hover:bg-(--surface-2)"
    >
      <p className="text-xs uppercase tracking-[0.14em] text-(--text)">{title}</p>
      <p className="mt-2 text-3xl font-bold text-(--text-h)">{count}</p>
      <p className="mt-2 text-sm text-(--text)">{subtitle}</p>
    </Link>
  )
}
