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
      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-squircle bg-(--google) p-2 pl-3.5 pr-2.5 text-start transition-all hover:bg-[#1557b0] shadow-md hover:shadow-lg"
    >
      {/* Left side: Avatar and text */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar profile picture */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-white/20 flex-shrink-0 flex items-center justify-center">
          {account.avatarUrl ? (
            <img src={account.avatarUrl} alt={account.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] font-bold text-white">{initials}</span>
          )}
        </div>

        {/* Text stack */}
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-semibold text-white leading-tight">
            {t('auth.continueAs', 'Continue as {{name}}', { name: firstName })}
          </span>
          <span className="text-[11px] text-blue-100/90 truncate leading-normal mt-0.5">
            {account.email}
          </span>
        </div>
      </div>

      {/* Right side: White circle with Google icon */}
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <GoogleIcon />
      </div>
    </button>
  )
}
