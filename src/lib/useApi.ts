import { ref, shallowRef, watch } from 'vue'
import { ApiError, getJSON } from './api'

/** Reactive GET of a public API path; re-fetches whenever the path changes. */
export function useApi<T>(path: () => string | null) {
  const data = shallowRef<T | null>(null)
  const error = shallowRef<ApiError | null>(null)
  const pending = ref(true)

  watch(
    path,
    async (p, _old, onCleanup) => {
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
    { immediate: true },
  )

  return { data, error, pending }
}
