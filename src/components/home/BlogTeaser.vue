<script setup lang="ts">
import { apiPaths } from '@shared/api-paths'
import type { PostSummary } from '@shared/types'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import PostCard from '@/components/PostCard.vue'
import SplitText from '@/components/SplitText.vue'
import { useApi } from '@/lib/useApi'

const { data: posts } = useApi<PostSummary[]>(() => apiPaths.posts({ limit: 3 }))
</script>

<template>
  <section id="blog" class="section section--gray">
    <div class="container">
      <EyebrowLabel>Blog</EyebrowLabel>
      <div class="section-head">
        <SplitText class="h2" text="Pravni saveti iz prakse" />
        <p class="section-head__text reveal">Jasno objašnjena prava i postupci – od otkaza i mobinga do nasleđivanja i nekretnina.</p>
      </div>
      <div class="posts posts--min">
        <PostCard v-for="p in posts ?? []" :key="p.slug" :post="p" />
      </div>
      <div class="posts__more reveal">
        <a href="/blog/" class="btn btn--outline">Svi članci <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
</template>
