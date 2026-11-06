import { practiceAreas } from '@shared/practice-areas'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import BlogIndexPage from './pages/BlogIndexPage.vue'
import BlogPostPage from './pages/BlogPostPage.vue'
import HomePage from './pages/HomePage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import PracticePage from './pages/PracticePage.vue'
import TariffPage from './pages/TariffPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/blog/', name: 'blog', component: BlogIndexPage },
  { path: '/blog/:slug/', name: 'post', component: BlogPostPage, props: true },
  { path: '/advokatska-tarifa/', name: 'tariff', component: TariffPage },
  ...practiceAreas.map<RouteRecordRaw>((a) => ({
    path: `/${a.slug}/`,
    name: `area-${a.slug}`,
    component: PracticePage,
    props: { slug: a.slug },
  })),
  { path: '/admin/', name: 'admin', component: () => import('./pages/admin/AdminPage.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    // Same URL scheme as the server: add the trailing slash when that matches a page.
    beforeEnter(to) {
      if (!to.path.endsWith('/')) {
        const withSlash = router.resolve({ path: `${to.path}/`, query: to.query, hash: to.hash })
        if (withSlash.name !== 'not-found') return withSlash.fullPath
      }
    },
  },
]

const HEADER_OFFSET = 80

/** Waits (briefly) for an element rendered by the incoming page. */
function waitFor(id: string, timeout = 1500): Promise<Element | null> {
  return new Promise((resolve) => {
    const started = performance.now()
    const tick = () => {
      const el = document.getElementById(id)
      if (el || performance.now() - started > timeout) return resolve(el)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export const router = createRouter({
  history: createWebHistory(),
  strict: true,
  routes,
  async scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) {
      let id = to.hash.slice(1)
      try {
        id = decodeURIComponent(id)
      } catch {
        /* keep raw */
      }
      const samePage = to.path === from.path
      const el = await waitFor(id)
      if (el) return { el, top: HEADER_OFFSET, behavior: samePage ? 'smooth' : 'instant' }
    }
    if (to.path === from.path && to.hash === from.hash) return false
    // 'instant' overrides the stylesheet's `scroll-behavior: smooth` on page changes.
    return { top: 0, behavior: 'instant' }
  },
})
