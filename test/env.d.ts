// Bindings the test runtime provides (see vitest.config.ts). ASSETS is not a
// binding in tests: helpers.ts passes a stub to the Worker instead.
declare namespace Cloudflare {
  interface Env extends Omit<import('../worker/http').Env, 'ASSETS'> {
    TEST_MIGRATIONS: import('cloudflare:test').D1Migration[]
  }
}

declare module '*?raw' {
  const content: string
  export default content
}
