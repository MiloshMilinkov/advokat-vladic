# Worker Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `npm test`, a Vitest suite that runs inside workerd and covers the admin token, blog validation, D1 queries and server-rendered page status codes.

**Architecture:** `@cloudflare/vitest-plugin` runs the tests in workerd with a local in-memory D1 (Miniflare options only, no `wrangler.configPath`). Tests import `worker/index.ts` and call its `fetch` handler directly with the test `env` plus a stub `ASSETS`; `db.ts` and `validatePost` are tested as plain functions.

**Tech Stack:** Vitest 5, `@cloudflare/vitest-plugin` 1.9.x, `@vitejs/plugin-vue`, TypeScript 6, D1 (Miniflare).

**Spec:** `docs/superpowers/specs/2026-11-27-worker-test-suite-design.md`

## Global Constraints

- Never touch production: no `--remote`, no production D1 id in test config, no `wrangler deploy`, no `db:*:remote` scripts.
- No changes to `worker/`, `shared/` or `src/`. A failing test that exposes a real bug is reported in `## Review` and left for the owner's OK; the test is marked `it.fails` with a comment, or skipped with a reason.
- Fake token only: `TEST_TOKEN = 'test-admin-token-not-a-real-secret'`. Never read `.dev.vars` or `.admin-token.txt`.
- Branch: `test/worker-suite` from `main`, created in place (no other session works in this repo). Commit per task. Do not push until the owner says so.
- `package.json` `allowScripts` must list the workerd version the plugin installs (`workerd@1.20261123.1` at time of writing; use whatever `npm ls workerd` shows).

## Review Focus

1. Server render throws inside workerd: the page still returns 200 with an empty `#app`. Page tests must fail in that case (Task 5, sanity step).
2. Auth bypass by header shape: `Bearer` with an empty token, `bearer` lowercase, `Basic`, extra spaces, token as a prefix of the real one. All must be 401 (Task 3).
3. `ADMIN_TOKEN` unset or empty string in an environment: every admin route returns 503, never 200 (Task 3).
4. Invalid edit body on an existing post: 400, and the stored row is unchanged (Task 4).
5. A draft post leaking through any public path: `/api/posts`, `/api/posts/:slug`, `/blog/:slug/`, `/api/categories` counts, `/sitemap.xml` (Tasks 4 and 5).

---

### Task 1: Test harness

**Files:**
- Modify: `package.json` (scripts `test`, `test:watch`; devDependencies; `allowScripts`), `tsconfig.json` (add reference)
- Create: `vitest.config.ts`, `tsconfig.test.json`, `test/env.d.ts`, `test/setup.ts`, `test/helpers.ts`, `test/harness.test.ts`

**Interfaces:**
- Produces (`test/helpers.ts`):
  - `TEST_TOKEN: string`
  - `SLUGS = { first: 'prvi-clanak', second: 'drugi-clanak', family: 'treci-clanak', draft: 'nacrt-clanka' } as const`
  - `resetDb(): Promise<void>`: deletes all posts and categories, inserts the fixtures below (one `env.DB.batch`)
  - `testEnv(overrides?: Partial<Env>): Env`: test `env` from `cloudflare:workers` with `ASSETS` replaced by the stub
  - `call(path: string, init?: RequestInit, opts?: { origin?: string; env?: Partial<Env> }): Promise<Response>`: builds `new Request(origin + path, init)` (default origin `http://localhost`) and calls `worker.fetch(request, testEnv(opts.env), createExecutionContext())`
  - `admin(path: string, opts?: { method?: string; body?: unknown; token?: string | null; rawBody?: string }): Promise<Response>`: `call` with `Authorization: Bearer <token>` (default `TEST_TOKEN`, `null` sends no header) and a JSON body
  - `validPost(overrides?: Partial<PostInput>): PostInput`
  - `appHtml(html: string): string`: the markup between `<div id="app">` and the `__INITIAL_DATA__` script
