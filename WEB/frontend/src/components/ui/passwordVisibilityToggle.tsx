import { createElement } from 'react'
import { EyeIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'

type PasswordVisibilityToggleProps = {
  visible: boolean
  onToggle: () => void
  showLabel?: string
  hideLabel?: string
}

type HugeIconData = typeof EyeIcon

function RenderHugeIcon({ icon, size = 18, className }: { icon: HugeIconData; size?: number; className?: string }) {
  const children = icon.map(([tag, attrs], index) =>
    createElement(tag, {
      ...attrs,
      key: attrs.key ?? index,
    }),
  )

  return createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
      role: 'img',
      'aria-hidden': 'true',
      className,
    },
    children,
  )
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
        <RenderHugeIcon icon={EyeIcon} className="size-4.5" />
      ) : (
        <RenderHugeIcon icon={ViewOffSlashIcon} className="size-4.5" />
      )}
    </button>
  )
}
