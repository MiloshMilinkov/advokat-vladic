import { env } from 'cloudflare:workers'
import { expect, it } from 'vitest'
import { resetDb } from './helpers'

it('applies migrations and loads fixtures', async () => {
  await resetDb()
  const { results } = await env.DB.prepare('SELECT slug FROM posts ORDER BY slug').all<{ slug: string }>()
  expect(results.map((r) => r.slug)).toEqual(['drugi-clanak', 'nacrt-clanka', 'prvi-clanak', 'treci-clanak'])
})
