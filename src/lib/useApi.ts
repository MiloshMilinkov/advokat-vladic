import { inject, ref, shallowRef, watch } from 'vue'
import { ApiError, getJSON, primeCache } from './api'
import { INITIAL_DATA, isInitialError } from './initial-data'

/**
 * Reactive GET of a public API path; re-fetches whenever the path changes.
 *
 * Data the Worker already loaded for this page is used synchronously, so the
 * server renders complete HTML and the browser hydrates the same markup without
 * a loading state. In the browser each inlined response is used once, then the
 * normal cache/network path applies.
 */
export function useApi<T>(path: () => string | null) {
  const initial = inject(INITIAL_DATA, {})
  const first = path()
  const seeded = first !== null && first in initial
  const seed = seeded ? initial[first] : undefined
  if (seeded && !import.meta.env.SSR) {
    delete initial[first]
    if (!isInitialError(seed)) primeCache(first, seed)
  }

  const data = shallowRef<T | null>(seeded && !isInitialError(seed) ? (seed as T) : null)
  const error = shallowRef<ApiError | null>(
    isInitialError(seed) ? new ApiError(seed.__apiError.status, seed.__apiError.message) : null,
  )
  const pending = ref(first !== null && !seeded)

  watch(
    path,
    async (p, _old, onCleanup) => {
      // The server never fetches: it renders only what the Worker provided.
      if (import.meta.env.SSR) return
      let cancelled = false
      onCleanup(() => (cancelled = true))
      data.value = null
      error.value = null
      if (!p) {
        pending.value = false
        return
      }
      pending.value = true
      try {
        const value = await getJSON<T>(p)
        if (!cancelled) data.value = value
      } catch (e) {
        if (!cancelled) error.value = e instanceof ApiError ? e : new ApiError(0, String(e))
      } finally {
        if (!cancelled) pending.value = false
      }
    },
    { immediate: !seeded },
  )

  return { data, error, pending }
}
