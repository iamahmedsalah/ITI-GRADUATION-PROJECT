import GoogleIcon from '../../routes/common/GoogleIcon'

type SocialAuthButtonProps = {
  dividerLabel: string
  buttonLabel: string
  onClick: () => void
}

export default function SocialAuthButton({
  dividerLabel,
  buttonLabel,
  onClick,
}: SocialAuthButtonProps) {
  return (
    <div className="grid gap-3 pt-2">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
        <span className="h-px flex-1 bg-(--border)" />
        <span>{dividerLabel}</span>
        <span className="h-px flex-1 bg-(--border)" />
      </div>

      <button
        type="button"
        onClick={onClick}
        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3 text-sm font-medium text-(--text-h) transition-colors hover:bg-(--surface-soft-hover)"
      >
        <GoogleIcon />
        <span>{buttonLabel}</span>
      </button>
    </div>
  )
}
