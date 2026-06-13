import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUp01Icon,
} from '@hugeicons/core-free-icons';

export type DropdownOption<TValue extends string = string> = {
  value: TValue
  label: string
  icon?: typeof ArrowUp01Icon
  disabled?: boolean
}

type CustomDropdownProps<TValue extends string = string> = {
  label?: string
  value: TValue
  options: DropdownOption<TValue>[]
  onChange: (value: TValue) => void
  id?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  buttonClassName?: string
}

export default function CustomDropdown<TValue extends string = string>({
  label,
  value,
  options,
  onChange,
  id,
  disabled = false,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
}: CustomDropdownProps<TValue>) {
  const generatedId = useId()
  const dropdownId = id ?? generatedId
  const listboxId = `${dropdownId}-listbox`
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  )
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const selectedOption = options.find((option) => option.value === value)

  const updateMenuPosition = () => {
    const wrapper = wrapperRef.current

    if (!wrapper) {
      return
    }

    const rect = wrapper.getBoundingClientRect()
    const horizontalPadding = 12
    const width = rect.width
    const left = Math.min(
      Math.max(rect.left, horizontalPadding),
      Math.max(horizontalPadding, window.innerWidth - width - horizontalPadding),
    )

    setMenuStyle({
      left,
      top: rect.bottom + 8,
      width,
    })
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node

      if (!wrapperRef.current?.contains(target) && !listRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    const syncPosition = () => updateMenuPosition()

    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('resize', syncPosition)
    window.addEventListener('scroll', syncPosition, true)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('resize', syncPosition)
      window.removeEventListener('scroll', syncPosition, true)
    }
  }, [isOpen])

  const enabledOptions = options.filter((option) => !option.disabled)

  const selectOption = (option: DropdownOption<TValue>) => {
    if (option.disabled) {
      return
    }

    onChange(option.value)
    setIsOpen(false)
  }

  const moveActiveOption = (direction: 1 | -1) => {
    if (!enabledOptions.length) {
      return
    }

    const currentOption = options[activeIndex]
    const currentEnabledIndex = Math.max(
      enabledOptions.findIndex((option) => option.value === currentOption?.value),
      0,
    )
    const nextEnabledIndex = (currentEnabledIndex + direction + enabledOptions.length) % enabledOptions.length
    const nextOption = enabledOptions[nextEnabledIndex]
    const nextIndex = options.findIndex((option) => option.value === nextOption.value)
    setActiveIndex(nextIndex)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        setActiveIndex(selectedIndex)
        updateMenuPosition()
        setIsOpen(true)
        return
      }

      setIsOpen(true)
      moveActiveOption(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setActiveIndex(selectedIndex)
        updateMenuPosition()
        setIsOpen(true)
        return
      }

      setIsOpen(true)
      moveActiveOption(-1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) {
        const activeOption = options[activeIndex]
        if (activeOption) {
          selectOption(activeOption)
        }
        return
      }

      updateMenuPosition()
      setIsOpen(true)
      setActiveIndex(selectedIndex)
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative grid gap-2 text-start ${className}`}>
      {label ? (
        <label id={`${dropdownId}-label`} className="text-sm font-semibold text-(--text-h)">
          {label}
        </label>
      ) : null}

      <button
        id={dropdownId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${dropdownId}-label ${dropdownId}` : undefined}
        aria-controls={listboxId}
        onClick={() => {
          setActiveIndex(selectedIndex)
          updateMenuPosition()
          setIsOpen((previous) => !previous)
        }}
        onKeyDown={handleKeyDown}
        className={[
          'flex w-full items-center justify-between cursor-pointer gap-3 rounded-squircle border border-(--border)',
          'bg-(--surface) px-3 py-2.5 text-sm text-(--text-h)',
          'outline-none transition',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'focus:border-(--accent-border) focus:ring-1 focus:ring-(--accent-border)',
          buttonClassName,
        ].join(' ')}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon ? <HugeiconsIcon icon={selectedOption.icon} size={16} className="shrink-0 text-(--accent)" /> : null}
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        </span>
        <HugeiconsIcon
          icon={ArrowUp01Icon}
          size={18}
          className={`shrink-0 text-(--text) transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen ? createPortal(
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? `${dropdownId}-label` : undefined}
          style={menuStyle}
          className={[
            'fixed z-[100] max-h-60 overflow-auto rounded-xl',
            'border border-(--border) bg-(--surface) p-1 shadow-(--shadow)',
          ].join(' ')}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === activeIndex

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
                className={[
                  'cursor-pointer mt-2 rounded-squircle px-3 py-2.5 text-sm transition',
                  option.disabled ? 'cursor-not-allowed opacity-50' : '',
                  isSelected ? 'bg-(--gd-primary) text-white' : 'text-(--text-h)',
                  !isSelected && isActive ? 'bg-(--surface-soft-hover)' : '',
                  !isSelected && !isActive ? 'hover:bg-(--surface-soft)' : '',
                ].join(' ')}
              >
                <span className="flex items-center gap-2">
                  {option.icon ? <HugeiconsIcon icon={option.icon} size={16} className="shrink-0" /> : null}
                  <span className="truncate">{option.label}</span>
                </span>
              </li>
            )
          })}
        </ul>,
        document.body,
      ) : null}
    </div>
  )
}
