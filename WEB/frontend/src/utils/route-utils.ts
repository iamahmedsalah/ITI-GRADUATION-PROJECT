import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router-dom'
import type { LanguagePref } from '../context/LanguageContext'
import { adminAuthQueryKey, authQueryKey, fetchAdminCurrentUser, fetchCurrentUser, queryClient } from '../libs/react-query'

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

export type ProfileLoaderData = DashboardLoaderData

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

  try {
    const user = await queryClient.fetchQuery({
      queryKey: authQueryKey,
      queryFn: fetchCurrentUser,
    })

    if (!user) {
      return redirect(`/${language}/login`)
    }

    if (!user.isVerified) {
      const verifyPath = `/${language}/verify-email?email=${encodeURIComponent(user.email)}`

      return redirect(verifyPath)
    }

    return {
      language,
      user,
    }
  } catch {
    return redirect(`/${language}/login`)
  }
}

export async function profileLoader({ request, params }: LoaderFunctionArgs): Promise<ProfileLoaderData | Response> {
  const language = normalizeLanguage(params.language)

  if (params.language !== language) {
    const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

    return redirect(`/${language}${currentPath === '/' ? '' : currentPath}`)
  }

  try {
    const user = await queryClient.fetchQuery({
      queryKey: authQueryKey,
      queryFn: fetchCurrentUser,
    })

    if (!user) {
      return redirect(`/${language}/login`)
    }

    if (!user.isVerified) {
      const verifyPath = `/${language}/verify-email?email=${encodeURIComponent(user.email)}`

      return redirect(verifyPath)
    }

    return {
      language,
      user,
    }
  } catch {
    return redirect(`/${language}/login`)
  }
}

export async function authPageLoader({ request, params }: LoaderFunctionArgs): Promise<Response | null> {
  const language = normalizeLanguage(params.language)

  if (params.language !== language) {
    const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

    return redirect(`/${language}${currentPath === '/' ? '' : currentPath}`)
  }

  try {
    const user = await queryClient.fetchQuery({
      queryKey: authQueryKey,
      queryFn: fetchCurrentUser,
    })

    if (user) {
      if (!user.isVerified) {
        return redirect(`/${language}/verify-email?email=${encodeURIComponent(user.email)}`)
      }

      return redirect(`/${language}/dashboard`)
    }
  } catch {
    return null
  }

  return null
}

export async function adminAuthPageLoader({ request, params }: LoaderFunctionArgs): Promise<Response | null> {
  const language = normalizeLanguage(params.language)

  if (params.language !== language) {
    const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

    return redirect(`/${language}${currentPath === '/' ? '' : currentPath}`)
  }

  try {
    const isAdminAuthenticated = await queryClient.fetchQuery({
      queryKey: adminAuthQueryKey,
      queryFn: fetchAdminCurrentUser,
    })

    if (isAdminAuthenticated) {
      return redirect(`/${language}/admin`)
    }
  } catch {
    return null
  }

  return null
}
