// Shapes exchanged between the Worker API and the Vue app.

export interface Category {
  slug: string
  label: string
}

export interface CategoryWithCount extends Category {
  count: number
}

export interface TocItem {
  id: string
  text: string
}

export interface PostSummary {
  slug: string
  title: string
  excerpt: string
  category: Category
  coverUrl: string | null
  coverAlt: string
  readingMinutes: number
  /** ISO date, YYYY-MM-DD. */
  publishedAt: string
}

export interface PostDetail extends PostSummary {
  html: string
  toc: TocItem[]
  related: PostSummary[]
}

export type PostStatus = 'draft' | 'published'

/** Editable fields of a post (admin create/update payload). */
export interface PostInput {
  slug: string
  title: string
  excerpt: string
  seoTitle: string | null
  categorySlug: string
  coverUrl: string | null
  coverAlt: string
  ogImageUrl: string | null
  bodyMd: string
  readingMinutes: number
  publishedAt: string
  status: PostStatus
}

export interface AdminPost extends PostInput {
  id: number
  createdAt: string
  updatedAt: string
}

export interface ApiError {
  error: string
}
