import type { ButtonHTMLAttributes } from 'react'
import { FilterAddIcon, FilterRemoveIcon, ToggleOffIcon, ToggleOnIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

type BaseButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'>

type AdminFilterToggleButtonProps = BaseButtonProps & {
  open: boolean
  showLabel: string
  hideLabel: string
}

type AdminStatusToggleButtonProps = BaseButtonProps & {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  size?: 'sm' | 'md'
}

export function AdminFilterToggleButton({
  open,
  showLabel,
  hideLabel,
  ...buttonProps
}: AdminFilterToggleButtonProps) {
  return (
    <button type="button" className="admin-filter-toggle rounded-squircle" {...buttonProps}>
      <HugeiconsIcon icon={open ? FilterRemoveIcon : FilterAddIcon} size={16} />
      {open ? hideLabel : showLabel}
    </button>
  )
}

export function AdminStatusToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  size = 'sm',
  ...buttonProps
}: AdminStatusToggleButtonProps) {
  return (
    <button
      type="button"
      className="admin-status-toggle rounded-squircle"
      data-size={size}
      data-tone={active ? 'error' : 'success'}
      {...buttonProps}
    >
      <HugeiconsIcon icon={active ? ToggleOffIcon : ToggleOnIcon} size={size === 'md' ? 16 : 14} />
      {active ? activeLabel : inactiveLabel}
    </button>
  )
}
