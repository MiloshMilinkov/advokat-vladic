import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import { SLUGS, TEST_TOKEN, validPost } from './fixtures'
import { admin, postId, resetDb } from './helpers'

const UNAUTHORIZED = { error: 'Neispravan pristupni ključ.' }
const NOT_CONFIGURED = { error: 'Administracija nije podešena (ADMIN_TOKEN).' }

const ROUTES: { method: string; path: string; body?: unknown; ok: number }[] = [
  { method: 'GET', path: '/api/admin/session', ok: 204 },
  { method: 'GET', path: '/api/admin/categories', ok: 200 },
  { method: 'GET', path: '/api/admin/posts', ok: 200 },
  { method: 'POST', path: '/api/admin/posts', body: validPost(), ok: 201 },
  { method: 'GET', path: '/api/admin/posts/:id', ok: 200 },
  { method: 'PUT', path: '/api/admin/posts/:id', body: validPost(), ok: 200 },
  { method: 'DELETE', path: '/api/admin/posts/:id', ok: 204 },
]

describe.each(ROUTES)('$method $path', (route) => {
  let id: number
  beforeEach(async () => {
    await resetDb()
    id = await postId(SLUGS.first)
  })

  const send = (opts: Parameters<typeof admin>[1] = {}) =>
    admin(route.path.replace(':id', String(id)), { method: route.method, body: route.body, ...opts })

  it('rejects a missing token', async () => {
    const res = await send({ authorization: null })
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual(UNAUTHORIZED)
  })

  it.each([['wrong'], [`${TEST_TOKEN}x`], [TEST_TOKEN.slice(0, -1)], [TEST_TOKEN.toUpperCase()]])('rejects the wrong token %s', async (token) => {
    const res = await send({ authorization: `Bearer ${token}` })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual(UNAUTHORIZED)
  })

  it.each([['Bearer '], [`bearer ${TEST_TOKEN}`], [`Basic ${TEST_TOKEN}`], [TEST_TOKEN], [`Bearer  ${TEST_TOKEN}`], [`Token ${TEST_TOKEN}`]])(
    'rejects the header %j',
    async (authorization) => {
      expect((await send({ authorization })).status).toBe(401)
    },
  )

  it('accepts the correct token', async () => {
    expect((await send()).status).toBe(route.ok)
  })

  it.each([[undefined], ['']])('returns 503 when ADMIN_TOKEN is %j, even with a token', async (ADMIN_TOKEN) => {
    const res = await send({ env: { ADMIN_TOKEN } })
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual(NOT_CONFIGURED)
  })

  it('never echoes the token', async () => {
    for (const token of [TEST_TOKEN, 'wrong']) {
      expect(await (await send({ authorization: `Bearer ${token}` })).text()).not.toContain(TEST_TOKEN)
    }
  })
})

describe('admin routing', () => {
  it.each([
    ['PATCH', '/api/admin/posts'],
    ['GET', '/api/admin/unknown'],
    ['POST', '/api/admin/session'],
  ])('checks the token before routing %s %s', async (method, path) => {
    expect((await admin(path, { method, authorization: null })).status).toBe(401)
    expect((await admin(path, { method })).status).toBe(405)
  })

  it('a rejected request changes nothing', async () => {
    await resetDb()
    const id = await postId(SLUGS.first)
    const snapshot = () => env.DB.prepare('SELECT * FROM posts ORDER BY id').all()
    const before = await snapshot()
    for (const authorization of [null, 'Bearer wrong']) {
      await admin('/api/admin/posts', { method: 'POST', body: validPost({ slug: 'uljez' }), authorization })
      await admin(`/api/admin/posts/${id}`, { method: 'PUT', body: validPost({ title: 'Promenjeno' }), authorization })
      await admin(`/api/admin/posts/${id}`, { method: 'DELETE', authorization })
    }
    expect((await snapshot()).results).toEqual(before.results)
  })
})
