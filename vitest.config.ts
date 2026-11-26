import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { SITE_URL, TEST_TOKEN } from './test/fixtures.ts'

// Tests run inside workerd with a local, in-memory D1. The Worker is configured
// from Miniflare options only (never `wrangler.configPath`), so the production
// D1 id and the developer's .dev.vars never reach the test runtime.
const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/** wrangler.jsonc without comments and trailing commas (importing wrangler costs ~1 s). */
const wrangler = JSON.parse(
  readFileSync(path('./wrangler.jsonc'), 'utf8')
    .replace(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (_m, str: string | undefined) => str ?? '')
    .replace(/("(?:\\.|[^"\\])*")|,(?=\s*[}\]])/g, (_m, str: string | undefined) => str ?? ''),
) as { compatibility_date: string; compatibility_flags?: string[] }

const shell = readFileSync(path('./index.html'), 'utf8')

export default defineConfig({
  plugins: [
    vue(),
    cloudflareTest(async () => ({
      miniflare: {
        compatibilityDate: wrangler.compatibility_date,
        compatibilityFlags: wrangler.compatibility_flags,
        d1Databases: { DB: 'advokat-vladic-test' },
        // The SPA shell for every path, like `not_found_handling: "single-page-application"`.
        serviceBindings: {
          ASSETS: async () => new Response(shell, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
        },
        bindings: {
          SITE_URL,
          ADMIN_TOKEN: TEST_TOKEN,
          TEST_MIGRATIONS: await readD1Migrations(path('./migrations')),
        },
      },
    })),
  ],
  resolve: {
    // Same aliases as vite.config.ts (not imported: it would load the Cloudflare Vite plugin).
    alias: {
      '@': path('./src'),
      '@shared': path('./shared'),
      '@app-ssr': path('./src/entry-server.ts'),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
  },
})
