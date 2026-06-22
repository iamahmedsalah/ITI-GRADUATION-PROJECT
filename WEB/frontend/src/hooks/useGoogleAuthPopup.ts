import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../context/LanguageContext'
import { authQueryKey, fetchCurrentUser, logoutCurrentUser, queryClient } from '../libs/react-query'
import { buildApiUrl, clearAccessToken, getApiBaseUrl } from '../utils/api'
import { encryptData } from '../utils/crypto'

type GoogleAuthMode = 'login' | 'signup'

type OAuthSuccessMessage = {
  type: 'OAUTH_SUCCESS'
  language: string
  user?: {
    name: string
    email: string
    avatarUrl: string
  }
}

type OAuthErrorMessage = {
  type: 'OAUTH_ERROR'
  error: string
}

type OAuthVerifyMessage = {
  type: 'OAUTH_VERIFY'
  email: string
  provider: string
  language: string
}

type OAuthMessage = OAuthSuccessMessage | OAuthErrorMessage | OAuthVerifyMessage

function isOAuthMessage(data: unknown): data is OAuthMessage {
  if (!data || typeof data !== 'object') return false
  const msg = data as Record<string, unknown>
  return msg.type === 'OAUTH_SUCCESS' || msg.type === 'OAUTH_ERROR' || msg.type === 'OAUTH_VERIFY'
}

function getBackendOrigin(): string {
  const apiBase = getApiBaseUrl()

  try {
    const url = new URL(apiBase)
    return url.origin
  } catch {
    return apiBase
  }
}

const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600

function openCenteredPopup(url: string, name: string): Window | null {
  const left = Math.round(window.screenX + (window.outerWidth - POPUP_WIDTH) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2)
  const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`

  return window.open(url, name, features)
}

export function useGoogleAuthPopup(mode: GoogleAuthMode) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const popupRef = useRef<Window | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  return useCallback(async (loginHint?: string) => {
    // Clean up any previous popup session
    cleanupRef.current?.()

    // Clear existing auth state before starting OAuth
    try {
      await logoutCurrentUser()
    } catch {
      // Ignore logout failures; continue clearing local auth state.
    }

    clearAccessToken()
    queryClient.setQueryData(authQueryKey, null)

    // Build the OAuth URL with popup=true param and optional login_hint
    let oauthUrl = buildApiUrl(`/auth/oauth/${mode}/google?language=${language}&popup=true`)
    if (loginHint) {
      oauthUrl += `&login_hint=${encodeURIComponent(loginHint)}`
    }

    // Open popup
    const popup = openCenteredPopup(oauthUrl, 'google-oauth-popup')

    if (!popup || popup.closed) {
      toast.error(t('auth.oauthPopupBlocked'))
      return
    }

    popupRef.current = popup

    const backendOrigin = getBackendOrigin()

    const handleMessage = async (event: MessageEvent) => {
      // Validate the origin — must come from our backend
      if (event.origin !== backendOrigin) return

      const data = event.data as unknown

      if (!isOAuthMessage(data)) return

      // Clean up listener
      window.removeEventListener('message', handleMessage)
      cleanupRef.current = null

      // Close the popup if still open
      try {
        popupRef.current?.close()
      } catch {
        // ignore
      }

      popupRef.current = null

      switch (data.type) {
        case 'OAUTH_SUCCESS': {
          toast.info(t('auth.loginSuccess'))

          // Securely save the user profile details in localStorage for "Continue as" feature
          if (data.user) {
            try {
              const encryptedUser = await encryptData(JSON.stringify(data.user))
              localStorage.setItem('last_google_account', encryptedUser)
            } catch (cryptoErr) {
              console.error('Failed to secure Google user data:', cryptoErr)
            }
          }

          try {
            await queryClient.fetchQuery({
              queryKey: authQueryKey,
              queryFn: fetchCurrentUser,
            })
          } catch {
            // ignore — fetchCurrentUser will return null if not authenticated yet
          }

          navigate(`/${language}/dashboard`, { replace: true })
          break
        }

        case 'OAUTH_ERROR': {
          toast.error(data.error || t('auth.loginFailed'))
          break
        }

        case 'OAUTH_VERIFY': {
          const verifyLang = data.language || language

          navigate(
            `/${verifyLang}/verify-email?email=${encodeURIComponent(data.email)}&provider=${encodeURIComponent(data.provider)}`,
            { replace: true, state: { email: data.email } },
          )
          break
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Also poll for popup closure (user might close the popup manually)
    const pollTimer = window.setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        window.clearInterval(pollTimer)
        window.removeEventListener('message', handleMessage)
        popupRef.current = null
        cleanupRef.current = null
      }
    }, 500)

    cleanupRef.current = () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(pollTimer)

      try {
        popupRef.current?.close()
      } catch {
        // ignore
      }

      popupRef.current = null
    }
  }, [language, mode, navigate, t])
}
