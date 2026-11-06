<script setup lang="ts">
import { apiPaths } from '@shared/api-paths'
import { practiceHead } from '@shared/head'
import { practiceAreaBySlug, practiceAreas } from '@shared/practice-areas'
import { site } from '@shared/site'
import type { PostSummary } from '@shared/types'
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import AsideCta from '@/components/AsideCta.vue'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import PostCard from '@/components/PostCard.vue'
import { practiceContent } from '@/data/practice-content'
import { areaCoverImage } from '@/lib/images'
import { useApi } from '@/lib/useApi'
import { usePageHead } from '@/lib/usePageHead'

const props = defineProps<{ slug: string }>()
const area = computed(() => practiceAreaBySlug.get(props.slug)!)
const others = computed(() => practiceAreas.filter((a) => a.slug !== props.slug))
const cover = computed(() => areaCoverImage(props.slug))

const { data: posts } = useApi<PostSummary[]>(() => apiPaths.posts({ category: area.value.blogCategory, limit: 3 }))

usePageHead((origin) => practiceHead(origin, props.slug))
</script>

<template>
  <article :key="slug" class="article service-page">
    <header class="page-hero page-hero--article">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Putanja">
          <a href="/">Početna</a><span aria-hidden="true">/</span><a href="/#oblasti">Oblasti rada</a><span aria-hidden="true">/</span
          ><span aria-current="page">{{ area.name }}</span>
        </nav>
        <h1 class="page-hero__title article__title">{{ area.title }}</h1>
        <p class="page-hero__text service-page__lead">{{ area.lead }}</p>
        <div class="hero__buttons service-page__buttons">
          <a :href="site.phoneHref" class="btn btn--light"><AppIcon name="phone" class="icon" />Pozovite advokata</a>
          <a href="/#kontakt" class="btn btn--glass">Zakažite konsultacije</a>
        </div>
      </div>
    </header>
    <div class="container">
      <figure class="article__cover">
        <img
          :src="cover.src"
          :srcset="cover.srcset"
          sizes="(max-width: 1240px) calc(100vw - 40px), 1176px"
          alt=""
          fetchpriority="high"
          decoding="async"
          :width="area.coverWidth"
          :height="area.coverHeight"
        />
      </figure>
      <div class="article__layout">
        <div class="prose">
          <!-- eslint-disable-next-line vue/no-v-html -- static, trusted copy -->
          <article v-html="practiceContent[slug]"></article>
        </div>
        <aside class="article__aside">
          <AsideCta title="Potrebna vam je pravna pomoć?" text="Opišite nam svoj slučaj – konsultacije u kancelariji u Beogradu ili online." />
          <nav class="toc" aria-label="Ostale oblasti rada">
            <p class="toc__title">Ostale oblasti</p>
            <ol>
              <li v-for="a in others" :key="a.slug"><a :href="`/${a.slug}/`">{{ a.name }}</a></li>
              <li><a href="/advokatska-tarifa/">Advokatska tarifa</a></li>
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  </article>
  <section v-if="posts?.length" class="section section--gray">
    <div class="container">
      <EyebrowLabel>Članci iz oblasti: {{ area.name }}</EyebrowLabel>
      <div class="posts">
        <PostCard v-for="p in posts" :key="p.slug" :post="p" />
      </div>
      <div class="posts__more reveal">
        <a :href="`/blog/?oblast=${area.blogCategory}`" class="btn btn--outline">Svi članci iz ove oblasti <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
</template>
