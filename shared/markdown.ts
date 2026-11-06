import GithubSlugger from 'github-slugger'
import { Marked, type Tokens } from 'marked'
import type { TocItem } from './types'

export interface RenderedMarkdown {
  html: string
  /** Second-level headings, in order – used for the article table of contents. */
  toc: TocItem[]
}

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')

const decodeEntities = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const isExternal = (href: string) => /^https?:\/\//i.test(href)

/**
 * Renders a post body. Headings get GitHub-style ids (same scheme as the original
 * site, so existing #anchors keep working) and external links open in a new tab.
 */
export function renderMarkdown(md: string): RenderedMarkdown {
  const slugger = new GithubSlugger()
  const toc: TocItem[] = []

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, { tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens)
        const text = decodeEntities(stripTags(inner)).trim()
        const id = slugger.slug(text)
        if (depth === 2) toc.push({ id, text })
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`
      },
      link(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, { href, title, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens)
        const t = title ? ` title="${title.replace(/"/g, '&quot;')}"` : ''
        const ext = isExternal(href) ? ' target="_blank" rel="noopener"' : ''
        return `<a href="${href.replace(/"/g, '%22')}"${t}${ext}>${inner}</a>`
      },
    },
  })

  const html = marked.parse(md, { async: false }) as string
  return { html, toc }
}

/** ~200 words per minute, never less than one minute. */
export function readingMinutes(md: string): number {
  const words = md
    .replace(/[#>*_`[\]()!|-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
