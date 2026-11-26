# Worker test suite: design

Date: 2026-11-27. Size: small change (short design).

## Why

A new global rule says every project with a backend, admin area, auth or a database needs `test` and `typecheck` scripts before new features are built. This site has all four (Cloudflare Worker, D1 blog, `/admin/` editor behind a bearer token) and only `typecheck`. The risky code is small and server-side: `worker/admin.ts` (token check, validation), `worker/db.ts` (D1 queries) and `worker/index.ts` (routing, server-rendered pages, status codes). A test suite there guards the client's live site against regressions in future work.

## Goals

- `npm test` runs a Vitest suite locally (Windows) and in CI (Linux, the shared `node-ci.yml` already calls `test` once it exists).
- Cover the four risky areas:
  1. **Admin token**: missing, wrong and correct token on every admin route; also no `ADMIN_TOKEN` configured (503), wrong scheme (`Basic`, lowercase `bearer`), and auth checked before routing (bad token on an unknown route is 401, not 405). Responses never contain the token.
  2. **Blog create and edit validation**: `validatePost` as a pure unit (each rule, normalisation: trim, lowercase slug, CRLF to LF, default status, reading time fallback), plus the HTTP path: invalid body or bad JSON gives 400 and writes nothing; protocol-relative `//host`, `http:` and `javascript:` image URLs rejected.
  3. **D1 queries** against Miniflare's local in-memory D1 with the real `migrations/` applied: drafts never public, category filter, ordering, limit clamp, related posts, category counts, sitemap entries, create/update/delete, duplicate slug (409), unknown category (400), missing id (404), `updated_at` bumped on edit.
  4. **Server-rendered pages**: `/`, `/blog/`, a published post, a practice-area page, `/advokatska-tarifa/`, `/admin/` (noindex) return 200; draft or unknown post and unknown URL return 404; no trailing slash returns 301 (query kept); POST to a page returns 405; missing static file returns 404; `/sitemap.xml` and `/robots.txt` return 200 with the right content; CSP and HSTS set on non-local hosts.
- `npm run typecheck` also type-checks the tests.
- `CLAUDE.md` lists the test commands and the test gotchas; README gets the "How it was built" section the global rules ask for.

## Non-goals

- Tests for the Vue components, the browser-only admin editor or the contact form.
- Browser end-to-end tests, coverage thresholds, a lint script.
- Refactoring worker code for testability.

## Anti-goals (a failure even if green)

- Anything that can reach production D1 or deploy. Tests never use the production database id, never run `--remote`, and CI has no Cloudflare credentials.
- Page tests that pass while server rendering silently fails. `renderApp` catches errors and serves an empty `#app` with status 200, so page tests must assert server-rendered content (for example the post title inside `#app`), not just the status.
- Tests that depend on the developer's `.dev.vars` or real admin token. The suite uses a fixed fake token so local and CI behave the same.
- Flaky or order-dependent tests.

## Constraints

- The worker uses workerd-only APIs: `crypto.subtle.timingSafeEqual` and `HTMLRewriter`. Plain Node Vitest has neither, so tests must run inside workerd.
- `@cloudflare/vitest-pool-workers` (named in the task) is deprecated; its README says it was renamed `@cloudflare/vitest-plugin` (1.9.2, peer `vitest ^4.1 || ^5`). Vitest 5 supports the project's Vite 8.
- The plugin pins its own Miniflare and workerd (1.20261123.1). `package.json` `allowScripts` lists workerd versions by number, so the new one needs an entry or install fails.
- No worker behaviour changes in this work. If a test exposes a real bug or validation gap, it is reported in the plan's Review section and fixed only with the owner's OK.

## Approaches

1. **Cloudflare Vitest plugin, worker handler called directly (chosen).** Tests run inside workerd with a local in-memory D1. The plugin is configured with Miniflare options only (compatibility date and flags taken from `wrangler.jsonc`, a local D1 binding, a fake `ADMIN_TOKEN`, `SITE_URL`, and the migrations as a binding), not with `wrangler.configPath`. That keeps the production D1 id and `.dev.vars` out of the test runtime. Tests import `worker/index.ts` and call `worker.fetch(request, env)` with a stub `ASSETS` that serves the repo's `index.html` (imported with `?raw`) for `/` and an HTML fallback for anything else, matching `not_found_handling: single-page-application`. `db.ts` and `validatePost` are imported and tested as plain functions.
2. **Plain Node Vitest driving the built worker through the Miniflare API.** Needs `vite build` before every test run, tests only the bundle over HTTP, and still needs Miniflare. Slower and coarser; rejected.
3. **Plain Node Vitest with a SQLite fake for D1.** Node lacks the workerd APIs above, and a fake drifts from D1 (foreign keys, `RETURNING`, `meta.changes`). Rejected.

## Design

- New dev dependencies: `vitest` (5.x) and `@cloudflare/vitest-plugin`. Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
- `vitest.config.ts`: the Vue plugin (pages render `.vue` files), the same `@`, `@shared` and `@app-ssr` aliases as `vite.config.ts`, and `cloudflareTest({ miniflare: … })`. Not the `@cloudflare/vite-plugin`, which is for dev and build.
- `test/` folder: a setup file that applies the D1 migrations, shared fixtures (two or three categories, published and draft posts across categories and dates, an admin `fetch` helper, the `ASSETS` stub), and one file per area: `validate-post`, `admin-auth`, `admin-api`, `db`, `pages`.
- `tsconfig.test.json` covering `test/` with the workerd and plugin types, added to the `tsconfig.json` references so `vue-tsc -b` checks it.
- Tests create their own rows with unique slugs so they hold whether storage is isolated per test or per file.

## Left to the builder

- Exact fixture content, test names, and how the compatibility settings are read from `wrangler.jsonc`.
- Resolver tweaks if Vue's server renderer needs them inside workerd.
- Whether `/api/posts` (public API) gets a few status tests alongside the pages; cheap, so yes unless it bloats the suite.
