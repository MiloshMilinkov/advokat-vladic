<script setup lang="ts">
import { practiceAreas } from '@shared/practice-areas'
import { site } from '@shared/site'
import { avatarImage } from '@/lib/images'
import { videos } from '@/data/home'
</script>

<template>
  <section id="statistika" class="stats" aria-label="Kancelarija u brojkama">
    <div class="container stats__inner">
      <div class="stats__trust reveal">
        <p class="stats__trust-title">Advokat i osnivač kancelarije</p>
        <div class="stats__trust-row">
          <img :src="avatarImage" alt="" loading="lazy" decoding="async" width="52" height="52" class="stats__avatar" />
          <p>
            <strong>{{ site.lawyer }}</strong><br />
            <span>{{ site.address }}</span>
          </p>
        </div>
      </div>
      <div class="stats__items">
        <div class="stat reveal">
          <p class="stat__num" data-count="40">40+</p>
          <p class="stat__label">Google recenzija</p>
        </div>
        <div class="stat reveal">
          <p class="stat__num" :data-count="practiceAreas.length">{{ practiceAreas.length }}</p>
          <p class="stat__label">Oblasti prava</p>
        </div>
        <div class="stat reveal">
          <p class="stat__num" :data-count="videos.length">{{ videos.length }}</p>
          <p class="stat__label">Medijskih nastupa</p>
        </div>
      </div>
    </div>
  </section>
</template>
