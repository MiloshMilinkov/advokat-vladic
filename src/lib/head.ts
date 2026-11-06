import type { HeadData } from '@shared/head'

/**
 * Canonical origin. The Worker renders the canonical link on first load, so we
 * reuse its origin; locally (Vite without Worker HTML) fall back to production.
 */
export const siteOrigin: string = (() => {
  const href = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
  try {
    return href ? new URL(href).origin : 'https://advokatvladic.rs'
  } catch {
    return 'https://advokatvladic.rs'
  }
})()

function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

const meta = (key: 'name' | 'property', name: string) => () => {
  const m = document.createElement('meta')
  m.setAttribute(key, name)
  return m
}

/** Applies route metadata on client-side navigation (first load is server-rendered). */
export function applyHead(head: HeadData) {
  const abs = (p: string) => (/^https?:\/\//.test(p) ? p : siteOrigin + p)
  document.title = head.title
  upsert('meta[name="description"]', meta('name', 'description'), 'content', head.description)
  upsert(
    'link[rel="canonical"]',
    () => {
      const l = document.createElement('link')
      l.rel = 'canonical'
      return l
    },
    'href',
    abs(head.path),
  )
  upsert('meta[property="og:title"]', meta('property', 'og:title'), 'content', head.title)
  upsert('meta[property="og:description"]', meta('property', 'og:description'), 'content', head.description)
  upsert('meta[property="og:url"]', meta('property', 'og:url'), 'content', abs(head.path))
  upsert('meta[property="og:image"]', meta('property', 'og:image'), 'content', abs(head.image))
  upsert('meta[property="og:type"]', meta('property', 'og:type'), 'content', head.type)

  const robots = document.head.querySelector('meta[name="robots"]')
  if (head.noindex) upsert('meta[name="robots"]', meta('name', 'robots'), 'content', 'noindex, nofollow')
  else robots?.remove()

  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove())
  for (const ld of head.jsonLd) {
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.textContent = JSON.stringify(ld)
    document.head.appendChild(s)
  }
}
