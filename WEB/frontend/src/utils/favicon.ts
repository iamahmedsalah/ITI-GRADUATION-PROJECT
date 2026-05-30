const LIGHT_FAVICON = '/favicon/favicon-light.ico'
const DARK_FAVICON = '/favicon/favicon-dark.ico'

export function applyThemeFavicon(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return

  const iconPath = theme === 'dark' ? DARK_FAVICON : LIGHT_FAVICON
  const existing = document.getElementById('theme-favicon') as HTMLLinkElement | null

  if (existing) {
    existing.href = iconPath
    return
  }

  const link = document.createElement('link')
  link.id = 'theme-favicon'
  link.rel = 'icon'
  link.type = 'image/x-icon'
  link.href = iconPath
  document.head.appendChild(link)
}
