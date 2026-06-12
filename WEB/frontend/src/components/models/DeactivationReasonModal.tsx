import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'

type DeactivationReasonModalProps = {
  open: boolean
  title: string
  message: string
  reasonLabel: string
  reasonPlaceholder: string
  confirmLabel: string
  cancelLabel: string
  isPending?: boolean
  minLength?: number
  maxLength?: number
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export default function DeactivationReasonModal({
  open,
  title,
  message,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  cancelLabel,
  isPending = false,
  minLength = 3,
  maxLength = 500,
  onCancel,
  onConfirm,
}: DeactivationReasonModalProps) {
  const [reason, setReason] = useState('')
  const trimmedReason = reason.trim()
  const isTooShort = trimmedReason.length < minLength
  const isTooLong = trimmedReason.length > maxLength
  const error = isTooShort
    ? `Reason must be at least ${minLength} characters.`
    : isTooLong
      ? `Reason must be at most ${maxLength} characters.`
      : ''

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 py-8">
      <form
        className="w-full max-w-lg rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]"
        onSubmit={(event) => {
          event.preventDefault()
          if (error) return
          onConfirm(trimmedReason)
          setReason('')
        }}
      >
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-squircle border border-[rgba(226,33,52,0.35)] bg-[rgba(226,33,52,0.08)] text-(--error)">
            <HugeiconsIcon icon={Alert02Icon} size={22} />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-(--text-h)">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-(--text)">{message}</p>
          </div>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-semibold text-(--text-h)">
          {reasonLabel}
          <textarea
            value={reason}
            maxLength={maxLength + 1}
            rows={4}
            placeholder={reasonPlaceholder}
            className="min-h-28 resize-y rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm font-normal text-(--text-h) outline-none transition focus:border-(--accent-border)"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <p className={error ? 'text-(--error)' : 'text-(--text)'}>
            {error || 'Required for account audit history.'}
          </p>
          <p className="text-(--text)">{trimmedReason.length}/{maxLength}</p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h) transition hover:bg-(--surface-2)"
            onClick={() => {
              setReason('')
              onCancel()
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isPending || Boolean(error)}
            className="rounded-squircle border border-[rgba(226,33,52,0.35)] px-4 py-2 text-sm font-semibold text-(--error) transition hover:bg-[rgba(226,33,52,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
