import { EyeIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useLanguage } from '../../context/LanguageContext'

type PasswordVisibilityToggleProps = {
  visible: boolean
  onToggle: () => void
  showLabel?: string
  hideLabel?: string
}

export default function PasswordVisibilityToggle({
  visible,
  onToggle,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
}: PasswordVisibilityToggleProps) {
  const { direction } = useLanguage()
  const sideClass = direction === 'rtl' ? 'left-0' : 'right-0'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? hideLabel : showLabel}
      className={`absolute inset-y-0 ${sideClass} cursor-pointer grid place-items-center px-3 text-(--text) transition-colors hover:text-(--text-h)`}
    >
      {visible ? (
        <HugeiconsIcon icon={EyeIcon} size={18} className="size-4.5" />
      ) : (
        <HugeiconsIcon icon={ViewOffSlashIcon} size={18} className="size-4.5" />
      )}
    </button>
  )
}
