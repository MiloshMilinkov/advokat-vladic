import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'

// The real schema from migrations/, applied to the local in-memory D1.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
