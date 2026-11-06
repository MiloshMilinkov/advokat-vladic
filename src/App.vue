<script setup lang="ts">
import { site } from '@shared/site'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SiteHeader from '@/components/SiteHeader.vue'
import { installReveal } from '@/lib/reveal'

const router = useRouter()
const route = useRoute()
const isAdmin = computed(() => route.name === 'admin')

/**
 * Plain <a href> links everywhere (including Markdown in posts) are routed
 * client-side when they point inside the site.
 */
function onLinkClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as Element).closest?.('a')
  if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return
  const href = a.getAttribute('href')
  if (!href) return

  if (href === '#top') {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (href === '#main') {
    e.preventDefault()
    document.getElementById('main')?.focus()
    return
  }
  if (href.startsWith('#')) {
    e.preventDefault()
    void router.push({ path: route.path, query: route.query, hash: href })
    return
  }
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/') || /\.[a-z0-9]{2,5}(\?|#|$)/i.test(href.split('?')[0])) return
  e.preventDefault()
  const url = new URL(href, location.origin)
  void router.push(url.pathname + url.search + url.hash)
}

let stopReveal: (() => void) | undefined
onMounted(() => {
  document.addEventListener('click', onLinkClick)
  stopReveal = installReveal(document.getElementById('app') ?? document.body)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onLinkClick)
  stopReveal?.()
})
</script>

<template>
  <a class="skip-link" href="#main">Preskoči na sadržaj</a>
  <div class="progress" aria-hidden="true"></div>
  <SiteHeader v-if="!isAdmin" />
  <main id="main" tabindex="-1">
    <RouterView :key="route.path" />
  </main>
  <SiteFooter v-if="!isAdmin" />
  <a v-if="!isAdmin" :href="site.phoneHref" class="call-fab" :aria-label="`Pozovite advokatsku kancelariju: ${site.phone}`">
    <AppIcon name="phone" />
    <span>Pozovite</span>
  </a>
</template>
