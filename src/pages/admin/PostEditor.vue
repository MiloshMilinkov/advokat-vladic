<script setup lang="ts">
import { readingMinutes, renderMarkdown } from '@shared/markdown'
import type { CategoryWithCount, PostInput } from '@shared/types'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ApiError } from '@/lib/api'
import { coverSrcset } from '@/lib/images'
import type { adminApi } from './adminApi'

const props = defineProps<{
  api: ReturnType<typeof adminApi>
  postId: number | null
  categories: CategoryWithCount[]
  justCreated?: boolean
}>()
const emit = defineEmits<{ close: []; saved: []; created: [id: number]; 'auth-error': [e: unknown] }>()

const today = () => new Date().toISOString().slice(0, 10)

const form = reactive<PostInput>({
  slug: '',
  title: '',
  excerpt: '',
  seoTitle: null,
  categorySlug: '',
  coverUrl: null,
  coverAlt: '',
  ogImageUrl: null,
  bodyMd: '',
  readingMinutes: 1,
  publishedAt: today(),
  status: 'draft',
})
const loading = ref(props.postId !== null)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const slugTouched = ref(props.postId !== null)
const minutesTouched = ref(false)
const tab = ref<'write' | 'preview'>('write')
const savedSnapshot = ref('')

const isNew = computed(() => props.postId === null)
const dirty = computed(() => JSON.stringify(form) !== savedSnapshot.value)

