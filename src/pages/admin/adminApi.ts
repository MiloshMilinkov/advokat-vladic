import type { AdminPost, CategoryWithCount, PostInput } from '@shared/types'
import { ApiError, clearApiCache } from '@/lib/api'

const KEY = 'vladic-admin-token'

export const tokenStore = {
  get: () => {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set: (t: string) => {
    try {
      sessionStorage.setItem(KEY, t)
    } catch {
      /* private mode – token lives only in memory */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },
}

async function call<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(res.status, data?.error ?? `HTTP ${res.status}`)
  }
  if (method !== 'GET') clearApiCache()
  return (res.status === 204 ? null : await res.json()) as T
}

export type AdminListItem = Omit<AdminPost, 'bodyMd'>

export const adminApi = (token: string) => ({
  check: () => call<null>(token, 'GET', '/session'),
  categories: () => call<CategoryWithCount[]>(token, 'GET', '/categories'),
  list: () => call<AdminListItem[]>(token, 'GET', '/posts'),
  get: (id: number) => call<AdminPost>(token, 'GET', `/posts/${id}`),
  create: (p: PostInput) => call<AdminPost>(token, 'POST', '/posts', p),
  update: (id: number, p: PostInput) => call<AdminPost>(token, 'PUT', `/posts/${id}`, p),
  remove: (id: number) => call<null>(token, 'DELETE', `/posts/${id}`),
})
