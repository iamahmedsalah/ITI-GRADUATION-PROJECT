import { useTranslation } from 'react-i18next'

export default function Fallback() {
  const { t } = useTranslation()

  return (
    <div
      className="grid min-h-screen place-items-center px-6"
      style={{ background: 'var(--bg)', color: 'var(--text-h)' }}
    >
      <div
        className="relative overflow-hidden rounded-squircle border px-5 py-4 shadow-(--shadow)"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at top left, var(--accent-bg), transparent 45%)',
          }}
        />

        <div className="relative flex items-center gap-3 text-sm" style={{ color: 'var(--text)' }}>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2"
            style={{
              borderColor: 'var(--accent-border)',
              borderTopColor: 'var(--gd-primary)',
            }}
          />
          <span>{t('fallback.loading')}</span>
        </div>
      </div>
    </div>
  )
}
