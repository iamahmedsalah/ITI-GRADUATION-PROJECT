import { lazy, type LazyExoticComponent } from 'react'

type LazyLoadFunction = Parameters<typeof lazy>[0]
type AnyLazyComponent = Awaited<ReturnType<LazyLoadFunction>>['default']

type LazyModule<TComponent extends AnyLazyComponent> = {
  default: TComponent
}

const DEFAULT_RETRY_KEY = 'ilma-lazy-import-retry'

function isDynamicImportError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return /dynamically imported module|importing a module script failed|failed to fetch|loading chunk|chunk load/i.test(message)
}

export function lazyWithRetry<TComponent extends AnyLazyComponent>(
  factory: () => Promise<LazyModule<TComponent>>,
  retryKey = DEFAULT_RETRY_KEY,
): LazyExoticComponent<TComponent> {
  return lazy(async () => {
    try {
      const module = await factory()

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(`${retryKey}:${window.location.pathname}`)
      }

      return module
    } catch (error) {
      if (typeof window !== 'undefined' && isDynamicImportError(error)) {
        const scopedRetryKey = `${retryKey}:${window.location.pathname}`

        if (!window.sessionStorage.getItem(scopedRetryKey)) {
          window.sessionStorage.setItem(scopedRetryKey, '1')
          window.location.reload()
          return new Promise<LazyModule<TComponent>>(() => undefined)
        }
      }

      throw error
    }
  })
}

export function lazyNamedWithRetry<
  TKey extends string,
  TModule extends Record<TKey, AnyLazyComponent>,
>(
  factory: () => Promise<TModule>,
  exportName: TKey,
  retryKey?: string,
): LazyExoticComponent<TModule[TKey]> {
  return lazyWithRetry(
    async () => ({
      default: (await factory())[exportName],
    }),
    retryKey,
  )
}
