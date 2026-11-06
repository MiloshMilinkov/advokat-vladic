import { createApp, createSSRApp, type App as VueApp } from 'vue'
import type { Router, RouterHistory } from 'vue-router'
import App from './App.vue'
import { INITIAL_DATA, type InitialData } from './lib/initial-data'
import { createAppRouter } from './router'

export interface CreatedApp {
  app: VueApp
  router: Router
}

/**
 * Builds a fresh app instance. `ssr` is true both when rendering on the server and
 * when hydrating server-rendered HTML in the browser.
 */
export function createVueApp(opts: { ssr: boolean; history: RouterHistory; initialData: InitialData }): CreatedApp {
  const app = opts.ssr ? createSSRApp(App) : createApp(App)
  const router = createAppRouter(opts.history)
  app.use(router)
  app.provide(INITIAL_DATA, opts.initialData)
  return { app, router }
}
