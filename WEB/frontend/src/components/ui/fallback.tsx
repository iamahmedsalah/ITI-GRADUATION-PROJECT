import { useTranslation } from 'react-i18next'

export default function Fallback() {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-screen place-items-center bg-(--bg) text-(--text-h)">
      <div className="flex items-center gap-3 rounded-full border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text)">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--gd-primary)/30 border-t-(--gd-primary)" />
        {t('fallback.loading')}
      </div>
    </div>
  )
}
