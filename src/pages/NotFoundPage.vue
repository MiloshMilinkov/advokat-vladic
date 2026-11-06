<script setup lang="ts">
import { notFoundHead } from '@shared/head'
import { practiceAreas } from '@shared/practice-areas'
import { usePageHead } from '@/lib/usePageHead'

usePageHead(notFoundHead)
</script>

<template>
  <section class="page-hero not-found">
    <div class="container">
      <p class="eyebrow eyebrow--light"><span class="eyebrow__line"></span>Greška 404</p>
      <h1 class="page-hero__title article__title">Stranica nije pronađena</h1>
      <p class="page-hero__text">Tražena stranica ne postoji ili je premeštena. Pogledajte oblasti rada ili se vratite na početnu.</p>
      <div class="hero__buttons service-page__buttons">
        <a href="/" class="btn btn--light">Početna strana</a>
        <a href="/blog/" class="btn btn--glass">Blog</a>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <p class="eyebrow"><span class="eyebrow__line"></span>Oblasti rada</p>
      <ul class="not-found__links">
        <li v-for="a in practiceAreas" :key="a.slug">
          <a :href="`/${a.slug}/`" class="link-arrow">{{ a.name }} <span aria-hidden="true">→</span></a>
        </li>
      </ul>
    </div>
  </section>
</template>
