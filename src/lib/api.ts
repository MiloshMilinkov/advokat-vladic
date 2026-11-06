import { INITIAL_DATA_ID } from '@shared/api-paths'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Responses the Worker inlined into the first HTML document (consumed once). */
const initial: Record<string, unknown> = (() => {
  const el = document.getElementById(INITIAL_DATA_ID)
  if (!el?.textContent) return {}
  try {
    return JSON.parse(el.textContent) as Record<string, unknown>
  } catch {
    return {}
  }
})()

const TTL = 60_000
const cache = new Map<string, { at: number; value: unknown }>()

/** GET a public API resource: inlined data → short-lived memory cache → network. */
export async function getJSON<T>(path: string): Promise<T> {
  if (path in initial) {
    const value = initial[path]
    delete initial[path]
    cache.set(path, { at: Date.now(), value })
    return value as T
  }
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < TTL) return hit.value as T

  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(res.status, body?.error ?? `HTTP ${res.status}`)
  }
  const value = (await res.json()) as T
  cache.set(path, { at: Date.now(), value })
  return value
}

export function clearApiCache() {
  cache.clear()
}
