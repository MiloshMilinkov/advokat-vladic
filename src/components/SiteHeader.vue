<script setup lang="ts">
import { practiceAreas } from '@shared/practice-areas'
import { site } from '@shared/site'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import SiteLogo from './SiteLogo.vue'

const route = useRoute()
const dropdown = ref<HTMLElement>()
const toggle = ref<HTMLButtonElement>()

const menuOpen = ref(false)
const dropdownOpen = ref(false)
const scrolled = ref(false)
const hidden = ref(false)

function setMenu(open: boolean) {
  menuOpen.value = open
  document.body.classList.toggle('menu-open', open)
  if (open) hidden.value = false
}

let lastY = 0
function onScroll() {
  const y = window.scrollY
  scrolled.value = y > 40
  hidden.value = y > lastY && y > 400 && !menuOpen.value
  lastY = y
}

function onDocClick(e: MouseEvent) {
  if (dropdown.value && !dropdown.value.contains(e.target as Node)) dropdownOpen.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') setMenu(false)
}
function onDropdownKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && dropdownOpen.value) {
    e.stopPropagation()
    dropdownOpen.value = false
    toggle.value?.focus()
  }
}
function onDropdownFocusOut(e: FocusEvent) {
  if (!dropdown.value?.contains(e.relatedTarget as Node)) dropdownOpen.value = false
}

// Close menus whenever the route changes (link clicks are handled by the router).
watch(
  () => route.fullPath,
  () => {
    setMenu(false)
    dropdownOpen.value = false
  },
)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  requestAnimationFrame(onScroll)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  document.body.classList.remove('menu-open')
})

const current = (path: string) => (route.path === path ? 'page' : undefined)
</script>

<template>
  <header
    id="header"
    class="header"
    :class="{ 'is-scrolled': scrolled, 'is-hidden': hidden }"
    @focusin="hidden = false"
  >
    <div class="container header__inner">
      <SiteLogo eager />
      <nav id="nav" class="nav" :class="{ 'is-open': menuOpen }" aria-label="Glavna navigacija" @click="(e) => (e.target as HTMLElement).closest('a') && setMenu(false)">
        <a href="/#o-nama">O nama</a>
        <div ref="dropdown" class="nav__dropdown" :class="{ 'is-open': dropdownOpen }" @keydown="onDropdownKey" @focusout="onDropdownFocusOut">
          <button
            ref="toggle"
            type="button"
            class="nav__toggle"
            :aria-expanded="dropdownOpen"
            aria-controls="nav-oblasti"
            @click="dropdownOpen = !dropdownOpen"
          >
            Oblasti rada
            <AppIcon name="chevron" class="nav__chevron" />
          </button>
          <div id="nav-oblasti" class="dropdown">
            <ul class="dropdown__list">
              <li v-for="a in practiceAreas" :key="a.slug">
                <a :href="`/${a.slug}/`" :aria-current="current(`/${a.slug}/`)">{{ a.name }} <span aria-hidden="true">→</span></a>
              </li>
            </ul>
            <div class="dropdown__footer">
              <a href="/advokatska-tarifa/" :aria-current="current('/advokatska-tarifa/')">Advokatska tarifa</a>
              <a href="/#oblasti">Sve oblasti rada</a>
            </div>
          </div>
        </div>
        <a href="/#konsultacije">Online konsultacije</a>
        <a href="/#mediji">U medijima</a>
        <a href="/#klijenti">Klijenti</a>
        <a href="/blog/" :aria-current="route.path.startsWith('/blog/') ? 'page' : undefined">Blog</a>
        <a href="/#kontakt" class="nav__mobile-only">Kontakt</a>
        <a :href="site.phoneHref" class="btn btn--light nav__mobile-only"><AppIcon name="phone" class="icon" />{{ site.phone }}</a>
      </nav>
      <div class="header__actions">
        <a :href="site.phoneHref" class="header__phone" :aria-label="`Pozovite ${site.phone}`">
          <AppIcon name="phone" class="icon" />
          <span>{{ site.phone }}</span>
        </a>
        <a href="/#kontakt" class="btn btn--light header__cta">Zakažite sastanak</a>
        <button
          id="burger"
          class="burger"
          type="button"
          :aria-label="menuOpen ? 'Zatvori meni' : 'Otvori meni'"
          :aria-expanded="menuOpen"
          aria-controls="nav"
          @click="setMenu(!menuOpen)"
        >
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>
</template>
