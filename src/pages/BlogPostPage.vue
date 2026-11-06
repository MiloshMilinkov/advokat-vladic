<script setup lang="ts">
import { apiPaths } from '@shared/api-paths'
import { postHead } from '@shared/head'
import { formatDate, site } from '@shared/site'
import type { PostDetail } from '@shared/types'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AsideCta from '@/components/AsideCta.vue'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import PostCard from '@/components/PostCard.vue'
import { avatarImage, coverSrcset } from '@/lib/images'
import { useApi } from '@/lib/useApi'
import { usePageHead } from '@/lib/usePageHead'
import NotFoundPage from './NotFoundPage.vue'

type Post = PostDetail & { seoTitle?: string | null; ogImageUrl?: string | null; updatedAt?: string }

const props = defineProps<{ slug: string }>()
const { data: post, error, pending } = useApi<Post>(() => apiPaths.post(props.slug))

usePageHead((origin) =>
  post.value
    ? postHead(origin, { ...post.value, categoryLabel: post.value.category.label, categorySlug: post.value.category.slug })
    : null,
)

// Highlight the table-of-contents entry for the section being read.
const activeId = ref<string | null>(null)
let observer: IntersectionObserver | null = null
watch(
  post,
  async (p) => {
    if (import.meta.env.SSR) return
    observer?.disconnect()
    activeId.value = null
    if (!p?.toc.length || !('IntersectionObserver' in window)) return
    await nextTick()
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) activeId.value = e.target.id
      },
      { rootMargin: '-90px 0px -70% 0px' },
    )
    document.querySelectorAll('.prose h2[id]').forEach((h) => observer!.observe(h))
  },
  { immediate: true },
)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <NotFoundPage v-if="error?.status === 404" />
  <template v-else>
    <article class="article">
      <header class="page-hero page-hero--article">
        <div class="container">
          <nav class="breadcrumbs" aria-label="Putanja">
            <a href="/">Početna</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a>
            <template v-if="post"
              ><span aria-hidden="true">/</span><a :href="`/blog/?oblast=${post.category.slug}`">{{ post.category.label }}</a></template
            >
          </nav>
          <template v-if="post">
            <h1 class="page-hero__title article__title">{{ post.title }}</h1>
            <div class="article__meta">
              <img :src="avatarImage" alt="" width="44" height="44" class="article__avatar" />
              <div>
                <strong>{{ site.lawyer }}</strong>
                <span><time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time> · {{ post.readingMinutes }} min čitanja</span>
              </div>
            </div>
          </template>
          <div v-else-if="pending" class="article__skeleton" aria-busy="true">
            <span class="skeleton skeleton--dark skeleton--title"></span>
            <span class="skeleton skeleton--dark skeleton--title short"></span>
          </div>
          <template v-else>
            <h1 class="page-hero__title article__title">Članak trenutno nije dostupan</h1>
            <p class="page-hero__text">Pokušajte ponovo za nekoliko trenutaka.</p>
          </template>
        </div>
      </header>
      <div class="container">
        <figure class="article__cover">
          <img
            v-if="post?.coverUrl"
            :src="post.coverUrl"
            :srcset="coverSrcset(post.coverUrl)"
            sizes="(max-width: 1240px) calc(100vw - 40px), 1176px"
            :alt="post.coverAlt"
            fetchpriority="high"
            decoding="async"
            width="1536"
            height="1024"
          />
        </figure>
        <div v-if="post" class="article__layout">
          <div class="prose">
            <!-- eslint-disable-next-line vue/no-v-html -- rendered from Markdown written by the office in /admin -->
            <article v-html="post.html"></article>
          </div>
          <aside class="article__aside">
            <nav v-if="post.toc.length" class="toc" aria-label="Sadržaj članka">
              <p class="toc__title">Sadržaj</p>
              <ol>
                <li v-for="t in post.toc" :key="t.id">
                  <a :href="`#${t.id}`" :class="{ 'is-active': activeId === t.id }">{{ t.text }}</a>
                </li>
              </ol>
            </nav>
            <AsideCta title="Potrebna vam je pravna pomoć?" text="Svaki slučaj je drugačiji. Zakažite konsultacije u kancelariji ili online." />
          </aside>
        </div>
        <div v-else class="article__layout article__layout--empty"></div>
      </div>
    </article>
    <section v-if="post?.related.length" class="section section--gray">
      <div class="container">
        <EyebrowLabel>Pročitajte još</EyebrowLabel>
        <div class="posts">
          <PostCard v-for="p in post.related" :key="p.slug" :post="p" />
        </div>
        <div class="posts__more reveal">
          <a href="/blog/" class="btn btn--outline">Svi članci <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  </template>
</template>
