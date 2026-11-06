export interface Env {
  DB: D1Database
  ASSETS: Fetcher
  /** Canonical origin, e.g. https://advokatvladic.rs */
  SITE_URL: string
  /** Bearer token for /api/admin/* – set with `wrangler secret put ADMIN_TOKEN`. */
  ADMIN_TOKEN?: string
}

export function json(data: unknown, init: { status?: number; private?: boolean } = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Public data is revalidated on every request so admin edits show up at once
      // (the SPA keeps its own short in-memory cache for back/forward navigation).
      'Cache-Control': init.private ? 'no-store' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function error(status: number, message: string): Response {
  return json({ error: message }, { status, private: true })
}
