import { useCallback } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { authQueryKey, logoutCurrentUser, queryClient } from '../libs/react-query'
import { buildApiUrl, clearAccessToken } from '../utils/api'

type GoogleAuthMode = 'login' | 'signup'

export function useGoogleAuthRedirect(mode: GoogleAuthMode) {
  const { language } = useLanguage()

  return useCallback(async () => {
    try {
      await logoutCurrentUser()
    } catch {
      // Ignore logout failures; continue clearing local auth state.
    }

    clearAccessToken()
    queryClient.setQueryData(authQueryKey, null)
    window.location.assign(buildApiUrl(`/auth/oauth/${mode}/google?language=${language}`))
  }, [language, mode])
}
