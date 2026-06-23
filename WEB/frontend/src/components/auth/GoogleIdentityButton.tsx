import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLanguage } from '../../context/LanguageContext'
import { authQueryKey, fetchCurrentUser, logoutCurrentUser, queryClient } from '../../libs/react-query'
import { apiPost, clearAccessToken } from '../../utils/api'
import { getBackendResponseMessage, type BackendResponseError } from '../../utils/backendResponseMessage'
import { saveGoogleAccount } from '../../utils/googleAccountStorage'
import SocialAuthButton from './SocialAuthButton'
import { isChromeBrowser } from '../../utils/browserCheck'

type GoogleAuthMode = 'login' | 'signup'

type GoogleCredentialResponse = {
  credential?: string
  select_by?: string
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    context?: 'signin' | 'signup' | 'use'
    auto_select?: boolean
    login_hint?: string
    cancel_on_tap_outside?: boolean
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
    use_fedcm_for_button?: boolean
    button_auto_select?: boolean
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      logo_alignment?: 'left' | 'center'
      width?: number
    },
  ) => void
  prompt: () => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId
      }
    }
  }
}

type GoogleIdentityButtonProps = {
  mode: GoogleAuthMode
  dividerLabel: string
  fallbackLabel: string
  loginHint?: string
  onFallback: (email?: string) => void | Promise<void>
}

type GoogleCredentialAuthResponse = BackendResponseError & {
  success?: boolean
  accessToken?: string
  requiresVerification?: boolean
  email?: string
  provider?: string
  user?: unknown
  googleUser?: {
    name: string
    email: string
    avatarUrl: string
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services'
let googleScriptPromise: Promise<void> | null = null

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve()

  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Identity script failed to load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Identity script failed to load.'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

export default function GoogleIdentityButton({
  mode,
  dividerLabel,
  fallbackLabel,
  loginHint,
  onFallback,
}: GoogleIdentityButtonProps) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasGoogleError, setHasGoogleError] = useState(false)
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim()

  const submitCredential = useCallback(async (credential?: string) => {
    if (!credential) {
      toast.error(t('auth.loginFailed'))
      return
    }

    try {
      try {
        await logoutCurrentUser()
      } catch {
        // Ignore logout failures; the credential exchange will establish the next session.
      }

      clearAccessToken()
      queryClient.setQueryData(authQueryKey, null)

      const { response, data } = await apiPost<GoogleCredentialAuthResponse>(
        '/auth/google/credential',
        {},
        {
          authRetry: false,
          json: {
            credential,
            mode,
          },
        },
      )

      if (response.status === 202 && data.requiresVerification && data.email) {
        navigate(
          `/${language}/verify-email?email=${encodeURIComponent(data.email)}&provider=${encodeURIComponent(data.provider ?? 'google')}`,
          { replace: true, state: { email: data.email } },
        )
        return
      }

      if (!response.ok) {
        toast.error(
          getBackendResponseMessage(response, data, {
            fallbackKey: mode === 'signup' ? 'auth.signupFailed' : 'auth.loginFailed',
            translate: t,
            locale: language === 'ar' ? 'ar-EG' : 'en-US',
          }),
        )
        return
      }

      if (data.user) {
        queryClient.setQueryData(authQueryKey, data.user)
      }

      if (data.googleUser) {
        try {
          await saveGoogleAccount(data.googleUser)
        } catch {
          // Saved account is only a convenience hint; auth succeeded without it.
        }
      }

      try {
        await queryClient.fetchQuery({ queryKey: authQueryKey, queryFn: fetchCurrentUser })
      } catch {
        // ignore
      }

      toast.info(t('auth.loginSuccess'))
      navigate(`/${language}/dashboard`, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(mode === 'signup' ? 'auth.signupFailed' : 'auth.loginFailed'))
    }
  }, [language, mode, navigate, t])

  const [isChrome] = useState<boolean | null>(() => isChromeBrowser())

  useEffect(() => {
    if (isChrome !== true) return
    if (!clientId || !buttonRef.current) {
      setHasGoogleError(true)
      return
    }

    let isMounted = true

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !buttonRef.current || !window.google?.accounts?.id) return

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void submitCredential(response.credential)
          },
          ux_mode: 'popup',
          context: mode === 'signup' ? 'signup' : 'signin',
          auto_select: false,
          login_hint: loginHint,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
          button_auto_select: false,
        })

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'left',
          width: Math.min(buttonRef.current.clientWidth || 360, 400),
        })

        window.google.accounts.id.prompt()
        setIsReady(true)
      })
      .catch(() => {
        if (isMounted) setHasGoogleError(true)
      })

    return () => {
      isMounted = false
      window.google?.accounts?.id?.cancel()
    }
  }, [clientId, loginHint, mode, submitCredential, isChrome])

  if (isChrome === null) {
    return null
  }

  if (isChrome === false || !clientId || hasGoogleError) {
    if (loginHint) {
      return (
        <button
          type="button"
          className="text-sm font-semibold text-(--gd-primary) transition hover:underline mt-2 w-full text-center cursor-pointer"
          onClick={() => void onFallback(loginHint)}
        >
          {t('auth.googleConfirmUseDifferent', 'Use a different account')}
        </button>
      )
    }

    return (
      <SocialAuthButton
        dividerLabel={dividerLabel}
        buttonLabel={fallbackLabel}
        onClick={() => void onFallback(loginHint)}
      />
    )
  }

  return (
    <div className="grid justify-center gap-3 pt-2">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-(--text)">
        <span className="h-px flex-1" />
        <span>{dividerLabel}</span>
        <span className="h-px flex-1" />
      </div>
      <div className="min-h-10 w-fit overflow-hidden rounded-full">
        <div ref={buttonRef} className={isReady ? 'w-fit' : 'min-h-10 rounded-full border border-(--border)'} />
      </div>
      <button
        type="button"
        className="text-sm font-semibold text-(--gd-primary) transition hover:underline"
        onClick={() => void onFallback(loginHint)}
      >
        {t('auth.googleConfirmUseDifferent', 'Use a different account')}
      </button>
    </div>
  )
}