import { apiPaths, INITIAL_DATA_ID } from '@shared/api-paths'
import { adminHead, blogIndexHead, homeHead, notFoundHead, postHead, practiceHead, tariffHead, type HeadData } from '@shared/head'
import { practiceAreaBySlug, practiceAreas } from '@shared/practice-areas'
import { handleAdmin } from './admin'
import { getPublishedPost, listCategories, listPosts, sitemapEntries } from './db'
import { error, json, type Env } from './http'

interface Page {
  head: HeadData
  status: number
  /** API responses inlined into the HTML, keyed by their canonical API path. */
  data: Record<string, unknown>
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path.startsWith('/api/')) return await handleApi(request, env, url)
      if (path === '/sitemap.xml' || path === '/sitemap-index.xml') return await sitemap(env)
      if (path === '/robots.txt') return robots(env)
    } catch (e) {
      console.error('request failed', path, e)
      return error(500, 'Došlo je do greške. Pokušajte ponovo.')
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })

    // Vite dev-server internals (only exist during `npm run dev`).
    if (/^\/(@|node_modules\/|src\/|shared\/|__)/.test(path)) return env.ASSETS.fetch(request)

    // Static files that are not in the bypass list (or do not exist).
    if (/\.[a-z0-9]{2,5}$/i.test(path)) {
      const res = await env.ASSETS.fetch(request)
      const isFallback = (res.headers.get('Content-Type') ?? '').startsWith('text/html') && !path.endsWith('.html')
      return isFallback ? new Response('Not Found', { status: 404 }) : res
    }

    // Every page URL ends with "/" (same structure as the original site).
    if (!path.endsWith('/')) {
      return Response.redirect(`${url.origin}${path}/${url.search}`, 301)
    }

    const page = await resolvePage(env, path)
    return renderPage(request, env, url, page)
  },
} satisfies ExportedHandler<Env>

// ------------------------------------------------------------------ API

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname
  if (path.startsWith('/api/admin/')) return handleAdmin(request, env, path)
  if (request.method !== 'GET') return error(405, 'Metod nije podržan.')

  if (path === '/api/posts') {
    const category = url.searchParams.get('category') ?? undefined
    const limit = Number(url.searchParams.get('limit')) || undefined
    return json(await listPosts(env.DB, { category, limit }))
  }
  if (path === '/api/categories') return json(await listCategories(env.DB))

  const m = path.match(/^\/api\/posts\/([a-z0-9-]+)$/)
  if (m) {
    const post = await getPublishedPost(env.DB, m[1])
    return post ? json(post) : error(404, 'Članak nije pronađen.')
  }
  return error(404, 'Nepostojeća putanja.')
}

// ------------------------------------------------------------------ pages

async function resolvePage(env: Env, path: string): Promise<Page> {
  const origin = env.SITE_URL
  const notFound: Page = { head: notFoundHead(), status: 404, data: {} }

  if (path === '/') {
    const key = apiPaths.posts({ limit: 3 })
    return { head: homeHead(origin), status: 200, data: { [key]: await listPosts(env.DB, { limit: 3 }) } }
  }
  if (path === '/blog/') {
    const [posts, categories] = await Promise.all([listPosts(env.DB), listCategories(env.DB)])
    return { head: blogIndexHead(origin), status: 200, data: { [apiPaths.posts()]: posts, [apiPaths.categories()]: categories } }
  }
  const post = path.match(/^\/blog\/([a-z0-9-]+)\/$/)
  if (post) {
    const p = await getPublishedPost(env.DB, post[1])
    if (!p) return notFound
    return {
      head: postHead(origin, { ...p, categoryLabel: p.category.label, categorySlug: p.category.slug }),
      status: 200,
      data: { [apiPaths.post(p.slug)]: p },
    }
  }
  if (path === '/advokatska-tarifa/') return { head: tariffHead(origin), status: 200, data: {} }
  if (path === '/admin/') return { head: adminHead(), status: 200, data: {} }

  const slug = path.slice(1, -1)
  const area = practiceAreaBySlug.get(slug)
  if (area) {
    const key = apiPaths.posts({ category: area.blogCategory, limit: 3 })
    return { head: practiceHead(origin, slug)!, status: 200, data: { [key]: await listPosts(env.DB, { category: area.blogCategory, limit: 3 }) } }
  }
  return notFound
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** JSON that is safe to place inside a <script> element. */
const LS = new RegExp(String.fromCharCode(0x2028), 'g')
const PS = new RegExp(String.fromCharCode(0x2029), 'g')
const scriptJson = (v: unknown) =>
  JSON.stringify(v).replace(/</g, '\\u003c').replace(LS, '\\u2028').replace(PS, '\\u2029')

function headTags(head: HeadData, origin: string): string {
  const abs = (p: string) => (/^https?:\/\//.test(p) ? p : origin + p)
  const canonical = abs(head.path)
  const tags = [
    `<link rel="canonical" href="${esc(canonical)}">`,
    `<meta property="og:type" content="${head.type}">`,
    `<meta property="og:locale" content="sr_RS">`,
    `<meta property="og:site_name" content="Advokatska kancelarija Vladić">`,
    `<meta property="og:title" content="${esc(head.title)}">`,
    `<meta property="og:description" content="${esc(head.description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(abs(head.image))}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ]
  if (head.noindex) tags.push('<meta name="robots" content="noindex, nofollow">')
  for (const ld of head.jsonLd) tags.push(`<script type="application/ld+json">${scriptJson(ld)}</script>`)
  return tags.join('\n    ')
}

const isLocal = (url: URL) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://www.youtube-nocookie.com',
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ')

async function renderPage(request: Request, env: Env, url: URL, page: Page): Promise<Response> {
  // Always fetch a fresh, unconditional copy of the SPA shell.
  const shell = await env.ASSETS.fetch(new Request(new URL('/', url), { method: 'GET' }))
  const origin = env.SITE_URL.replace(/\/$/, '')

  const rewritten = new HTMLRewriter()
    .on('title', { element: (el) => void el.setInnerContent(page.head.title) })
    .on('meta[name="description"]', { element: (el) => void el.setAttribute('content', page.head.description) })
    .on('head', { element: (el) => void el.append(headTags(page.head, origin), { html: true }) })
    .on('body', {
      element: (el) =>
        void el.append(`<script id="${INITIAL_DATA_ID}" type="application/json">${scriptJson(page.data)}</script>`, { html: true }),
    })
    .transform(shell)

  const headers = new Headers(rewritten.headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  headers.delete('ETag')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (!isLocal(url)) headers.set('Content-Security-Policy', CSP)
  if (page.head.noindex) headers.set('X-Robots-Tag', 'noindex')

  return new Response(request.method === 'HEAD' ? null : rewritten.body, { status: page.status, headers })
}

// ------------------------------------------------------------------ SEO files

async function sitemap(env: Env): Promise<Response> {
  const origin = env.SITE_URL.replace(/\/$/, '')
  const posts = await sitemapEntries(env.DB)
  const urls: { loc: string; lastmod?: string }[] = [
    { loc: '/' },
    ...practiceAreas.map((a) => ({ loc: `/${a.slug}/` })),
    { loc: '/advokatska-tarifa/' },
    { loc: '/blog/' },
    ...posts.map((p) => ({ loc: `/blog/${p.slug}/`, lastmod: p.updated_at.slice(0, 10) })),
  ]
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${esc(origin + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n'
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}

function robots(env: Env): Response {
  const origin = env.SITE_URL.replace(/\/$/, '')
  const body = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
}