- Fixtures (`resetDb`): categories `radno-pravo` "Radno pravo" (0), `porodicno-pravo` "Porodično i nasledno pravo" (1), `upravno-pravo` "Upravno pravo" (2, no posts). Posts: `prvi-clanak` "Prvi članak" radno-pravo published 2026-01-10; `drugi-clanak` "Drugi članak" radno-pravo published 2026-03-05; `treci-clanak` "Treći članak" porodicno-pravo published 2026-02-01; `nacrt-clanka` "Nacrt članka" radno-pravo **draft** 2026-04-01. Each has a short Markdown body with one `## Heading`, and `created_at` = `updated_at` = `'2026-01-01T00:00:00Z'` so an edit always changes `updated_at` (the column default is "now" to the second, which would make that check flaky).
- `validPost()` defaults: slug `'test-clanak'`, title `'Test članak'`, excerpt `'Kratak opis.'`, categorySlug `'radno-pravo'`, bodyMd `'## Uvod\n\nTekst.'`, publishedAt `'2026-05-01'`, status `'published'`, readingMinutes `3`, the optional fields `null` or `''`.

- [ ] **Step 1: Branch and install**

```bash
git switch -c test/worker-suite
npm install -D vitest@^5 @cloudflare/vitest-plugin@^1.9
npm ls workerd
```
Add the workerd version `npm ls` shows to `allowScripts`, then `npm install` again. Expected: no install-script errors.

- [ ] **Step 2: Write `vitest.config.ts`**

