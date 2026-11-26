import { env } from 'cloudflare:workers'
import type { AdminPost } from '@shared/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { admin, postId, resetDb, SLUGS, validPost } from './helpers'

const NOT_FOUND = { error: 'Članak nije pronađen.' }
const countPosts = async () => (await env.DB.prepare('SELECT COUNT(*) AS n FROM posts').first<{ n: number }>())!.n
const getPost = async (id: number) => (await (await admin(`/api/admin/posts/${id}`)).json()) as AdminPost

beforeEach(resetDb)

describe('create', () => {
  it('creates a post', async () => {
    const res = await admin('/api/admin/posts', { method: 'POST', body: validPost({ slug: 'novi-clanak' }) })
    expect(res.status).toBe(201)
    const created = (await res.json()) as AdminPost
    expect(created).toMatchObject({ ...validPost({ slug: 'novi-clanak' }), id: expect.any(Number), createdAt: expect.any(String) })
    expect(await getPost(created.id)).toEqual(created)
  })

  it.each([
    ['an invalid slug', { body: { ...validPost(), slug: 'Bad Slug' } }],
    ['a protocol-relative cover URL', { body: validPost({ coverUrl: '//evil.example/a.jpg' }) }],
    ['a badly formatted date', { body: validPost({ publishedAt: '2026/01/01' }) }],
    ['malformed JSON', { rawBody: '{not json' }],
    ['an empty body', { rawBody: '' }],
  ])('rejects %s without writing', async (_name, opts) => {
    const before = await countPosts()
    const res = await admin('/api/admin/posts', { method: 'POST', ...opts })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: expect.any(String) })
    expect(await countPosts()).toBe(before)
  })

  it('rejects a duplicate slug', async () => {
    const res = await admin('/api/admin/posts', { method: 'POST', body: validPost({ slug: SLUGS.second }) })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Članak sa ovim slugom već postoji.' })
  })

  it('rejects an unknown category', async () => {
    const res = await admin('/api/admin/posts', { method: 'POST', body: validPost({ categorySlug: 'nepostojeca' }) })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Nepoznata kategorija.' })
  })
})

describe('edit', () => {
  it('saves the changes and bumps updatedAt', async () => {
    const id = await postId(SLUGS.first)
    const res = await admin(`/api/admin/posts/${id}`, { method: 'PUT', body: validPost({ slug: SLUGS.first, title: 'Novi naslov' }) })
    expect(res.status).toBe(200)
    const saved = (await res.json()) as AdminPost
    expect(saved).toMatchObject({ id, slug: SLUGS.first, title: 'Novi naslov', createdAt: '2026-01-01T00:00:00Z' })
    expect(saved.updatedAt).not.toBe('2026-01-01T00:00:00Z')
  })

  it('rejects an invalid edit and keeps the row', async () => {
    const id = await postId(SLUGS.first)
    const before = await getPost(id)
    const res = await admin(`/api/admin/posts/${id}`, { method: 'PUT', body: { ...validPost({ slug: SLUGS.first }), title: '' } })
    expect(res.status).toBe(400)
    expect(await getPost(id)).toEqual(before)
  })

  it('rejects renaming to an existing slug', async () => {
    const id = await postId(SLUGS.first)
    const res = await admin(`/api/admin/posts/${id}`, { method: 'PUT', body: validPost({ slug: SLUGS.second }) })
    expect(res.status).toBe(409)
    expect((await getPost(id)).slug).toBe(SLUGS.first)
  })
})

describe('missing posts', () => {
  it.each([
    ['GET', undefined],
    ['PUT', validPost()],
    ['DELETE', undefined],
  ])('%s of an unknown id returns 404', async (method, body) => {
    const res = await admin('/api/admin/posts/999999', { method, body })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual(NOT_FOUND)
  })

  it('a non-numeric id is not a route', async () => {
    expect((await admin('/api/admin/posts/abc')).status).toBe(405)
  })
})

describe('delete and lists', () => {
  it('deletes a post', async () => {
    const id = await postId(SLUGS.first)
    expect((await admin(`/api/admin/posts/${id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await admin(`/api/admin/posts/${id}`)).status).toBe(404)
  })

  it('lists drafts for the admin, without bodies', async () => {
    const posts = (await (await admin('/api/admin/posts')).json()) as Record<string, unknown>[]
    expect(posts.map((p) => p.slug)).toEqual([SLUGS.draft, SLUGS.second, SLUGS.family, SLUGS.first])
    for (const p of posts) expect(p).not.toHaveProperty('bodyMd')
  })

  it('lists every category, empty ones too', async () => {
    const categories = await (await admin('/api/admin/categories')).json()
    expect(categories).toContainEqual({ slug: 'upravno-pravo', label: 'Upravno pravo', count: 0 })
    expect(categories).toContainEqual({ slug: 'radno-pravo', label: 'Radno pravo', count: 3 })
  })
})
