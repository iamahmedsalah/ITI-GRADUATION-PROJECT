import type { AdminPagination as AdminPaginationData } from '../../libs/admin-api'

type AdminPaginationProps = {
  pagination?: AdminPaginationData
  onPageChange: (page: number) => void
  previousLabel: string
  nextLabel: string
  summaryLabel: string
}

export default function AdminPagination({
  pagination,
  onPageChange,
  previousLabel,
  nextLabel,
  summaryLabel,
}: AdminPaginationProps) {
  if (!pagination) {
    return null
  }

  const currentPage = Math.max(1, pagination.page)
  const totalPages = Math.max(1, pagination.pages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border) bg-(--surface-soft) px-4 py-3 text-sm">
      <span className="text-(--text)">{summaryLabel}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="cursor-pointer rounded-squircle border border-(--border) px-3 py-2 font-semibold text-(--text-h) transition hover:bg-(--surface-soft-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {previousLabel}
        </button>
        <span className="rounded-squircle bg-(--surface-2) px-3 py-2 text-(--text-h)">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="cursor-pointer rounded-squircle border border-(--border) px-3 py-2 font-semibold text-(--text-h) transition hover:bg-(--surface-soft-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
