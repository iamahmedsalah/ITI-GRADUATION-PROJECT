import { useEffect, useState } from 'react'

const readStoredExpiry = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return 0
  }

  const value = window.localStorage.getItem(storageKey)
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const formatCountdown = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0')
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

const getRemainingSeconds = (storageKey: string) => {
  const expiresAt = readStoredExpiry(storageKey)

  if (!expiresAt) {
    return 0
  }

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
}

export const useResendCooldown = (storageKey: string, durationSeconds = 60) => {
  const [secondsLeft, setSecondsLeft] = useState(() => getRemainingSeconds(storageKey))

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = getRemainingSeconds(storageKey)

      setSecondsLeft(remaining)

      if (remaining === 0 && typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey)
      }
    }

    updateCountdown()

    if (typeof window === 'undefined') {
      return undefined
    }

    const timerId = window.setInterval(updateCountdown, 1000)

    return () => window.clearInterval(timerId)
  }, [storageKey])

  const startCooldown = () => {
    const nextExpiry = Date.now() + durationSeconds * 1000

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, String(nextExpiry))
    }

    setSecondsLeft(durationSeconds)
  }

  const clearCooldown = () => {
    setSecondsLeft(0)

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }

  return {
    secondsLeft,
    isCoolingDown: secondsLeft > 0,
    cooldownLabel: formatCountdown(secondsLeft),
    startCooldown,
    clearCooldown,
  }
}

export { formatCountdown }