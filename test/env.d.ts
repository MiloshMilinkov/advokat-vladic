// Bindings the test runtime provides (see vitest.config.ts). Errors in this file
// are hidden by skipLibCheck, so a broken declaration shows up as missing env fields.
declare namespace Cloudflare {
  type WorkerEnv = import('../worker/http').Env
  interface Env extends WorkerEnv {
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[]
  }
}
