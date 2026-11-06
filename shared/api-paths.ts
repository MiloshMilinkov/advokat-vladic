// Canonical API URLs. The Worker inlines responses for the first page view keyed
// by these exact strings, and the client looks them up before hitting the network.

export const apiPaths = {
  posts(opts: { category?: string; limit?: number } = {}) {
    const q = new URLSearchParams()
    if (opts.category) q.set('category', opts.category)
    if (opts.limit) q.set('limit', String(opts.limit))
    const s = q.toString()
    return `/api/posts${s ? `?${s}` : ''}`
  },
  post: (slug: string) => `/api/posts/${encodeURIComponent(slug)}`,
  categories: () => '/api/categories',
}

export const INITIAL_DATA_ID = '__INITIAL_DATA__'
