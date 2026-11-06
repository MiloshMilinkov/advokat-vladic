import { renderMarkdown } from '@shared/markdown'
import type { AdminPost, CategoryWithCount, PostDetail, PostInput, PostSummary } from '@shared/types'

interface PostRow {
  id: number
  slug: string
  title: string
  excerpt: string
  seo_title: string | null
  category_slug: string
  category_label: string
  cover_url: string | null
  cover_alt: string
  og_image_url: string | null
  body_md: string
  reading_minutes: number
  published_at: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

const SUMMARY_COLS = `p.slug, p.title, p.excerpt, p.category_slug, c.label AS category_label,
  p.cover_url, p.cover_alt, p.reading_minutes, p.published_at`

const toSummary = (r: Pick<PostRow, 'slug' | 'title' | 'excerpt' | 'category_slug' | 'category_label' | 'cover_url' | 'cover_alt' | 'reading_minutes' | 'published_at'>): PostSummary => ({
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  category: { slug: r.category_slug, label: r.category_label },
  coverUrl: r.cover_url,
  coverAlt: r.cover_alt,
  readingMinutes: r.reading_minutes,
  publishedAt: r.published_at,
})

const toAdmin = (r: PostRow): AdminPost => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  seoTitle: r.seo_title,
  categorySlug: r.category_slug,
  coverUrl: r.cover_url,
  coverAlt: r.cover_alt,
  ogImageUrl: r.og_image_url,
  bodyMd: r.body_md,
  readingMinutes: r.reading_minutes,
  publishedAt: r.published_at,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export async function listPosts(db: D1Database, opts: { category?: string; limit?: number } = {}): Promise<PostSummary[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 100)
  const where = ["p.status = 'published'"]
  const binds: unknown[] = []
  if (opts.category) {
    where.push('p.category_slug = ?')
    binds.push(opts.category)
  }
  binds.push(limit)
  const { results } = await db
    .prepare(
      `SELECT ${SUMMARY_COLS} FROM posts p JOIN categories c ON c.slug = p.category_slug
       WHERE ${where.join(' AND ')} ORDER BY p.published_at DESC, p.id DESC LIMIT ?`,
    )
    .bind(...binds)
    .all<PostRow>()
  return results.map(toSummary)
}

export interface PostWithMeta extends PostDetail {
  seoTitle: string | null
  ogImageUrl: string | null
  updatedAt: string
}

export async function getPublishedPost(db: D1Database, slug: string): Promise<PostWithMeta | null> {
  const row = await db
    .prepare(
      `SELECT p.*, c.label AS category_label FROM posts p JOIN categories c ON c.slug = p.category_slug
       WHERE p.slug = ? AND p.status = 'published'`,
    )
    .bind(slug)
    .first<PostRow>()
  if (!row) return null
  // Same-category posts first, then the newest of the rest.
  const { results } = await db
    .prepare(
      `SELECT ${SUMMARY_COLS} FROM posts p JOIN categories c ON c.slug = p.category_slug
       WHERE p.status = 'published' AND p.slug != ?
       ORDER BY (p.category_slug = ?) DESC, p.published_at DESC, p.id DESC LIMIT 3`,
    )
    .bind(slug, row.category_slug)
    .all<PostRow>()
  const { html, toc } = renderMarkdown(row.body_md)
  return {
    ...toSummary(row),
    html,
    toc,
    related: results.map(toSummary),
    seoTitle: row.seo_title,
    ogImageUrl: row.og_image_url,
    updatedAt: row.updated_at,
  }
}

/** Categories that have at least one published post, in display order. */
export async function listCategories(db: D1Database): Promise<CategoryWithCount[]> {
  const { results } = await db
    .prepare(
      `SELECT c.slug, c.label, COUNT(p.id) AS count FROM categories c
       JOIN posts p ON p.category_slug = c.slug AND p.status = 'published'
       GROUP BY c.slug ORDER BY c.sort_order, c.label`,
    )
    .all<CategoryWithCount>()
  return results
}

export async function listAllCategories(db: D1Database): Promise<CategoryWithCount[]> {
  const { results } = await db
    .prepare(
      `SELECT c.slug, c.label, COUNT(p.id) AS count FROM categories c
       LEFT JOIN posts p ON p.category_slug = c.slug
       GROUP BY c.slug ORDER BY c.sort_order, c.label`,
    )
    .all<CategoryWithCount>()
  return results
}

export async function sitemapEntries(db: D1Database): Promise<{ slug: string; updated_at: string }[]> {
  const { results } = await db
    .prepare(`SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC`)
    .all<{ slug: string; updated_at: string }>()
  return results
}

// ---------------------------------------------------------------- admin

export async function adminListPosts(db: D1Database): Promise<Omit<AdminPost, 'bodyMd'>[]> {
  const { results } = await db
    .prepare(`SELECT p.*, '' AS body_md, c.label AS category_label FROM posts p JOIN categories c ON c.slug = p.category_slug ORDER BY p.published_at DESC, p.id DESC`)
    .all<PostRow>()
  return results.map((r) => {
    const { bodyMd: _omit, ...rest } = toAdmin(r)
    return rest
  })
}

export async function adminGetPost(db: D1Database, id: number): Promise<AdminPost | null> {
  const row = await db.prepare(`SELECT p.*, c.label AS category_label FROM posts p JOIN categories c ON c.slug = p.category_slug WHERE p.id = ?`).bind(id).first<PostRow>()
  return row ? toAdmin(row) : null
}

const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

export async function adminCreatePost(db: D1Database, p: PostInput): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO posts (slug, title, excerpt, seo_title, category_slug, cover_url, cover_alt, og_image_url, body_md, reading_minutes, published_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(p.slug, p.title, p.excerpt, p.seoTitle, p.categorySlug, p.coverUrl, p.coverAlt, p.ogImageUrl, p.bodyMd, p.readingMinutes, p.publishedAt, p.status)
    .first<{ id: number }>()
  return res!.id
}

export async function adminUpdatePost(db: D1Database, id: number, p: PostInput): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE posts SET slug = ?, title = ?, excerpt = ?, seo_title = ?, category_slug = ?, cover_url = ?, cover_alt = ?,
         og_image_url = ?, body_md = ?, reading_minutes = ?, published_at = ?, status = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(p.slug, p.title, p.excerpt, p.seoTitle, p.categorySlug, p.coverUrl, p.coverAlt, p.ogImageUrl, p.bodyMd, p.readingMinutes, p.publishedAt, p.status, now(), id)
    .run()
  return res.meta.changes > 0
}

export async function adminDeletePost(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run()
  return res.meta.changes > 0
}
