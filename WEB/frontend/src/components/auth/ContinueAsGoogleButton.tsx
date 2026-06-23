import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import GoogleIcon from '../../routes/common/GoogleIcon'
type ContinueAsGoogleButtonProps = {
  account: {
    name: string
    email: string
    avatarUrl?: string
  }
  onClick: () => void
}

export default function ContinueAsGoogleButton({
  account,
  onClick,
}: ContinueAsGoogleButtonProps) {
  const { t } = useTranslation()
  const { direction } = useLanguage()

  const firstName = account.name.split(' ')[0]
  const initials = account.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'G'

  return (
    <button
      type="button"
      onClick={onClick}
      dir={direction}
      className="flex min-h-13 w-full cursor-pointer items-center justify-between gap-3 rounded-squircle border border-[#2b4f7f] bg-[#14345f] px-3 py-2 text-start shadow-[0_12px_30px_rgba(10,32,64,0.24)] transition hover:border-[#4f7fbd] hover:bg-[#174070] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6ea8ff]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/15">
          {account.avatarUrl ? (
            <img src={account.avatarUrl} alt={account.name} className="size-full object-cover" />
          ) : (
            <span className="text-[11px] font-bold text-white">{initials}</span>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-tight text-white">
            {t('auth.continueAs', 'Continue as {{name}}', { name: firstName })}
          </span>
          <span className="mt-0.5 truncate text-xs leading-normal text-blue-100/90">
            {account.email}
          </span>
        </div>
      </div>

      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        <GoogleIcon />
      </div>
    </button>
  )
}
