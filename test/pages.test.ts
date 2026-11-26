import { beforeEach, describe, expect, it } from 'vitest'
import { appHtml, call, resetDb, SLUGS } from './helpers'

const SITE = 'https://advokatvladic.rs'

beforeEach(resetDb)

describe('server-rendered pages', () => {
  it.each([['/'], ['/blog/'], [`/blog/${SLUGS.second}/`], ['/advokat-za-radno-pravo/'], ['/advokatska-tarifa/']])(
    '%s returns 200 with server-rendered HTML',
    async (path) => {
      const res = await call(path)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toMatch(/^text\/html/)
      expect(appHtml(await res.text())).not.toBe('')
    },
  )

  it('renders the article and its SEO tags', async () => {
    const html = await (await call(`/blog/${SLUGS.second}/`)).text()
    expect(appHtml(html)).toContain('Drugi članak')
    expect(html).toContain(`<link rel="canonical" href="${SITE}/blog/${SLUGS.second}/">`)
  })

  it('lists published posts on the blog index, never drafts', async () => {
    const app = appHtml(await (await call('/blog/')).text())
    for (const title of ['Prvi članak', 'Drugi članak', 'Treći članak']) expect(app).toContain(title)
    expect(app).not.toContain('Nacrt članka')
  })

  it.each([[`/blog/${SLUGS.draft}/`], ['/blog/ne-postoji/'], ['/ne-postoji/']])('%s returns a rendered 404', async (path) => {
    const res = await call(path)
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toMatch(/^text\/html/)
    const html = await res.text()
    expect(appHtml(html)).not.toBe('')
    expect(html).not.toContain('Nacrt članka')
  })

  it('serves the admin editor unrendered and unindexed', async () => {
    const res = await call('/admin/')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex')
    const html = await res.text()
    expect(appHtml(html)).toBe('')
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">')
  })
})

describe('routing', () => {
  it('redirects to the trailing-slash URL', async () => {
    const res = await call('/blog')
    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('http://localhost/blog/')
  })

  it('keeps the query string when redirecting', async () => {
    expect((await call('/blog?x=1')).headers.get('Location')).toBe('http://localhost/blog/?x=1')
  })

  it('rejects other methods on pages', async () => {
    const res = await call('/', { method: 'POST' })
    expect(res.status).toBe(405)
    expect(res.headers.get('Allow')).toBe('GET, HEAD')
  })

  it('answers HEAD without a body', async () => {
    const res = await call('/blog/', { method: 'HEAD' })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('')
  })

  it('returns a real 404 for a missing static file', async () => {
    expect((await call('/ne-postoji.png')).status).toBe(404)
  })

  it('sets CSP and HSTS on the public site only', async () => {
    const live = await call('/', undefined, { origin: SITE })
    expect(live.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    expect(live.headers.get('Strict-Transport-Security')).toBe('max-age=31536000')
    const local = await call('/')
    expect(local.headers.has('Content-Security-Policy')).toBe(false)
    expect(local.headers.has('Strict-Transport-Security')).toBe(false)
  })
})

describe('public API', () => {
  it('lists posts without drafts', async () => {
    const res = await call('/api/posts')
    expect(res.status).toBe(200)
    expect(((await res.json()) as { slug: string }[]).map((p) => p.slug)).not.toContain(SLUGS.draft)
  })

  it.each([
    [`/api/posts/${SLUGS.second}`, 200],
    [`/api/posts/${SLUGS.draft}`, 404],
    ['/api/posts/ne-postoji', 404],
    ['/api/categories', 200],
    ['/api/nope', 404],
  ])('GET %s returns %i', async (path, status) => {
    expect((await call(path)).status).toBe(status)
  })

  it('rejects writes', async () => {
    expect((await call('/api/posts', { method: 'POST', body: '{}' })).status).toBe(405)
  })
})

describe('SEO files', () => {
  it('lists published posts in the sitemap', async () => {
    const res = await call('/sitemap.xml')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/^application\/xml/)
    const xml = await res.text()
    expect(xml).toContain(`<loc>${SITE}/blog/${SLUGS.second}/</loc>`)
    expect(xml).not.toContain(SLUGS.draft)
  })

  it('serves robots.txt', async () => {
    const res = await call('/robots.txt')
    expect(res.status).toBe(200)
    const txt = await res.text()
    expect(txt).toContain('Disallow: /admin/')
    expect(txt).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })
})
