<script setup lang="ts">
import { apiPaths } from '@shared/api-paths'
import { blogIndexHead } from '@shared/head'
import { staticPages } from '@shared/site'
import type { CategoryWithCount, PostSummary } from '@shared/types'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import PostCard from '@/components/PostCard.vue'
import SplitText from '@/components/SplitText.vue'
import { useApi } from '@/lib/useApi'
import { usePageHead } from '@/lib/usePageHead'

usePageHead(blogIndexHead)

const route = useRoute()
const router = useRouter()
const { data: posts, pending, error } = useApi<PostSummary[]>(() => apiPaths.posts())
const { data: categories } = useApi<CategoryWithCount[]>(() => apiPaths.categories())

const filter = computed(() => {
  const q = route.query.oblast
  const v = typeof q === 'string' ? q : 'all'
  return v === 'all' || categories.value?.some((c) => c.slug === v) ? v : 'all'
})
const total = computed(() => posts.value?.length ?? 0)
const featured = computed(() => posts.value?.[0] ?? null)
const rest = computed(() => posts.value?.slice(1) ?? [])
const matches = (p: PostSummary) => filter.value === 'all' || p.category.slug === filter.value
const visibleCount = computed(() => posts.value?.filter(matches).length ?? 0)

const list = ref<HTMLElement>()
function setFilter(slug: string) {
  void router.replace({ query: slug === 'all' ? {} : { oblast: slug } })
}
// Cards that become visible through filtering are shown without waiting for scroll.
watch(filter, () =>
  nextTick(() => list.value?.querySelectorAll('.post-card:not([hidden])').forEach((el) => el.classList.add('in'))),
)
</script>

<template>
  <section class="page-hero">
    <div class="container">
      <EyebrowLabel light :reveal="false">Blog</EyebrowLabel>
      <SplitText tag="h1" class="page-hero__title hero__title" text="Pravni saveti iz prakse" />
      <p class="page-hero__text">{{ staticPages.blog.lead }}</p>
    </div>
  </section>
  <section ref="list" class="section blog-list">
    <div class="container">
      <div v-if="categories?.length" class="filters" role="group" aria-label="Filtriraj po oblasti prava">
        <button type="button" class="filter" :class="{ 'is-active': filter === 'all' }" :aria-pressed="filter === 'all'" @click="setFilter('all')">
          Svi članci <span>{{ total }}</span>
        </button>
        <button
          v-for="c in categories"
          :key="c.slug"
          type="button"
          class="filter"
          :class="{ 'is-active': filter === c.slug }"
          :aria-pressed="filter === c.slug"
          @click="setFilter(c.slug)"
        >
          {{ c.label }} <span>{{ c.count }}</span>
        </button>
      </div>

      <div v-if="pending" class="blog-list__loading" aria-busy="true">
        <div class="skeleton skeleton--featured"></div>
        <div class="posts">
          <div v-for="n in 3" :key="n" class="skeleton skeleton--card"></div>
        </div>
      </div>
      <p v-else-if="error" class="blog-list__none">Članci trenutno nisu dostupni. Pokušajte ponovo za nekoliko trenutaka.</p>
      <template v-else>
        <PostCard v-if="featured" :hidden="!matches(featured)" :post="featured" featured heading-tag="h2" />
        <div class="posts posts--list">
          <PostCard v-for="p in rest" :hidden="!matches(p)" :key="p.slug" :post="p" heading-tag="h2" />
        </div>
        <p v-if="!visibleCount" class="blog-list__none">Nema članaka u ovoj oblasti.</p>
      </template>
    </div>
  </section>
</template>
