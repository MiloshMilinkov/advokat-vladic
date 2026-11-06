<script setup lang="ts">
import { tariffHead } from '@shared/head'
import { staticPages } from '@shared/site'
import AsideCta from '@/components/AsideCta.vue'
import { tariffContent } from '@/data/tariff-content'
import { usePageHead } from '@/lib/usePageHead'

usePageHead(tariffHead)
</script>

<template>
  <article class="article">
    <header class="page-hero">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Putanja">
          <a href="/">Početna</a><span aria-hidden="true">/</span><span aria-current="page">Advokatska tarifa</span>
        </nav>
        <h1 class="page-hero__title article__title">Advokatska tarifa</h1>
        <p class="page-hero__text service-page__lead">{{ staticPages.tariff.lead }}</p>
      </div>
    </header>
    <div class="container">
      <div class="article__layout tariff">
        <div class="prose prose--wide">
          <!-- eslint-disable-next-line vue/no-v-html -- static, trusted copy -->
          <article v-html="tariffContent"></article>
        </div>
        <aside class="article__aside">
          <AsideCta title="Koliko će koštati vaš predmet?" text="Pozovite nas – nakon kratkog razgovora dobićete jasnu procenu troškova." />
        </aside>
      </div>
    </div>
  </article>
</template>
