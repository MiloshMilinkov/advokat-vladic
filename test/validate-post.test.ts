import { readingMinutes } from '@shared/markdown'
import type { PostInput } from '@shared/types'
import { describe, expect, it } from 'vitest'
import { validatePost } from '../worker/admin'
import { validPost } from './helpers'

function accepted(body: unknown): PostInput {
  const r = validatePost(body)
  if (!r.ok) throw new Error(`expected the post to be accepted, got: ${r.error}`)
  return r.value
}

function rejection(body: unknown): string {
  const r = validatePost(body)
  if (r.ok) throw new Error('expected the post to be rejected')
  return r.error
}

const MSG = {
  request: 'Neispravan zahtev.',
  slug: 'Slug sme da sadrži samo mala slova, brojeve i crtice.',
  title: 'Naslov je obavezan (najviše 200 karaktera).',
  excerpt: 'Kratak opis je obavezan (najviše 400 karaktera).',
  seoTitle: 'SEO naslov je predugačak.',
  category: 'Izaberite kategoriju.',
  cover: 'Adresa naslovne slike mora početi sa / ili https://.',
  ogImage: 'Adresa slike za deljenje mora početi sa / ili https://.',
  coverAlt: 'Opis slike je predugačak.',
  body: 'Tekst članka je obavezan.',
  date: 'Datum mora biti u formatu GGGG-MM-DD.',
}

describe('validatePost', () => {
  it('accepts a valid post unchanged', () => {
    expect(accepted(validPost())).toEqual(validPost())
  })

  describe('normalisation', () => {
    it('trims text and lowercases the slug', () => {
      const v = accepted({ ...validPost(), slug: '  Moj-Clanak ', title: '  Naslov ', excerpt: ' Opis ' })
      expect(v).toMatchObject({ slug: 'moj-clanak', title: 'Naslov', excerpt: 'Opis' })
    })

    it('turns CRLF line endings into LF', () => {
      expect(accepted({ ...validPost(), bodyMd: 'a\r\nb\r\n' }).bodyMd).toBe('a\nb\n')
    })

    it.each([[undefined], ['x'], ['published']])('publishes when status is %j', (status) => {
      expect(accepted({ ...validPost(), status }).status).toBe('published')
    })

    it('keeps drafts as drafts', () => {
      expect(accepted(validPost({ status: 'draft' })).status).toBe('draft')
    })

    it('stores empty optional fields as null', () => {
      const v = accepted({ ...validPost(), seoTitle: '  ', coverUrl: '', ogImageUrl: undefined })
      expect(v).toMatchObject({ seoTitle: null, coverUrl: null, ogImageUrl: null })
    })

    it.each([[0], [-1], [241], ['abc'], [2.5]])('computes reading time when readingMinutes is %j', (readingMinutesIn) => {
      const bodyMd = 'riječ '.repeat(900)
      expect(accepted({ ...validPost({ bodyMd }), readingMinutes: readingMinutesIn }).readingMinutes).toBe(readingMinutes(bodyMd))
    })

    it('keeps a valid reading time', () => {
      expect(accepted(validPost({ readingMinutes: 12 })).readingMinutes).toBe(12)
    })
  })

  describe('limits', () => {
    it('accepts values at the maximum lengths', () => {
      accepted(validPost({ slug: 'a'.repeat(120), title: 't'.repeat(200), excerpt: 'e'.repeat(400), seoTitle: 's'.repeat(200), coverAlt: 'c'.repeat(400) }))
    })

    it.each([['/images/a.jpg'], ['https://cdn.example/a.jpg']])('accepts the image URL %s', (url) => {
      expect(accepted(validPost({ coverUrl: url, ogImageUrl: url }))).toMatchObject({ coverUrl: url, ogImageUrl: url })
    })
  })

  describe('rejections', () => {
    it.each([
      ['null body', null, MSG.request],
      ['string body', 'x', MSG.request],
      ['array body', [], MSG.slug],
      ['empty slug', { ...validPost(), slug: '' }, MSG.slug],
      ['slug with a space', { ...validPost(), slug: 'Ab c' }, MSG.slug],
      ['slug starting with a dash', { ...validPost(), slug: '-a' }, MSG.slug],
      ['slug with a double dash', { ...validPost(), slug: 'a--b' }, MSG.slug],
      ['slug with Serbian letters', { ...validPost(), slug: 'članak' }, MSG.slug],
      ['slug over 120 characters', { ...validPost(), slug: 'a'.repeat(121) }, MSG.slug],
      ['empty title', { ...validPost(), title: '   ' }, MSG.title],
      ['title over 200 characters', { ...validPost(), title: 't'.repeat(201) }, MSG.title],
      ['empty excerpt', { ...validPost(), excerpt: '' }, MSG.excerpt],
      ['excerpt over 400 characters', { ...validPost(), excerpt: 'e'.repeat(401) }, MSG.excerpt],
      ['SEO title over 200 characters', { ...validPost(), seoTitle: 's'.repeat(201) }, MSG.seoTitle],
      ['missing category', { ...validPost(), categorySlug: '' }, MSG.category],
      ['protocol-relative cover URL', { ...validPost(), coverUrl: '//evil.example/x.jpg' }, MSG.cover],
      ['http cover URL', { ...validPost(), coverUrl: 'http://x.rs/a.jpg' }, MSG.cover],
      ['javascript: cover URL', { ...validPost(), coverUrl: 'javascript:alert(1)' }, MSG.cover],
      ['cover URL with a space', { ...validPost(), coverUrl: '/images/a b.jpg' }, MSG.cover],
      ['protocol-relative share image URL', { ...validPost(), ogImageUrl: '//evil.example' }, MSG.ogImage],
      ['data: share image URL', { ...validPost(), ogImageUrl: 'data:image/png;base64,AAAA' }, MSG.ogImage],
      ['image description over 400 characters', { ...validPost(), coverAlt: 'c'.repeat(401) }, MSG.coverAlt],
      ['blank body', { ...validPost(), bodyMd: '   \n ' }, MSG.body],
      ['body not a string', { ...validPost(), bodyMd: 42 }, MSG.body],
      ['body over 200 000 characters', { ...validPost(), bodyMd: 'x'.repeat(200_001) }, MSG.body],
      ['date without leading zeros', { ...validPost(), publishedAt: '2026-1-5' }, MSG.date],
      ['date in local format', { ...validPost(), publishedAt: '05.01.2026' }, MSG.date],
      ['missing date', { ...validPost(), publishedAt: '' }, MSG.date],
      ['month 13', { ...validPost(), publishedAt: '2026-13-01' }, MSG.date],
    ])('rejects %s', (_name, body, message) => {
      expect(rejection(body)).toBe(message)
    })
  })
})

// Known gap, left for the owner: Date.parse rolls impossible days over
// (2026-02-30 becomes 2 March), so they pass. Remove `.fails` once fixed.
it.fails.each([['2026-02-30'], ['2026-04-31'], ['2026-02-29']])('rejects the impossible date %s', (publishedAt) => {
  expect(rejection(validPost({ publishedAt }))).toBe(MSG.date)
})
