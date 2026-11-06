<script setup lang="ts">
import { formatDate } from '@shared/site'
import type { PostSummary } from '@shared/types'
import { coverSrcset } from '@/lib/images'

withDefaults(
  defineProps<{
    post: PostSummary
    headingTag?: 'h2' | 'h3'
    featured?: boolean
    sizes?: string
  }>(),
  { headingTag: 'h3', sizes: '(max-width: 600px) calc(100vw - 40px), (max-width: 1000px) 50vw, 400px' },
)
</script>

<template>
  <article class="post-card reveal" :class="{ 'post-card--featured': featured }" :data-category="post.category.slug">
    <a :href="`/blog/${post.slug}/`" class="post-card__link">
      <div class="post-card__img">
        <img
          v-if="post.coverUrl"
          :src="post.coverUrl"
          :srcset="coverSrcset(post.coverUrl)"
          :sizes="featured ? '(max-width: 1000px) calc(100vw - 40px), 640px' : sizes"
          :alt="post.coverAlt"
          loading="lazy"
          decoding="async"
          width="1536"
          height="1024"
        />
      </div>
      <div class="post-card__body">
        <span class="post-card__tag">{{ post.category.label }}</span>
        <component :is="headingTag" class="post-card__title">{{ post.title }}</component>
        <p v-if="featured" class="post-card__excerpt">{{ post.excerpt }}</p>
        <p class="post-card__meta">
          <time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
          <span aria-hidden="true">·</span>
          <span>{{ post.readingMinutes }} min čitanja</span>
        </p>
        <span class="link-arrow">Pročitajte više <span aria-hidden="true">→</span></span>
      </div>
    </a>
  </article>
</template>
