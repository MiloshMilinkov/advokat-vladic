// Builds <head> metadata for every route. The Worker renders it into the HTML it
// serves (so crawlers and link previews see real tags without running JS) and the
// SPA applies the same data on client-side navigation.

import { practiceAreaBySlug, practiceAreas } from './practice-areas'
import { postTitle, site, staticPages } from './site'

export interface HeadData {
  title: string
  description: string
  /** Path relative to the site origin, with trailing slash. */
  path: string
  image: string
  type: 'website' | 'article'
  noindex?: boolean
  jsonLd: Record<string, unknown>[]
}

export interface PostHeadInput {
  slug: string
  title: string
  seoTitle?: string | null
  excerpt: string
  publishedAt: string
  updatedAt?: string
  categoryLabel: string
  categorySlug: string
  ogImageUrl?: string | null
  coverUrl?: string | null
}

const abs = (origin: string, p: string) => (/^https?:\/\//.test(p) ? p : origin.replace(/\/$/, '') + p)

function legalService(origin: string, image: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: site.name,
    url: abs(origin, '/'),
    image: abs(origin, image),
    telephone: site.phoneE164,
    email: site.email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.streetAddress,
      addressLocality: site.city,
      postalCode: site.postalCode,
      addressCountry: 'RS',
    },
    geo: { '@type': 'GeoCoordinates', ...site.geo },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '19:00',
    },
    founder: { '@type': 'Person', name: site.lawyer, jobTitle: 'Advokat' },
    knowsAbout: practiceAreas.map((a) => a.name),
    sameAs: [site.socials.linkedin, site.socials.instagram, site.socials.facebook],
  }
}

function breadcrumbs(origin: string, items: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(origin, p) })),
  }
}

export function homeHead(origin: string): HeadData {
  const p = staticPages.home
  return { ...base(p), jsonLd: [legalService(origin, site.defaultOgImage)] }
}

export function blogIndexHead(origin: string): HeadData {
  const p = staticPages.blog
  return {
    ...base(p),
    jsonLd: [
      legalService(origin, site.defaultOgImage),
      { '@context': 'https://schema.org', ...breadcrumbs(origin, [['Početna', '/'], ['Blog', p.path]]) },
    ],
  }
}

export function tariffHead(origin: string): HeadData {
  const p = staticPages.tariff
  return {
    ...base(p),
    jsonLd: [
      legalService(origin, site.defaultOgImage),
      { '@context': 'https://schema.org', ...breadcrumbs(origin, [['Početna', '/'], ['Advokatska tarifa', p.path]]) },
    ],
  }
}

export function practiceHead(origin: string, slug: string): HeadData | null {
  const a = practiceAreaBySlug.get(slug)
  if (!a) return null
  const path = `/${a.slug}/`
  const image = `/images/oblasti/${a.slug}-800.webp`
  return {
    title: a.metaTitle,
    description: a.metaDescription,
    path,
    image,
    type: 'website',
    jsonLd: [
      legalService(origin, image),
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            name: a.title,
            serviceType: a.serviceType,
            description: a.serviceDescription,
            url: abs(origin, path),
            areaServed: [
              { '@type': 'City', name: 'Beograd' },
              { '@type': 'Country', name: 'Srbija' },
            ],
            provider: { '@type': 'LegalService', name: site.name, url: abs(origin, '/'), telephone: site.phoneE164 },
          },
          breadcrumbs(origin, [['Početna', '/'], ['Oblasti rada', '/#oblasti'], [a.name, path]]),
        ],
      },
    ],
  }
}

export function postHead(origin: string, p: PostHeadInput): HeadData {
  const path = `/blog/${p.slug}/`
  const image = p.ogImageUrl || p.coverUrl || site.defaultOgImage
  return {
    title: postTitle(p.title, p.seoTitle),
    description: p.excerpt,
    path,
    image,
    type: 'article',
    jsonLd: [
      legalService(origin, image),
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: p.title,
        description: p.excerpt,
        image: abs(origin, image),
        datePublished: p.publishedAt,
        ...(p.updatedAt ? { dateModified: p.updatedAt.slice(0, 10) } : {}),
        mainEntityOfPage: abs(origin, path),
        url: abs(origin, path),
        inLanguage: 'sr-Latn',
        articleSection: p.categoryLabel,
        author: { '@type': 'Person', name: site.lawyer, jobTitle: 'Advokat', url: abs(origin, '/') },
        publisher: { '@type': 'LegalService', name: site.name, url: abs(origin, '/') },
      },
      {
        '@context': 'https://schema.org',
        ...breadcrumbs(origin, [
          ['Početna', '/'],
          ['Blog', '/blog/'],
          [p.categoryLabel, `/blog/?oblast=${p.categorySlug}`],
          [p.title, path],
        ]),
      },
    ],
  }
}

export function notFoundHead(): HeadData {
  return { ...base(staticPages.notFound), noindex: true, jsonLd: [] }
}

export function adminHead(): HeadData {
  return { ...base(staticPages.admin), noindex: true, jsonLd: [] }
}

function base(p: { path: string; title: string; description: string }) {
  return { title: p.title, description: p.description, path: p.path, image: site.defaultOgImage, type: 'website' as const }
}
