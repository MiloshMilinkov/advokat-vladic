import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import { admin, postId, resetDb, SLUGS, TEST_TOKEN, validPost } from './helpers'

const UNAUTHORIZED = { error: 'Neispravan pristupni ključ.' }
const NOT_CONFIGURED = { error: 'Administracija nije podešena (ADMIN_TOKEN).' }

const ROUTES = [
  { name: 'GET /api/admin/session', method: 'GET', path: () => '/api/admin/session', ok: 204 },
  { name: 'GET /api/admin/categories', method: 'GET', path: () => '/api/admin/categories', ok: 200 },
  { name: 'GET /api/admin/posts', method: 'GET', path: () => '/api/admin/posts', ok: 200 },
  { name: 'POST /api/admin/posts', method: 'POST', path: () => '/api/admin/posts', body: true, ok: 201 },
  { name: 'GET /api/admin/posts/:id', method: 'GET', path: (id: number) => `/api/admin/posts/${id}`, ok: 200 },
  { name: 'PUT /api/admin/posts/:id', method: 'PUT', path: (id: number) => `/api/admin/posts/${id}`, body: true, ok: 200 },
  { name: 'DELETE /api/admin/posts/:id', method: 'DELETE', path: (id: number) => `/api/admin/posts/${id}`, ok: 204 },
]

describe.each(ROUTES)('$name', (route) => {
  let id: number
  beforeEach(async () => {
    await resetDb()
    id = await postId(SLUGS.first)
  })

  const send = (opts: Parameters<typeof admin>[1] = {}) =>
    admin(route.path(id), { method: route.method, body: route.body ? validPost() : undefined, ...opts })

  it('rejects a missing token', async () => {
    const res = await send({ token: null })
    expect(res.status).toBe(401)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual(UNAUTHORIZED)
  })

  it.each([['wrong'], [`${TEST_TOKEN}x`], [TEST_TOKEN.slice(0, -1)], [TEST_TOKEN.toUpperCase()]])('rejects the wrong token %s', async (token) => {
    const res = await send({ token })
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
      expect(await (await send({ token })).text()).not.toContain(TEST_TOKEN)
    }
  })
})

describe('admin routing', () => {
  it.each([
    ['PATCH', '/api/admin/posts'],
    ['GET', '/api/admin/unknown'],
    ['POST', '/api/admin/session'],
  ])('checks the token before routing %s %s', async (method, path) => {
    expect((await admin(path, { method, token: null })).status).toBe(401)
    expect((await admin(path, { method })).status).toBe(405)
  })

  it('a rejected request changes nothing', async () => {
    await resetDb()
    const id = await postId(SLUGS.first)
    const snapshot = () => env.DB.prepare('SELECT * FROM posts ORDER BY id').all()
    const before = await snapshot()
    for (const token of [null, 'wrong']) {
      await admin('/api/admin/posts', { method: 'POST', body: validPost({ slug: 'uljez' }), token })
      await admin(`/api/admin/posts/${id}`, { method: 'PUT', body: validPost({ title: 'Promenjeno' }), token })
      await admin(`/api/admin/posts/${id}`, { method: 'DELETE', token })
    }
    expect((await snapshot()).results).toEqual(before.results)
  })
})
