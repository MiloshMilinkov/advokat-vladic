# Advokatska kancelarija Vladić – website

> **© 2026 Miloš Milinkov. All rights reserved.** This repository is public for viewing only.
> It is **not** open source: you may not copy, reuse, modify, deploy or redistribute any part of it,
> including the design and content. See [LICENSE](LICENSE).

Vue 3 + TypeScript + Vite rebuild of the law office site, served by a Cloudflare
Worker with the blog stored in **Cloudflare D1** (SQLite).

## What's inside

| Path | Purpose |
| --- | --- |
| `src/` | Vue SPA – pages, components, styles (ported 1:1 from the original design) |
| `src/pages/admin/` | `/admin/` blog editor (Markdown with live preview), lazy-loaded |
| `worker/` | Cloudflare Worker: JSON API, admin API, sitemap/robots, per-page SEO tags |
| `shared/` | Code used by both sides: site data, practice areas, `<head>` builder, Markdown renderer |
| `migrations/` | D1 schema |
| `seed/posts/*.md` | The 11 original articles as Markdown with frontmatter (`npm run db:seed:build` → `seed/seed.sql`) |
| `public/images/` | Optimised images; `placeholders/` holds stand-ins for the personal photos |

### How it differs from a plain SPA

* The Worker answers every page request: it injects the right `<title>`, description,
  canonical URL, Open Graph tags and JSON-LD (LegalService, Service, BlogPosting,
  BreadcrumbList), and inlines the page's API data, so the first view needs no extra
  request and link previews/crawlers see real metadata.
* Pages are **server-rendered**: the Worker renders the Vue app (`src/entry-server.ts`,
  imported as `@app-ssr`) into the HTML, and the browser hydrates it with the same
  inlined data. Crawlers without JavaScript see the full text, headings and links.
  `/admin/` stays browser-only. If a server render ever fails, the page falls back to
  rendering in the browser.
* The stylesheet is inlined into each page and the Inter font is subset to the
  characters the site uses (`src/assets/fonts/`, Latin + Serbian letters, wght 300–600).
* Unknown URLs return a real `404`; URLs without a trailing slash redirect (`301`)
  to the same scheme as the original site.
* `/sitemap.xml` is generated from the database, so new posts are included automatically.

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_TOKEN to any long random string
npm run db:setup:local           # build seed, apply migrations, load posts
npm run dev                      # http://localhost:5173 (Vite + Worker + local D1)
```

Admin: open `/admin/` and enter the `ADMIN_TOKEN`.

## Deploying to Cloudflare

```bash
npx wrangler login
npx wrangler d1 create advokat-vladic        # put the printed database_id in wrangler.jsonc
npm run db:migrate:remote
npm run db:seed:remote
npx wrangler secret put ADMIN_TOKEN
npm run deploy
```

`SITE_URL` in `wrangler.jsonc` is the canonical origin used in SEO tags and the sitemap
(`https://advokatvladic.rs`).

## Replacing the placeholder photos

Personal photos are placeholders: `public/images/placeholders/portrait.svg` (about section,
4:5) and `avatar.svg` (small round avatar). Drop in real images and update the paths in
`src/lib/images.ts`.

## Contact form

Without configuration the form opens the visitor's e-mail client addressed to the office
(same as the original site). Set `VITE_CONTACT_ENDPOINT` (e.g. a Formspree URL) at build
time to post submissions instead.

## License

Proprietary — all rights reserved. No permission is granted to use, copy, modify, deploy or
distribute this code or its content. See [LICENSE](LICENSE). Security issues: see [SECURITY.md](SECURITY.md).
