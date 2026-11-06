<script setup lang="ts">
import { adminHead } from '@shared/head'
import { formatDate } from '@shared/site'
import type { CategoryWithCount } from '@shared/types'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteLogo from '@/components/SiteLogo.vue'
import { ApiError } from '@/lib/api'
import { usePageHead } from '@/lib/usePageHead'
import { adminApi, tokenStore, type AdminListItem } from './adminApi'
import PostEditor from './PostEditor.vue'
import './admin.css'

usePageHead(adminHead)

const route = useRoute()
const router = useRouter()

const token = ref<string | null>(tokenStore.get())
const api = computed(() => (token.value ? adminApi(token.value) : null))
const tokenInput = ref('')
const loginError = ref('')
const checking = ref(false)

const posts = shallowRef<AdminListItem[]>([])
const categories = shallowRef<CategoryWithCount[]>([])
const loadError = ref('')
const loading = ref(false)

/** `?post=new` or `?post=<id>` opens the editor. */
const editing = computed(() => {
  const q = route.query.post
  if (q === 'new') return 'new' as const
  const id = Number(q)
  return Number.isInteger(id) && id > 0 ? id : null
})

function handleAuthError(e: unknown) {
  if (e instanceof ApiError && e.status === 401) {
    logout()
    loginError.value = 'Sesija je istekla ili ključ nije ispravan.'
    return true
  }
  return false
}

async function login() {
  const t = tokenInput.value.trim()
  if (!t) return
  checking.value = true
  loginError.value = ''
  try {
    await adminApi(t).check()
    tokenStore.set(t)
    token.value = t
    tokenInput.value = ''
    await load()
  } catch (e) {
    loginError.value =
      e instanceof ApiError && e.status === 401 ? 'Pristupni ključ nije ispravan.' : e instanceof ApiError ? e.message : 'Server nije dostupan.'
  } finally {
    checking.value = false
  }
}

function logout() {
  tokenStore.clear()
  token.value = null
  posts.value = []
  void router.replace({ query: {} })
}

async function load() {
  if (!api.value) return
  loading.value = true
  loadError.value = ''
  try {
    const [p, c] = await Promise.all([api.value.list(), api.value.categories()])
    posts.value = p
    categories.value = c
  } catch (e) {
    if (!handleAuthError(e)) loadError.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

const open = (post: number | 'new') => router.push({ query: { post: String(post) } })
const close = () => router.push({ query: {} })

async function onSaved() {
  await load()
}

watch(editing, (v, old) => {
  if (v === null && old !== null) void load()
})

onMounted(() => {
  if (token.value) void load()
})

const categoryLabel = (slug: string) => categories.value.find((c) => c.slug === slug)?.label ?? slug
</script>

<template>
  <div class="admin">
    <header class="admin__bar">
      <div class="container admin__bar-inner">
        <SiteLogo />
        <span class="admin__title">Administracija bloga</span>
        <nav v-if="token" class="admin__bar-actions">
          <a href="/blog/" target="_blank" rel="noopener">Pogledaj blog ↗</a>
          <button type="button" class="admin__link" @click="logout">Odjavi se</button>
        </nav>
      </div>
    </header>

    <section v-if="!token" class="container admin__login">
      <form class="form" @submit.prevent="login">
        <div class="form__head">
          <p class="eyebrow"><span class="eyebrow__line"></span>Prijava</p>
          <h3>Unesite pristupni ključ</h3>
          <p>Ključ je podešen kao tajna <code>ADMIN_TOKEN</code> na Cloudflare-u. Čuva se samo dok je ovaj tab otvoren.</p>
        </div>
        <div class="field" :class="{ 'is-invalid': loginError }">
          <label for="admin-token">Pristupni ključ</label>
          <input id="admin-token" v-model="tokenInput" type="password" autocomplete="current-password" required />
          <span class="field__error">{{ loginError }}</span>
        </div>
        <button type="submit" class="btn btn--dark btn--lg" :disabled="checking">{{ checking ? 'Provera…' : 'Prijavi se' }}</button>
      </form>
    </section>

    <PostEditor
      v-else-if="editing !== null && api"
      :key="String(editing)"
      :api="api"
      :post-id="editing === 'new' ? null : editing"
      :categories="categories"
      :just-created="route.query.saved === '1'"
      @close="close"
      @saved="onSaved"
      @created="(id: number) => router.replace({ query: { post: String(id), saved: '1' } })"
      @auth-error="handleAuthError"
    />

    <section v-else class="container admin__list">
      <div class="admin__list-head">
        <div>
          <h1>Članci</h1>
          <p class="admin__muted">{{ posts.length }} ukupno · {{ posts.filter((p) => p.status === 'draft').length }} u pripremi</p>
        </div>
        <button type="button" class="btn btn--dark" @click="open('new')">Novi članak <span aria-hidden="true">+</span></button>
      </div>
      <p v-if="loadError" class="admin__error" role="alert">{{ loadError }}</p>
      <p v-else-if="loading && !posts.length" class="admin__muted">Učitavanje…</p>
      <div v-else class="admin__table-wrap">
        <table class="admin__table">
          <thead>
            <tr>
              <th>Naslov</th>
              <th>Kategorija</th>
              <th>Datum</th>
              <th>Status</th>
              <th><span class="sr-only">Akcije</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in posts" :key="p.id">
              <td>
                <button type="button" class="admin__post-title" @click="open(p.id)">{{ p.title }}</button>
                <small class="admin__muted">/blog/{{ p.slug }}/</small>
              </td>
              <td>{{ categoryLabel(p.categorySlug) }}</td>
              <td class="admin__nowrap">{{ formatDate(p.publishedAt) }}</td>
              <td>
                <span class="admin__status" :class="`admin__status--${p.status}`">{{ p.status === 'draft' ? 'Priprema' : 'Objavljen' }}</span>
              </td>
              <td class="admin__row-actions">
                <a v-if="p.status === 'published'" :href="`/blog/${p.slug}/`" target="_blank" rel="noopener">Pogledaj</a>
                <button type="button" class="admin__link" @click="open(p.id)">Uredi</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
