import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'

type PasswordStrengthProps = {
  password: string
  isSubmitting?: boolean
  submitLabel: string
  minLength?: number
  showSubmitButton?: boolean
}

function getStrength(password: string, minLength: number) {
  let score = 0
  if (password.length >= minLength) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

function strengthBarClass(score: number) {
  switch (score) {
    case 0:
      return 'bg-red-500/80'
    case 1:
      return 'bg-orange-500/80'
    case 2:
      return 'bg-yellow-500/80'
    case 3:
      return 'bg-lime-500/80'
    default:
      return 'bg-green-500/80'
  }
}

export default function PasswordStrength({
  password,
  isSubmitting = false,
  submitLabel,
  minLength = 8,
  showSubmitButton = true,
}: PasswordStrengthProps) {
  const { t } = useTranslation()
  const { direction } = useLanguage()
  const strength = getStrength(password, minLength)

  // const criteria = [
  //   { label: t('passwordStrength.criteria.min', { min: minLength }), met: password.length >= minLength },
  //   { label: t('passwordStrength.criteria.upper'), met: /[A-Z]/.test(password) },
  //   { label: t('passwordStrength.criteria.lower'), met: /[a-z]/.test(password) },
  //   { label: t('passwordStrength.criteria.number'), met: /[0-9]/.test(password) },
  //   { label: t('passwordStrength.criteria.special'), met: /[^A-Za-z0-9]/.test(password) },
  // ]

  const levelKey =
    strength === 0
      ? 'veryWeak'
      : strength === 1
        ? 'weak'
        : strength === 2
          ? 'fair'
          : strength === 3
            ? 'strong'
            : 'veryStrong'

  return (
    <div className={`grid gap-3 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
      <div className="flex items-center justify-between gap-3 text-sm text-(--text-h)">
        <span className="font-medium">{t('passwordStrength.title')}</span>
        <span className="text-xs uppercase tracking-[0.12em] text-(--text)">{t(`passwordStrength.levels.${levelKey}`)}</span>
      </div>

      <div className="flex gap-2">
        {[...Array(4)].map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              index < strength ? strengthBarClass(strength) : 'bg-(--surface-3)'
            }`}
          />
        ))}
      </div>

      {showSubmitButton ? (
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full cursor-pointer rounded-2xl bg-(--gd-primary) px-5 py-3 text-xl font-semibold text-white shadow-lg shadow-[rgba(29,185,84,0.2)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : submitLabel}
        </button>
      ) : null}
    </div>
  )
}
