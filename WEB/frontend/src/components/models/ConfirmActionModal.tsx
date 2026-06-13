import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Delete02Icon } from '@hugeicons/core-free-icons'

type ConfirmActionModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  isPending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isPending = false,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-squircle border border-[rgba(226,33,52,0.35)] bg-[rgba(226,33,52,0.08)] text-(--error)">
            <HugeiconsIcon icon={Alert02Icon} size={22} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-(--text-h)">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-(--text)">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2)"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-squircle border border-[rgba(226,33,52,0.35)] px-4 py-2 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
