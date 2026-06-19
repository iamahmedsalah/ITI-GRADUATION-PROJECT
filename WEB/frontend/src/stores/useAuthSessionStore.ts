import { create } from 'zustand'

interface AuthSessionStore {
  accessToken: string | null
  lastAuthFailureCode: string | null
  setAccessToken: (token: string | null) => void
  clearAccessToken: () => void
  getAccessToken: () => string | null
  setLastAuthFailureCode: (code: string | null) => void
  consumeLastAuthFailureCode: () => string | null
}

export const useAuthSessionStore = create<AuthSessionStore>((set, get) => ({
  accessToken: null,
  lastAuthFailureCode: null,
  setAccessToken: (token) =>
    set({
      accessToken: token && token.trim() ? token : null,
    }),
  clearAccessToken: () => set({ accessToken: null }),
  getAccessToken: () => get().accessToken,
  setLastAuthFailureCode: (code) =>
    set({
      lastAuthFailureCode: code && code.trim() ? code : null,
    }),
  consumeLastAuthFailureCode: () => {
    const code = get().lastAuthFailureCode
    set({ lastAuthFailureCode: null })
    return code
  },
}))
