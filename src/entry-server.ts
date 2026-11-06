// Server-side render entry, imported by the Worker (see worker/ssr.ts).
import { createMemoryHistory } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import { createVueApp } from './app'
import type { InitialData } from './lib/initial-data'

/** Renders the page at `url` (path + query) to HTML using the data the Worker loaded. */
export async function render(url: string, initialData: InitialData): Promise<string> {
  const { app, router } = createVueApp({ ssr: true, history: createMemoryHistory(), initialData })
  await router.push(url)
  await router.isReady()
  return renderToString(app)
}