Plugins: `vue()` and `cloudflareTest(async () => ({ miniflare: { compatibilityDate, compatibilityFlags, d1Databases: { DB: 'advokat-vladic-test' }, bindings: { SITE_URL: 'https://advokatvladic.rs', ADMIN_TOKEN: TEST_TOKEN, TEST_MIGRATIONS: await readD1Migrations('migrations') } } }))`. Read `compatibility_date` and `compatibility_flags` from `wrangler.jsonc` (for example with wrangler's `unstable_readConfig`, or a JSONC parse) so they cannot drift. Aliases `@`, `@shared`, `@app-ssr` as in `vite.config.ts`. `test.include: ['test/**/*.test.ts']`, `test.setupFiles: ['test/setup.ts']`. Do not add `@cloudflare/vite-plugin`. Import `TEST_TOKEN` from a tiny module both sides can load, or repeat the literal with a comment.

- [ ] **Step 3: Types**

`test/env.d.ts`: augment `Cloudflare.Env` with the worker's `Env` fields minus `ASSETS`, plus `TEST_MIGRATIONS: D1Migration[]`. `tsconfig.test.json`: like `tsconfig.worker.json` but `include: ["test/**/*.ts", "vitest.config.ts"]`, types `@cloudflare/workers-types` and `@cloudflare/vitest-plugin/types`, the `@shared/*` path, and its own `tsBuildInfoFile`. Add `{ "path": "./tsconfig.test.json" }` to `tsconfig.json`. If `vitest.config.ts` needs Node types, move it to `tsconfig.node.json` instead.

- [ ] **Step 4: Setup and helpers**

`test/setup.ts`: `await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)` at top level. `test/helpers.ts` as in Interfaces. The `ASSETS` stub: `fetch(input)` returns the repo `index.html` (imported `../index.html?raw`) with `Content-Type: text/html` for `/`, and the same HTML body with status 200 for any other path (the SPA fallback that `worker/index.ts` turns into a 404 for file-like paths).

- [ ] **Step 5: Smoke test** `test/harness.test.ts`

```ts
it('applies migrations and loads fixtures', async () => {
  await resetDb()
  const { results } = await env.DB.prepare('SELECT slug FROM posts ORDER BY slug').all<{ slug: string }>()
  expect(results.map((r) => r.slug)).toEqual(['drugi-clanak', 'nacrt-clanka', 'prvi-clanak', 'treci-clanak'])
})
```

- [ ] **Step 6: Run** `npm test` (expect 1 passing) and `npm run typecheck` (expect no errors). If storage turns out to be shared between test files, set `test.fileParallelism: false`.

- [ ] **Step 7: Commit** `test: add Vitest with the Cloudflare Workers plugin and a local D1 harness`

### Task 2: `validatePost` unit tests

**Files:** Create `test/validate-post.test.ts`

**Interfaces:** Consumes `validatePost` from `worker/admin.ts`, `validPost()` from helpers.

- [ ] **Step 1: Write the tests**
  - `accepts a valid post` and returns the normalised value.
  - Normalisation: slug `'  Moj-Clanak '` becomes `'moj-clanak'`; title and excerpt trimmed; `bodyMd` `'a\r\nb'` becomes `'a\nb'`; `status` missing or `'x'` becomes `'published'`, `'draft'` stays; empty `seoTitle`, `coverUrl`, `ogImageUrl` become `null`; `readingMinutes` `0`, `-1`, `241`, `'abc'` fall back to `readingMinutes(bodyMd)` from `@shared/markdown`, `12` stays.
  - Rejections, one `it.each` row each, asserting `ok: false` and the exact Serbian message from `worker/admin.ts`: body `null`, `'x'` (`'Neispravan zahtev.'`); body `[]`\*; slug `''`, `'Ab c'`, `'-a'`, `'a--b'`, 121 chars; title `''`, 201 chars; excerpt `''`, 401 chars; seoTitle 201 chars; categorySlug `''`; coverUrl `'//evil.example/x.jpg'`, `'http://x.rs/a.jpg'`, `'javascript:alert(1)'`, `'/images/a b.jpg'`; ogImageUrl `'//evil.example'`; coverAlt 401 chars; bodyMd `'   '`, 200 001 chars; publishedAt `'2026-1-5'`, `'05.01.2026'`, `''`.
  - Accepted URLs: `'/images/a.jpg'`, `'https://cdn.example/a.jpg'`.
  - \* An array passes the `typeof === 'object'` check and then fails on slug; assert whatever message it actually returns.
  - Date edge: `'2026-02-30'`. Run it and record the result. If it is accepted (V8 rolls the day over), keep the test pinning current behaviour and list it in `## Review` as a validation gap for the owner.
- [ ] **Step 2: Run** `npx vitest run test/validate-post.test.ts`. Expected: PASS.
- [ ] **Step 3: Commit** `test: cover blog post validation`

### Task 3: Admin token on every route

**Files:** Create `test/admin-auth.test.ts`

**Interfaces:** Consumes `admin`, `call`, `resetDb`, `TEST_TOKEN`, `validPost`.

Routes (`ROUTES`, used with `describe.each`): `GET /api/admin/session`, `GET /api/admin/categories`, `GET /api/admin/posts`, `POST /api/admin/posts`, `GET /api/admin/posts/1`, `PUT /api/admin/posts/1`, `DELETE /api/admin/posts/1`. POST and PUT send `validPost()`.

- [ ] **Step 1: Write the tests** (per route unless noted)
  - `rejects a missing token`: status 401, body `{ error: 'Neispravan pristupni ključ.' }`, `Cache-Control: no-store`.
  - `rejects a wrong token`: tokens `'wrong'`, `TEST_TOKEN + 'x'`, `TEST_TOKEN.slice(0, -1)` → 401.
  - `rejects other header shapes`: `Authorization` values `'Bearer '`, `'bearer ' + TEST_TOKEN`, `'Basic ' + TEST_TOKEN`, `TEST_TOKEN`, `'Bearer  ' + TEST_TOKEN` (two spaces) → 401.
  - `accepts the correct token`: session 204, categories 200, list 200, create 201, get/put/delete on a fixture id 200/200/204 (look the id up after `resetDb`, do not assume `1`).
  - `returns 503 when ADMIN_TOKEN is not set`: `env: { ADMIN_TOKEN: undefined }` and `''`, even with a token sent.
  - `never echoes the token`: for wrong-token and correct-token responses, `await res.text()` does not contain `TEST_TOKEN`.
  - Once: `checks auth before routing`: `PATCH /api/admin/posts` and `GET /api/admin/unknown` with no token → 401; with the token → 405.
  - Once: `a rejected request changes nothing`: wrong-token POST, PUT and DELETE leave `SELECT COUNT(*) FROM posts` and the fixture row unchanged.
- [ ] **Step 2: Run** `npx vitest run test/admin-auth.test.ts`. Expected: PASS.
- [ ] **Step 3: Sanity check** Temporarily make `authorized()` return `true`, rerun: the 401 tests must fail. Revert with `git checkout worker/admin.ts` and confirm `git diff worker/` is empty.
- [ ] **Step 4: Commit** `test: check the admin token on every admin route`

### Task 4: Admin API writes and D1 queries

**Files:** Create `test/admin-api.test.ts`, `test/db.test.ts`

**Interfaces:** Consumes `admin`, `resetDb`, `validPost`, `SLUGS`; functions from `worker/db.ts` with `env.DB`.

- [ ] **Step 1: `test/admin-api.test.ts`** (`beforeEach(resetDb)`)
  - `creates a post`: POST `validPost({ slug: 'novi-clanak' })` → 201, body has `id`, `slug`, `createdAt`; GET it back → same fields.
  - `rejects invalid create bodies without writing`: rows `{ ...validPost(), slug: 'Bad Slug' }`, `coverUrl: '//evil.example/a.jpg'`, `publishedAt: '2026/01/01'`, plus `rawBody: '{not json'` → 400 with an `error` string; post count unchanged.
  - `edits a post`: PUT a fixture id with a new title → 200, new title returned, `updatedAt` differs from the fixture's.
  - `rejects an invalid edit and keeps the row`: PUT with `title: ''` → 400; GET shows the original title and `updatedAt`.
  - `duplicate slug` on create and on edit → 409 `'Članak sa ovim slugom već postoji.'`.
  - `unknown category` → 400 `'Nepoznata kategorija.'` (fails if D1 foreign keys are off; then record it in Review).
  - Missing id: GET, PUT, DELETE `/api/admin/posts/999999` → 404. Non-numeric `/api/admin/posts/abc` → 405.
  - `deletes a post`: DELETE → 204, then GET → 404.
  - `lists drafts for the admin`: GET `/api/admin/posts` includes `nacrt-clanka`, and no item has `bodyMd`. GET `/api/admin/categories` includes `upravno-pravo` with `count: 0`.
- [ ] **Step 2: `test/db.test.ts`** (`beforeEach(resetDb)`)
  - `listPosts`: default returns `['drugi-clanak', 'treci-clanak', 'prvi-clanak']` (newest first, no draft); `{ category: 'radno-pravo' }` → `['drugi-clanak', 'prvi-clanak']`; `{ limit: 1 }` → 1 item; `{ limit: 0 }` → 1 item; `{ limit: 500 }` → all 3; summary has `category: { slug, label }`.
  - `getPublishedPost`: published slug returns `html` containing `<h2`, a non-empty `toc`, and `related` of up to 3 where the same-category post comes first and the post itself is absent; draft slug → `null`; unknown → `null`.
  - `listCategories` → `radno-pravo` count 2, `porodicno-pravo` count 1, no `upravno-pravo`, in `sort_order`. `listAllCategories` → all 3, `upravno-pravo` count 0.
  - `sitemapEntries` → the 3 published slugs, no draft.
  - `adminUpdatePost` / `adminDeletePost` on id `999999` → `false`.
- [ ] **Step 3: Run** `npx vitest run test/admin-api.test.ts test/db.test.ts`. Expected: PASS.
- [ ] **Step 4: Commit** `test: cover admin writes and D1 queries`

### Task 5: Pages, public API and SEO files

**Files:** Create `test/pages.test.ts`

**Interfaces:** Consumes `call`, `appHtml`, `resetDb`, `SLUGS`.

- [ ] **Step 1: Write the tests** (`beforeEach(resetDb)`)
  - 200 pages, `it.each`: `/`, `/blog/`, `/blog/drugi-clanak/`, `/advokat-za-radno-pravo/`, `/advokatska-tarifa/`. Each: status 200, `Content-Type` starts `text/html`, `appHtml()` is non-empty. The post page's `appHtml()` contains `Drugi članak`; `/blog/` contains all 3 published titles and not `Nacrt članka`.
  - 404 pages: `/blog/nacrt-clanka/`, `/blog/ne-postoji/`, `/ne-postoji/` → 404 with HTML and a non-empty `appHtml()`.
  - `/admin/` → 200, empty `appHtml()` (browser-only), `X-Robots-Tag: noindex`, and the robots noindex meta tag.
  - Redirects: `/blog` → 301, `Location: http://localhost/blog/`; `/blog?x=1` → `Location` ends `/blog/?x=1`.
  - `POST /` → 405 with `Allow: GET, HEAD`. `HEAD /blog/` → 200 with an empty body.
  - `/ne-postoji.png` → 404 (SPA fallback turned into a real 404).
  - Security headers: with `origin: 'https://advokatvladic.rs'`, `/` has `Content-Security-Policy` and `Strict-Transport-Security`; with the default localhost origin it has neither.
  - Public API: `/api/posts` 200 without the draft; `/api/posts/nacrt-clanka` 404; `/api/posts/drugi-clanak` 200; `/api/categories` 200; `POST /api/posts` 405; `/api/nope` 404.
  - `/sitemap.xml` 200 `application/xml`, contains `https://advokatvladic.rs/blog/drugi-clanak/`, not `nacrt-clanka`. `/robots.txt` 200, contains `Disallow: /admin/` and `Sitemap: https://advokatvladic.rs/sitemap.xml`.
- [ ] **Step 2: Run** `npx vitest run test/pages.test.ts`. Expected: PASS. If Vue's server renderer fails to load in workerd, fix it in `vitest.config.ts` (resolve conditions or `ssr.noExternal`), not in app code.
- [ ] **Step 3: Sanity check** Temporarily make `render()` in `src/entry-server.ts` throw, rerun: the `appHtml()` assertions must fail while the status checks still pass. Revert and confirm `git diff src/` is empty.
- [ ] **Step 4: Commit** `test: cover server-rendered pages, public API and SEO files`

### Task 6: Docs, review and hand-off

**Files:** Modify `CLAUDE.md`, `README.md`, this plan.

- [ ] **Step 1: `CLAUDE.md`** Add `npm test` and `npm run test:watch` to Commands. Replace "No tests or lint." with one line on what the suite covers and that it runs in workerd against an in-memory D1. Add gotchas: tests call `worker.fetch` directly with a stub `ASSETS` (built CSS inlining is not exercised); the test config uses Miniflare options, never `wrangler.configPath`, so the production D1 id and `.dev.vars` stay out; bumping `@cloudflare/vitest-plugin` may need a new `allowScripts` workerd entry.
- [ ] **Step 2: `README.md`** Add `## How it was built` above `## License`: built with Claude Code; links to `CLAUDE.md`, `docs/superpowers/`, and https://github.com/MiloshMilinkov/claude-workflow.
- [ ] **Step 3: Verify** `npm test`, `npm run typecheck`, `npm run build`. All pass. Run `npm test` twice to catch order dependence.
- [ ] **Step 4: Review** Run the `simplify` skill on the branch diff, then `code-review` at `medium`. Fix confirmed findings, rerun Step 3.
- [ ] **Step 5: Append `## Review`** to this plan: findings, what was fixed, what was skipped and why, gaps found in worker code (left for the owner), test and typecheck results. No secrets.
- [ ] **Step 6: Commit** `docs: list test commands, add How it was built, record review`. Ask the owner before pushing; after the push, check CI with `gh run list -L 3`.
