import { useTranslation } from 'react-i18next'
import ThreeSceneLoader from './ThreeSceneLoader'

export default function LanguageSwitchOverlay() {
  const { t } = useTranslation()

  return (
    <div
      className="fixed inset-0 z-9999 grid place-items-center overflow-hidden px-6"
      style={{ background: 'var(--bg)', color: 'var(--text-h)' }}
      role="status"
      aria-live="polite"
    >
      <ThreeSceneLoader className="opacity-90" cycleDurationMs={2000} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, transparent 34%, var(--bg) 82%)',
        }}
      />
      <div
        className="relative overflow-hidden rounded-squircle border px-6 py-5 shadow-(--shadow) backdrop-blur-xl"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface) 86%, transparent)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: 'radial-gradient(circle at top left, var(--accent-bg), transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-3 text-sm font-semibold text-(--text-h)">
          <span className="relative grid size-5 place-items-center rounded-full border border-(--accent-border)">
            <span className="size-2 animate-pulse rounded-full bg-(--gd-primary)" />
          </span>
          <span>{t('fallback.switchingLanguage')}</span>
        </div>
      </div>
    </div>
  )
}
