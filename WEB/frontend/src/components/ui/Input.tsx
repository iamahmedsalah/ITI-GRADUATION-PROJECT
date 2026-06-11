import type { InputHTMLAttributes, ReactNode } from 'react'

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  success?: boolean
  successMessage?: string
  rightAdornment?: ReactNode
}

export default function FormInput({
  label,
  error,
  success = false,
  successMessage,
  rightAdornment,
  className = '',
  ...props
}: FormInputProps) {
  const stateClass = error
    ? 'border-red-500 focus:border-red-400 focus:ring-red-500/25'
    : success
      ? 'border-green-500/70 focus:border-green-400 focus:ring-green-500/25'
      : 'border-(--border) focus:border-(--gd-primary) focus:ring-[rgba(29,185,84,0.25)]'

  return (
    <label className="grid gap-2 text-start text-sm font-medium text-(--text-h)">
      {label}
      <div className="relative">
        <input
          {...props}
          className={`w-full rounded-squircle border bg-transparent px-4 py-3 text-start text-(--text-h) outline-none transition-colors focus:ring-2 placeholder:text-(--text) ${stateClass} ${className}`}
        />
        {rightAdornment}
      </div>
      {error ? <span className="text-start text-xs text-(--error)">{error}</span> : null}
      {!error && success && successMessage ? <span className="text-start text-xs text-(--success)">{successMessage}</span> : null}
    </label>
  )
}
