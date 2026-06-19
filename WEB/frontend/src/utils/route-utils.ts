import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router-dom'
import type { LanguagePref } from '../context/LanguageContext'
import { adminAuthQueryKey, authQueryKey, fetchAdminCurrentUser, fetchCurrentUser, queryClient } from '../libs/react-query'
import { consumeLastAuthFailureCode } from './api'

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
  Fname?: string
  Lname?: string
  name: string
  email: string
  avatarUrl?: string | null
  role: string
  isVerified: boolean
  lastLogin?: string | number | null
  loginStreak?: {
    current: number
    longest: number
    lastLoginDate?: string | number | null
  }
  subscription?: {
    plan: 'free' | 'pro'
    status: 'inactive' | 'active' | 'trialing' | 'pastDue' | 'canceled'
    currentPeriodEnd?: string | number | null
  }
  accountDeletion?: {
    status: 'none' | 'pendingConfirmation' | 'scheduled'
    requestedAt?: string | number | null
    scheduledFor?: string | number | null
  }
  hasPreferences?: boolean
}

export type DashboardLoaderData = {
  language: LanguagePref
  user: AuthUser
}

export type ProfileLoaderData = DashboardLoaderData
export type PreferencesLoaderData = DashboardLoaderData

function redirectToLogin(language: LanguagePref, reason?: string | null) {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
  return redirect(`/${language}/login${query}`)
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

function redirectIfLanguageMismatch(request: Request, params: LoaderFunctionArgs['params'], language: LanguagePref) {
  if (params.language !== language) {
    const currentPath = stripLanguagePrefix(new URL(request.url).pathname)

    return redirect(`/${language}${currentPath === '/' ? '' : currentPath}`)
  }

  return null
}

async function fetchLoaderUser() {
  return queryClient.fetchQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 0,
  })
}

async function requireUserLoader(
  { request, params }: LoaderFunctionArgs,
  options: { requirePreferences?: boolean } = {},
): Promise<DashboardLoaderData | Response> {
  const language = normalizeLanguage(params.language)
  const languageRedirect = redirectIfLanguageMismatch(request, params, language)

  if (languageRedirect) {
    return languageRedirect
  }

  try {
    const user = await fetchLoaderUser()

    if (!user) {
      return redirectToLogin(language, consumeLastAuthFailureCode())
    }

    if (!user.isVerified) {
      const verifyPath = `/${language}/verify-email?email=${encodeURIComponent(user.email)}`

      return redirect(verifyPath)
    }

    if (options.requirePreferences && !user.hasPreferences) {
      return redirect(`/${language}/preferences`)
    }

    return {
      language,
      user,
    }
  } catch {
    return redirectToLogin(language, consumeLastAuthFailureCode())
  }
}

export async function dashboardLoader(args: LoaderFunctionArgs): Promise<DashboardLoaderData | Response> {
  return requireUserLoader(args, { requirePreferences: true })
}

export async function preferencesLoader({ request, params }: LoaderFunctionArgs): Promise<PreferencesLoaderData | Response> {
  const language = normalizeLanguage(params.language)
  const languageRedirect = redirectIfLanguageMismatch(request, params, language)

  if (languageRedirect) {
    return languageRedirect
  }

  try {
    const user = await fetchLoaderUser()

    if (!user) {
      return redirectToLogin(language, consumeLastAuthFailureCode())
    }

    if (!user.isVerified) {
      return redirect(`/${language}/verify-email?email=${encodeURIComponent(user.email)}`)
    }

    return {
      language,
      user,
    }
  } catch {
    return redirectToLogin(language, consumeLastAuthFailureCode())
  }
}

export async function profileLoader(args: LoaderFunctionArgs): Promise<ProfileLoaderData | Response> {
  return requireUserLoader(args)
}

export async function authPageLoader({ request, params }: LoaderFunctionArgs): Promise<Response | null> {
  const language = normalizeLanguage(params.language)
  const languageRedirect = redirectIfLanguageMismatch(request, params, language)

  if (languageRedirect) {
    return languageRedirect
  }

  try {
    const user = await fetchLoaderUser()

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
  const languageRedirect = redirectIfLanguageMismatch(request, params, language)

  if (languageRedirect) {
    return languageRedirect
  }

  try {
    const isAdminAuthenticated = await queryClient.fetchQuery({
      queryKey: adminAuthQueryKey,
      queryFn: fetchAdminCurrentUser,
      staleTime: 0,
    })

    if (isAdminAuthenticated) {
      return redirect(`/${language}/admin`)
    }
  } catch {
    return null
  }

  return null
}

export async function adminProtectedLoader({ request, params }: LoaderFunctionArgs): Promise<Response | null> {
  const language = normalizeLanguage(params.language)
  const languageRedirect = redirectIfLanguageMismatch(request, params, language)

  if (languageRedirect) {
    return languageRedirect
  }

  try {
    const user = await queryClient.fetchQuery({
      queryKey: adminAuthQueryKey,
      queryFn: fetchAdminCurrentUser,
      staleTime: 0,
    })

    if (!user) {
      return redirect(`/${language}/admin/login`)
    }

    return null
  } catch {
    return redirect(`/${language}/admin/login`)
  }
}
