# Advokatska kancelarija Vladić (client site)

Website for a law office in Belgrade (lawyer Nenad Vladić). Vue 3 SPA, server-rendered by a Cloudflare Worker, with the blog stored in Cloudflare D1. The site text is in Serbian (Latin script). Proprietary and view only (see `LICENSE`). The client's name, texts and branding belong to the client.

- Live: https://advokat-vladic.milos300399.workers.dev (canonical origin in SEO tags: `SITE_URL` = https://advokatvladic.rs)
- Repo: https://github.com/MiloshMilinkov/advokat-vladic (public, view-only licence)

## Commands

```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_TOKEN to any long random string
npm run db:setup:local           # build seed/seed.sql from seed/posts, apply migrations, load posts
npm run dev                      # Vite + Worker + local D1 on http://localhost:5173 (.claude/launch.json "dev")
npm test                         # Vitest in workerd: admin token, validation, D1 queries, pages
npm run test:watch               # same, re-runs on change
npm run typecheck                # vue-tsc -b (app, node, worker and test projects)
npm run build                    # typecheck, then vite build
npm run deploy                   # build, then wrangler deploy
npm run db:migrate:remote        # apply new migrations to the production D1
```

No lint. Tests cover the Worker only (see Tests). Verify UI changes in the browser at desktop and 375px width (no console errors, no horizontal scroll), and check the server-rendered HTML with JavaScript off for SEO-relevant changes.

## Stack

Vue 3, Vue Router, TypeScript, Vite with `@cloudflare/vite-plugin`, Cloudflare Workers with static assets, D1 (SQLite), `marked` for Markdown. Tests: Vitest with `@cloudflare/vitest-plugin`.

## Layout

- `src/`: Vue app. `pages/` (Home, Practice, Tariff, BlogIndex, BlogPost, NotFound), `components/home/` (homepage sections), `data/` (page content), `lib/` (API, head, images, reveal), `entry-server.ts` (SSR entry, imported by the Worker as `@app-ssr`)
- `src/pages/admin/`: `/admin/` blog editor (Markdown with live preview), lazy-loaded, browser-only
- `worker/`: `index.ts` (routing, SSR, per-page SEO tags and JSON-LD, inlined page data, sitemap and robots, security headers), `admin.ts` (admin API), `db.ts` (D1 queries), `http.ts` (env types, responses)
- `shared/`: used by both sides. `site.ts` (contact details and page metadata), `practice-areas.ts`, `head.ts`, `markdown.ts`, `api-paths.ts`, `types.ts`
- `test/`: Worker tests. `fixtures.ts` (test data, no runtime imports), `helpers.ts` (`resetDb`, `call`, `admin`, `appHtml`), `setup.ts` (applies migrations), one file per area
- `docs/superpowers/`: specs and plans, each plan ending with its review notes
- `migrations/`: D1 schema. `seed/posts/*.md`: the original articles with frontmatter. `scripts/build-seed.mjs` turns them into `seed/seed.sql`
- `public/images/`: optimised images. `placeholders/` holds stand-ins for the personal photos (paths in `src/lib/images.ts`)

## Rules and gotchas

- The Worker handles every page request (`run_worker_first` in `wrangler.jsonc`), except `/assets/*`, `/images/*` and the icons. A new static folder that should skip the Worker needs a `!/folder/*` entry there.
- Unknown URLs must return a real 404. URLs without a trailing slash 301 to the slash version, the same as the original site. Don't break existing URLs: they are indexed.
- Admin API (`/api/admin/*`) uses `Authorization: Bearer <ADMIN_TOKEN>`, checked in constant time (`worker/admin.ts`). Never log or return the token. In production it is a Wrangler secret (`wrangler secret put ADMIN_TOKEN`), never a `vars` entry.
- Image and link URLs saved from the admin must be site-relative (`/images/...`) or `https:`. Protocol-relative `//host` URLs are rejected. Keep it that way.
- If a server render fails, the page falls back to rendering in the browser. Keep SSR and the client using the same inlined data, or hydration mismatches.
- Contact details live only in `shared/site.ts`. The contact form opens the visitor's e-mail client unless `VITE_CONTACT_ENDPOINT` is set at build time.
- The Inter font is subset to the characters the site uses (`src/assets/fonts/inter-basic.woff2`, `inter-serbian.woff2`). New text with characters outside Latin and Serbian needs a new subset.
- Schema changes go in a new numbered file in `migrations/`. Never edit an applied one.
- Production D1 id is in `wrangler.jsonc`. `db:seed:remote` overwrites production posts, so never run it without the owner's OK.

## Tests

- `npm test` runs inside workerd (`@cloudflare/vitest-plugin`) against an in-memory D1 with `migrations/` applied. Tests call `resetDb()` before each test to load the fixtures in `test/helpers.ts`.
- `vitest.config.ts` configures the Worker with Miniflare options, never `wrangler.configPath`, so the production D1 id and `.dev.vars` stay out of tests. Keep it that way. The admin token in tests is the fake `TEST_TOKEN` (`test/fixtures.ts`).
- Tests call the Worker's `fetch` directly (so a test can override `ADMIN_TOKEN`). `ASSETS` is a Miniflare service binding that returns the source `index.html` for every path, so the built-CSS inlining is not covered.
- A failed server render still returns 200 with an empty `#app`, so page tests assert `appHtml()` content, not just the status.
- Known gap, pinned with `it.fails`: `validatePost` accepts impossible dates such as 2026-02-30.
- `@cloudflare/vitest-plugin` ships its own workerd. After bumping it, approve the new one with `npm install-scripts approve workerd@<version>`, then check `allowScripts` still lists wrangler's workerd (the command dropped it once).

## CI

`.github/workflows/ci.yml` calls the shared `node-ci.yml` in `MiloshMilinkov/.github`: it runs the `typecheck`, `lint`, `test` and `build` scripts that exist, plus a gitleaks scan. Check runs with `gh run list -L 3`. The deploy job stays off until the repo has the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets and `DEPLOY_FROM_CI=true`; until then deploy with `npm run deploy`.
