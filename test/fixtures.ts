// Plain test data with no runtime imports, so vitest.config.ts (Node) can load it too.
import type { PostInput } from '../shared/types.ts'

/** Fake admin token. Never a real secret: the suite never reads .dev.vars. */
export const TEST_TOKEN = 'test-admin-token-not-a-real-secret'

export const SITE_URL = 'https://advokatvladic.rs'

export const SLUGS = { first: 'prvi-clanak', second: 'drugi-clanak', family: 'treci-clanak', draft: 'nacrt-clanka' } as const

export function validPost(overrides: Partial<PostInput> = {}): PostInput {
  return {
    slug: 'test-clanak',
    title: 'Test članak',
    excerpt: 'Kratak opis.',
    seoTitle: null,
    categorySlug: 'radno-pravo',
    coverUrl: null,
    coverAlt: '',
    ogImageUrl: null,
    bodyMd: '## Uvod\n\nTekst.',
    readingMinutes: 3,
    publishedAt: '2026-05-01',
    status: 'published',
    ...overrides,
  }
}
