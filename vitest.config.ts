import { fileURLToPath, URL } from 'node:url'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { unstable_readConfig } from 'wrangler'
import { TEST_TOKEN } from './test/token.ts'

// Tests run inside workerd with a local, in-memory D1. The Worker is configured
// from Miniflare options only (never `wrangler.configPath`), so the production
// D1 id and the developer's .dev.vars never reach the test runtime.
const wrangler = unstable_readConfig({ config: 'wrangler.jsonc' }, { hideWarnings: true })
const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    cloudflareTest(async () => ({
      miniflare: {
        compatibilityDate: wrangler.compatibility_date,
        compatibilityFlags: wrangler.compatibility_flags,
        d1Databases: { DB: 'advokat-vladic-test' },
        bindings: {
          SITE_URL: 'https://advokatvladic.rs',
          ADMIN_TOKEN: TEST_TOKEN,
          TEST_MIGRATIONS: await readD1Migrations(path('./migrations')),
        },
      },
    })),
  ],
  resolve: {
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
