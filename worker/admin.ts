import { readingMinutes } from '@shared/markdown'
import type { PostInput } from '@shared/types'
import { adminCreatePost, adminDeletePost, adminGetPost, adminListPosts, adminUpdatePost, listAllCategories } from './db'
import { error, json, type Env } from './http'

const enc = new TextEncoder()

/** Constant-time check of the `Authorization: Bearer <token>` header. */
async function authorized(request: Request, env: Env): Promise<boolean> {
  const expected = env.ADMIN_TOKEN
  if (!expected) return false
  const header = request.headers.get('Authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!given) return false
  // Hash both sides so the comparison is always over equal-length buffers.
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ])
  return crypto.subtle.timingSafeEqual(a, b)
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const URL_RE = /^(\/[^\s]*|https:\/\/[^\s]+)$/

type Validation = { ok: true; value: PostInput } | { ok: false; error: string }

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
function optStr(v: unknown): string | null {
  const s = str(v)
  return s ? s : null
}

export function validatePost(body: unknown): Validation {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Neispravan zahtev.' }
  const b = body as Record<string, unknown>
  const v: PostInput = {
    slug: str(b.slug).toLowerCase(),
    title: str(b.title),
    excerpt: str(b.excerpt),
    seoTitle: optStr(b.seoTitle),
    categorySlug: str(b.categorySlug),
    coverUrl: optStr(b.coverUrl),
    coverAlt: str(b.coverAlt),
    ogImageUrl: optStr(b.ogImageUrl),
    bodyMd: typeof b.bodyMd === 'string' ? b.bodyMd.replace(/\r\n/g, '\n') : '',
    readingMinutes: Number(b.readingMinutes) || 0,
    publishedAt: str(b.publishedAt),
    status: b.status === 'draft' ? 'draft' : 'published',
  }
  if (!SLUG_RE.test(v.slug) || v.slug.length > 120) return { ok: false, error: 'Slug sme da sadrži samo mala slova, brojeve i crtice.' }
  if (!v.title || v.title.length > 200) return { ok: false, error: 'Naslov je obavezan (najviše 200 karaktera).' }
  if (!v.excerpt || v.excerpt.length > 400) return { ok: false, error: 'Kratak opis je obavezan (najviše 400 karaktera).' }
  if (v.seoTitle && v.seoTitle.length > 200) return { ok: false, error: 'SEO naslov je predugačak.' }
  if (!v.categorySlug) return { ok: false, error: 'Izaberite kategoriju.' }
  if (v.coverUrl && !URL_RE.test(v.coverUrl)) return { ok: false, error: 'Adresa naslovne slike mora početi sa / ili https://.' }
  if (v.ogImageUrl && !URL_RE.test(v.ogImageUrl)) return { ok: false, error: 'Adresa slike za deljenje mora početi sa / ili https://.' }
  if (v.coverAlt.length > 400) return { ok: false, error: 'Opis slike je predugačak.' }
  if (!v.bodyMd.trim() || v.bodyMd.length > 200_000) return { ok: false, error: 'Tekst članka je obavezan.' }
  if (!DATE_RE.test(v.publishedAt) || Number.isNaN(Date.parse(v.publishedAt))) return { ok: false, error: 'Datum mora biti u formatu GGGG-MM-DD.' }
  if (!Number.isInteger(v.readingMinutes) || v.readingMinutes < 1 || v.readingMinutes > 240) v.readingMinutes = readingMinutes(v.bodyMd)
  return { ok: true, value: v }
}

function dbError(e: unknown): Response {
  const msg = e instanceof Error ? e.message : String(e)
  if (/UNIQUE constraint failed: posts\.slug/i.test(msg)) return error(409, 'Članak sa ovim slugom već postoji.')
  if (/FOREIGN KEY constraint failed/i.test(msg)) return error(400, 'Nepoznata kategorija.')
  if (/CHECK constraint failed/i.test(msg)) return error(400, 'Neispravni podaci.')
  console.error('admin db error', msg)
  return error(500, 'Greška u bazi podataka.')
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function handleAdmin(request: Request, env: Env, path: string): Promise<Response> {
  if (!env.ADMIN_TOKEN) return error(503, 'Administracija nije podešena (ADMIN_TOKEN).')
  if (!(await authorized(request, env))) return error(401, 'Neispravan pristupni ključ.')

  const m = path.match(/^\/api\/admin\/posts\/(\d+)$/)
  const id = m ? Number(m[1]) : null

  try {
    if (path === '/api/admin/session' && request.method === 'GET') return new Response(null, { status: 204 })
    if (path === '/api/admin/categories' && request.method === 'GET') return json(await listAllCategories(env.DB), { private: true })

    if (path === '/api/admin/posts') {
      if (request.method === 'GET') return json(await adminListPosts(env.DB), { private: true })
      if (request.method === 'POST') {
        const v = validatePost(await readJson(request))
        if (!v.ok) return error(400, v.error)
        const newId = await adminCreatePost(env.DB, v.value)
        return json(await adminGetPost(env.DB, newId), { status: 201, private: true })
      }
    }

    if (id !== null) {
      if (request.method === 'GET') {
        const post = await adminGetPost(env.DB, id)
        return post ? json(post, { private: true }) : error(404, 'Članak nije pronađen.')
      }
      if (request.method === 'PUT') {
        const v = validatePost(await readJson(request))
        if (!v.ok) return error(400, v.error)
        if (!(await adminUpdatePost(env.DB, id, v.value))) return error(404, 'Članak nije pronađen.')
        return json(await adminGetPost(env.DB, id), { private: true })
      }
      if (request.method === 'DELETE') {
        return (await adminDeletePost(env.DB, id)) ? new Response(null, { status: 204 }) : error(404, 'Članak nije pronađen.')
      }
    }
  } catch (e) {
    return dbError(e)
  }
  return error(405, 'Metod nije podržan.')
}
