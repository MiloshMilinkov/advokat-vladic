import { env } from 'cloudflare:workers'
import type { Env } from '../worker/http'
import worker from '../worker/index'
import { SLUGS, TEST_TOKEN } from './fixtures'

// Fixed timestamps, so an edit always changes updated_at (the column default is
// "now" to the second, which an edit in the same second would not change).
const FIXTURE_TIME = '2026-01-01T00:00:00Z'

const CATEGORIES = [
  ['radno-pravo', 'Radno pravo'],
  ['porodicno-pravo', 'Porodično i nasledno pravo'],
  ['upravno-pravo', 'Upravno pravo'], // no posts
] as const

const POSTS = [
  [SLUGS.first, 'Prvi članak', 'radno-pravo', '2026-01-10', 'published'],
  [SLUGS.second, 'Drugi članak', 'radno-pravo', '2026-03-05', 'published'],
  [SLUGS.family, 'Treći članak', 'porodicno-pravo', '2026-02-01', 'published'],
  [SLUGS.draft, 'Nacrt članka', 'radno-pravo', '2026-04-01', 'draft'],
] as const

/** Empties the blog tables and loads the fixtures above. */
export async function resetDb(): Promise<void> {
  const db = env.DB
  await db.batch([
    db.prepare('DELETE FROM posts'),
    db.prepare('DELETE FROM categories'),
    ...CATEGORIES.map(([slug, label], i) =>
      db.prepare('INSERT INTO categories (slug, label, sort_order) VALUES (?, ?, ?)').bind(slug, label, i),
    ),
    ...POSTS.map(([slug, title, category, publishedAt, status]) =>
      db
        .prepare(
          `INSERT INTO posts (slug, title, excerpt, category_slug, body_md, reading_minutes, published_at, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 2, ?, ?, ?, ?)`,
        )
        .bind(slug, title, `Opis: ${title}.`, category, `## Uvod\n\nTekst: ${title}.`, publishedAt, status, FIXTURE_TIME, FIXTURE_TIME),
    ),
  ])
}

/** Id of a fixture post (ids keep growing across resets). */
export async function postId(slug: string): Promise<number> {
  const row = await env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).first<{ id: number }>()
  if (!row) throw new Error(`no post ${slug}`)
  return row.id
}

/** Calls the Worker's fetch handler directly, optionally with some bindings overridden. */
export function call(path: string, init?: RequestInit, opts: { origin?: string; env?: Partial<Env> } = {}): Promise<Response> {
  const request = new Request(`${opts.origin ?? 'http://localhost'}${path}`, init)
  // Typed as an incoming request (with `cf` data the Worker never reads).
  return worker.fetch(request as Parameters<typeof worker.fetch>[0], { ...env, ...opts.env })
}

/**
 * Calls an admin route. `authorization` is the raw header value (default
 * `Bearer <TEST_TOKEN>`; null sends none). `rawBody` is sent as is, `body` as JSON.
 */
export function admin(
  path: string,
  opts: { method?: string; body?: unknown; rawBody?: string; authorization?: string | null; env?: Partial<Env> } = {},
): Promise<Response> {
  const headers = new Headers()
  const authorization = opts.authorization === undefined ? `Bearer ${TEST_TOKEN}` : opts.authorization
  if (authorization !== null) headers.set('Authorization', authorization)
  let body = opts.rawBody
  if (opts.body !== undefined) {
    body = JSON.stringify(opts.body)
    headers.set('Content-Type', 'application/json')
  }
  return call(path, { method: opts.method ?? 'GET', headers, body }, { env: opts.env })
}

/** The server-rendered markup inside <div id="app"> (empty when SSR did not run). */
export function appHtml(html: string): string {
  const m = html.match(/<div id="app">([\s\S]*)<\/div>\s*<script/)
  if (!m) throw new Error('#app not found in page')
  return m[1].trim()
}
