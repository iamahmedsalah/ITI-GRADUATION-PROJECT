import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router-dom'
import type { LanguagePref } from '../context/LanguageContext'
import { buildApiUrl } from './api'

export type RouteLanguageData = {
  language: LanguagePref
}

export type RoadmapLoaderData = {
  language: LanguagePref
  slug: string
}

export type AuthUser = {
  _id: string
  username: string
  name: string
  email: string
  role: string
  isVerified: boolean
  lastLogin?: string | number | null
}

export type DashboardLoaderData = {
  language: LanguagePref
  user: AuthUser
}

export function normalizeLanguage(language?: string): LanguagePref {
  return language?.startsWith('ar') ? 'ar' : 'en'
}

export function stripLanguagePrefix(pathname: string) {
  const stripped = pathname.replace(/^\/(en|ar)(?=\/|$)/, '')
  return stripped === '' ? '/' : stripped
}

export function getPreferredLanguage(): LanguagePref {
  if (typeof window === 'undefined') {
    return 'en'
  }

  return normalizeLanguage(
    window.localStorage.getItem('i18nextLng') ?? window.document.documentElement.lang ?? window.navigator.language,
  )
}

export async function landingLoader() {
  return redirect(`/${getPreferredLanguage()}`)
}

export function languageLoader({ request, params }: LoaderFunctionArgs): RouteLanguageData | Response {
  const normalized = normalizeLanguage(params.language)

  if (params.language !== normalized) {
    const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

    return redirect(`/${normalized}${currentPath === '/' ? '' : currentPath}`)
  }

  return {
    language: normalized,
  }
}

export async function languageAction({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData()
  const nextLanguage = normalizeLanguage(String(formData.get('language') ?? params.language))
  const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

  return redirect(`/${nextLanguage}${currentPath === '/' ? '' : currentPath}`)
}

export async function roadmapLoader({ params }: { params: { language?: string; slug?: string } }) {
  const language = normalizeLanguage(params.language)
  const slug = params.slug ?? 'roadmap'

  return {
    language,
    slug,
  }
}

export async function roadmapAction() {
  return null
}

export async function dashboardLoader({ request, params }: LoaderFunctionArgs): Promise<DashboardLoaderData | Response> {
  const language = normalizeLanguage(params.language)

  if (params.language !== language) {
    const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

    return redirect(`/${language}${currentPath === '/' ? '' : currentPath}`)
  }

  let response: Response
  try {
    response = await fetch(buildApiUrl('/auth/check-auth'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    return redirect(`/${language}/login`)
  }

  if (!response.ok) {
    return redirect(`/${language}/login`)
  }

  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean
    authenticated?: boolean
    user?: AuthUser
  }

  if (!data.authenticated || !data.user) {
    return redirect(`/${language}/login`)
  }

  if (!data.user.isVerified) {
    const verifyPath = `/${language}/verify-email?email=${encodeURIComponent(data.user.email)}`

    return redirect(verifyPath)
  }

  return {
    language,
    user: data.user,
  }
}
