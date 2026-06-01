import { CheckmarkCircle01Icon, Copy01Icon, MagicWand03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useLanguage } from '../../context/LanguageContext'

type PasswordActionsProps = {
  onGenerate: () => void
  onCopy: () => void
  generateLabel: string
  copyLabel: string
  copiedLabel: string
  copied?: boolean
  generateAriaLabel?: string
  copyAriaLabel?: string
  copyDisabled?: boolean
}

export default function PasswordActions({
  onGenerate,
  onCopy,
  generateLabel,
  copyLabel,
  copiedLabel,
  copied = false,
  generateAriaLabel,
  copyAriaLabel,
  copyDisabled = false,
}: PasswordActionsProps) {
  const { direction } = useLanguage()
  const orderClass = direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'

  return (
    <div className={`flex items-center gap-2 ${orderClass}`}>
      <button
        type="button"
        onClick={onGenerate}
        aria-label={generateAriaLabel ?? generateLabel}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-squircle border border-(--border) px-3 py-1.5 text-xs font-medium text-(--text-h) transition-colors hover:bg-(--surface-soft-hover)"
      >
        <HugeiconsIcon icon={MagicWand03Icon} size={16} />
        <span>{generateLabel}</span>
      </button>

      <button
        type="button"
        onClick={onCopy}
        aria-label={copyAriaLabel ?? (copied ? copiedLabel : copyLabel)}
        disabled={copyDisabled}
        className={`inline-flex  cursor-pointer items-center gap-1.5 rounded-squircle border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          copied
            ? 'border-green-500/70 bg-green-500/10 text-green-300'
            : 'border-(--border) text-(--text-h) hover:bg-(--surface-soft-hover)'
        }`}
      >
        <HugeiconsIcon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} size={16} />
        <span>{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  )
}