const TRANSLIT: Record<string, string> = { č: 'c', ć: 'c', đ: 'dj', š: 's', ž: 'z' }
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[čćđšž]/g, (c) => TRANSLIT[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

watch(
  () => form.title,
  (t) => {
    if (!slugTouched.value) form.slug = slugify(t)
  },
)
watch(
  () => form.bodyMd,
  (md) => {
    if (!minutesTouched.value) form.readingMinutes = readingMinutes(md)
  },
)

const preview = computed(() => renderMarkdown(form.bodyMd || '_Tekst članka će se pojaviti ovde._'))

onMounted(async () => {
  if (props.postId === null) {
    form.categorySlug = props.categories[0]?.slug ?? ''
    savedSnapshot.value = JSON.stringify(form)
    return
  }
  try {
    const p = await props.api.get(props.postId)
    Object.assign(form, {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      seoTitle: p.seoTitle,
      categorySlug: p.categorySlug,
      coverUrl: p.coverUrl,
      coverAlt: p.coverAlt,
      ogImageUrl: p.ogImageUrl,
      bodyMd: p.bodyMd,
      readingMinutes: p.readingMinutes,
      publishedAt: p.publishedAt,
      status: p.status,
    })
    minutesTouched.value = true
    savedSnapshot.value = JSON.stringify(form)
    if (props.justCreated) notice.value = 'Članak je sačuvan.'
  } catch (e) {
    emit('auth-error', e)
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})

async function save() {
  error.value = ''
  notice.value = ''
  saving.value = true
  try {
    const payload: PostInput = { ...form, seoTitle: form.seoTitle || null, coverUrl: form.coverUrl || null, ogImageUrl: form.ogImageUrl || null }
    if (isNew.value) {
      const created = await props.api.create(payload)
      savedSnapshot.value = JSON.stringify(form)
      emit('saved')
      // Continue editing the newly created post.
      emit('created', created.id)
    } else {
      await props.api.update(props.postId!, payload)
      savedSnapshot.value = JSON.stringify(form)
      notice.value = 'Izmene su sačuvane.'
      emit('saved')
    }
  } catch (e) {
    emit('auth-error', e)
    error.value = e instanceof ApiError ? e.message : 'Čuvanje nije uspelo.'
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (props.postId === null) return
  if (!confirm(`Obrisati članak „${form.title}”? Ova radnja se ne može poništiti.`)) return
  try {
    await props.api.remove(props.postId)
    emit('saved')
    emit('close')
  } catch (e) {
    emit('auth-error', e)
    error.value = e instanceof ApiError ? e.message : 'Brisanje nije uspelo.'
  }
}

function back() {
  if (dirty.value && !confirm('Imate nesačuvane izmene. Želite li da napustite stranicu?')) return
  emit('close')
}

const excerptLeft = computed(() => 400 - form.excerpt.length)
</script>

<template>
  <section class="container admin__editor">
    <div class="admin__list-head">
      <div>
        <button type="button" class="admin__link" @click="back">← Svi članci</button>
        <h1>{{ isNew ? 'Novi članak' : 'Uređivanje članka' }}</h1>
      </div>
      <div class="admin__editor-actions">
        <a v-if="!isNew && form.status === 'published'" :href="`/blog/${form.slug}/`" target="_blank" rel="noopener" class="btn btn--outline">Pogledaj ↗</a>
        <button type="button" class="btn btn--dark" :disabled="saving || loading" @click="save">{{ saving ? 'Čuvanje…' : 'Sačuvaj' }}</button>
      </div>
    </div>

    <p v-if="error" class="admin__error" role="alert">{{ error }}</p>
    <p v-if="notice" class="admin__notice" role="status">{{ notice }}</p>
    <p v-if="loading" class="admin__muted">Učitavanje…</p>

    <form v-else class="admin__grid" @submit.prevent="save">
      <div class="admin__panel">
        <div class="field">
          <label for="p-title">Naslov *</label>
          <input id="p-title" v-model="form.title" required maxlength="200" />
        </div>
        <div class="form__row">
          <div class="field">
            <label for="p-slug">Adresa (slug) *</label>
            <input id="p-slug" v-model="form.slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="120" @input="slugTouched = true" />
            <small class="admin__hint">/blog/{{ form.slug || '…' }}/</small>
          </div>
          <div class="field">
            <label for="p-cat">Kategorija *</label>
            <select id="p-cat" v-model="form.categorySlug" required>
              <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.label }}</option>
            </select>
          </div>
        </div>
        <div class="form__row">
          <div class="field">
            <label for="p-date">Datum objave *</label>
            <input id="p-date" v-model="form.publishedAt" type="date" required />
          </div>
          <fieldset class="field">
            <legend>Status</legend>
            <div class="chips">
              <label class="chip"><input v-model="form.status" type="radio" value="draft" /><span>U pripremi</span></label>
              <label class="chip"><input v-model="form.status" type="radio" value="published" /><span>Objavljen</span></label>
            </div>
          </fieldset>
        </div>
        <div class="field">
          <label for="p-excerpt">Kratak opis * <span class="admin__hint">(prikazuje se u Google rezultatima – {{ excerptLeft }} karaktera preostalo)</span></label>
          <textarea id="p-excerpt" v-model="form.excerpt" rows="3" maxlength="400" required></textarea>
        </div>
        <div class="form__row">
          <div class="field">
            <label for="p-cover">Naslovna slika (URL)</label>
            <input id="p-cover" v-model="form.coverUrl" placeholder="/images/blog/naziv.webp" />
          </div>
          <div class="field">
            <label for="p-alt">Opis slike (alt)</label>
            <input id="p-alt" v-model="form.coverAlt" maxlength="400" />
          </div>
        </div>
        <div v-if="form.coverUrl" class="admin__cover-preview">
          <img :src="form.coverUrl" :srcset="coverSrcset(form.coverUrl)" sizes="320px" :alt="form.coverAlt" />
        </div>
        <details class="admin__more">
          <summary>Napredna SEO podešavanja</summary>
          <div class="field">
            <label for="p-seo">SEO naslov <span class="admin__hint">(podrazumevano: „{{ form.title || 'Naslov' }} | Advokat Vladić”)</span></label>
            <input id="p-seo" v-model="form.seoTitle" maxlength="200" />
          </div>
          <div class="form__row">
            <div class="field">
              <label for="p-og">Slika za deljenje (URL)</label>
              <input id="p-og" v-model="form.ogImageUrl" placeholder="podrazumevano: naslovna slika" />
            </div>
            <div class="field">
              <label for="p-min">Vreme čitanja (min)</label>
              <input id="p-min" v-model.number="form.readingMinutes" type="number" min="1" max="240" @input="minutesTouched = true" />
            </div>
          </div>
        </details>
      </div>

      <div class="admin__panel admin__body">
        <div class="admin__tabs" role="tablist">
          <button type="button" role="tab" :aria-selected="tab === 'write'" :class="{ 'is-active': tab === 'write' }" @click="tab = 'write'">Tekst (Markdown)</button>
          <button type="button" role="tab" :aria-selected="tab === 'preview'" :class="{ 'is-active': tab === 'preview' }" @click="tab = 'preview'">Pregled</button>
          <span class="admin__muted admin__tabs-meta">{{ form.readingMinutes }} min čitanja · {{ preview.toc.length }} poglavlja</span>
        </div>
        <div class="field" :hidden="tab !== 'write'">
          <label for="p-body" class="sr-only">Tekst članka</label>
          <textarea id="p-body" v-model="form.bodyMd" class="admin__md" spellcheck="true" required></textarea>
          <p class="admin__hint">
            <code>## Naslov poglavlja</code> · <code>### Podnaslov</code> · <code>**podebljano**</code> · <code>- stavka liste</code> ·
            <code>[tekst linka](/blog/naziv/)</code> · <code>---</code> linija
          </p>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -- preview of the author's own Markdown -->
        <div v-if="tab === 'preview'" class="prose admin__preview" v-html="preview.html"></div>
      </div>

      <div class="admin__danger">
        <button v-if="!isNew" type="button" class="admin__link admin__link--danger" @click="remove">Obriši članak</button>
      </div>
    </form>
  </section>
</template>
