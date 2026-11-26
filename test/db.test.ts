import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  adminCreatePost,
  adminDeletePost,
  adminUpdatePost,
  getPublishedPost,
  listAllCategories,
  listCategories,
  listPosts,
  sitemapEntries,
} from '../worker/db'
import { resetDb, SLUGS, validPost } from './helpers'

const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug)

beforeEach(resetDb)

describe('listPosts', () => {
  it('returns published posts, newest first', async () => {
    expect(slugs(await listPosts(env.DB))).toEqual([SLUGS.second, SLUGS.family, SLUGS.first])
  })

  it('filters by category', async () => {
    expect(slugs(await listPosts(env.DB, { category: 'radno-pravo' }))).toEqual([SLUGS.second, SLUGS.first])
    expect(await listPosts(env.DB, { category: 'upravno-pravo' })).toEqual([])
  })

  it.each([
    [1, 1],
    [0, 1],
    [-5, 1],
    [500, 3],
  ])('clamps limit %i to return %i posts', async (limit, count) => {
    expect(await listPosts(env.DB, { limit })).toHaveLength(count)
  })

  it('returns the summary shape', async () => {
    const [post] = await listPosts(env.DB, { limit: 1 })
    expect(post).toEqual({
      slug: SLUGS.second,
      title: 'Drugi članak',
      excerpt: 'Opis: Drugi članak.',
      category: { slug: 'radno-pravo', label: 'Radno pravo' },
      coverUrl: null,
      coverAlt: '',
      readingMinutes: 2,
      publishedAt: '2026-03-05',
    })
  })
})

describe('getPublishedPost', () => {
  it('renders the article with its table of contents', async () => {
    const post = await getPublishedPost(env.DB, SLUGS.second)
    expect(post).toMatchObject({ slug: SLUGS.second, title: 'Drugi članak', updatedAt: '2026-01-01T00:00:00Z' })
    expect(post!.html).toContain('<h2')
    expect(post!.toc.length).toBeGreaterThan(0)
  })

  it('puts same-category posts first in related, without the post itself or drafts', async () => {
    const post = await getPublishedPost(env.DB, SLUGS.second)
    expect(slugs(post!.related)).toEqual([SLUGS.first, SLUGS.family])
  })

  it('caps related posts at 3', async () => {
    for (const slug of ['dodatni-a', 'dodatni-b', 'dodatni-c']) await adminCreatePost(env.DB, validPost({ slug }))
    expect((await getPublishedPost(env.DB, SLUGS.second))!.related).toHaveLength(3)
  })

  it.each([[SLUGS.draft], ['ne-postoji']])('returns null for %s', async (slug) => {
    expect(await getPublishedPost(env.DB, slug)).toBeNull()
  })
})

describe('categories', () => {
  it('lists only categories with published posts, in display order', async () => {
    expect(await listCategories(env.DB)).toEqual([
      { slug: 'radno-pravo', label: 'Radno pravo', count: 2 },
      { slug: 'porodicno-pravo', label: 'Porodično i nasledno pravo', count: 1 },
    ])
  })

  it('lists all categories for the admin', async () => {
    expect(await listAllCategories(env.DB)).toEqual([
      { slug: 'radno-pravo', label: 'Radno pravo', count: 3 },
      { slug: 'porodicno-pravo', label: 'Porodično i nasledno pravo', count: 1 },
      { slug: 'upravno-pravo', label: 'Upravno pravo', count: 0 },
    ])
  })
})

describe('sitemap and admin writes', () => {
  it('lists only published posts in the sitemap', async () => {
    expect(slugs(await sitemapEntries(env.DB))).toEqual([SLUGS.second, SLUGS.family, SLUGS.first])
  })

  it('reports a missing id on update and delete', async () => {
    expect(await adminUpdatePost(env.DB, 999999, validPost())).toBe(false)
    expect(await adminDeletePost(env.DB, 999999)).toBe(false)
  })
})
