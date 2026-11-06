export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const TTL = 60_000
const cache = new Map<string, { at: number; value: unknown }>()

/** Stores a response that arrived another way (e.g. inlined into the first page). */
export function primeCache(path: string, value: unknown) {
  cache.set(path, { at: Date.now(), value })
}

/** GET a public API resource: short-lived memory cache → network. */
export async function getJSON<T>(path: string): Promise<T> {
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
