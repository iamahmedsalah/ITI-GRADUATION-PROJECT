const PASSPHRASE = 'ilma-google-auth-persistent-secret-key-v1'
const SALT = new Uint8Array([73, 108, 109, 97, 83, 101, 99, 117, 114, 101, 71, 111, 111, 103, 108, 101]) // 'IlmaSecureGoogle'

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 10000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptData(text: string): Promise<string> {
  try {
    const key = await getCryptoKey()
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      enc.encode(text)
    )

    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Convert combined binary buffer to a URL-safe Base64 string
    let binary = ''
    const len = combined.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i])
    }
    return btoa(binary)
  } catch (error) {
    console.error('Encryption failed:', error)
    return ''
  }
}

export async function decryptData(base64Str: string): Promise<string> {
  if (!base64Str) return ''
  try {
    const key = await getCryptoKey()
    const binaryStr = atob(base64Str)
    const len = binaryStr.length
    const combined = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      combined[i] = binaryStr.charCodeAt(i)
    }

    if (combined.length <= 12) {
      throw new Error('Encrypted data is too short')
    }

    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    )

    const dec = new TextDecoder()
    return dec.decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    return ''
  }
}
