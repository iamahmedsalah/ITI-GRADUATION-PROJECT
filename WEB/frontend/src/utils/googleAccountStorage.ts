import { decryptData, encryptData } from './crypto'

export type SavedGoogleAccount = {
  name: string
  email: string
  avatarUrl: string
}

export const GOOGLE_ACCOUNT_STORAGE_KEY = 'last_google_account'
export const GOOGLE_ACCOUNT_CHANGED_EVENT = 'ilma:last-google-account-changed'

export async function loadSavedGoogleAccount() {
  const cipherText = localStorage.getItem(GOOGLE_ACCOUNT_STORAGE_KEY)

  if (!cipherText) return null

  const plainText = await decryptData(cipherText)
  if (!plainText) return null

  return JSON.parse(plainText) as SavedGoogleAccount
}

export async function saveGoogleAccount(account: SavedGoogleAccount) {
  localStorage.setItem(GOOGLE_ACCOUNT_STORAGE_KEY, await encryptData(JSON.stringify(account)))
  window.dispatchEvent(new CustomEvent(GOOGLE_ACCOUNT_CHANGED_EVENT, { detail: account }))
}

export function clearSavedGoogleAccount() {
  localStorage.removeItem(GOOGLE_ACCOUNT_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(GOOGLE_ACCOUNT_CHANGED_EVENT, { detail: null }))
}
