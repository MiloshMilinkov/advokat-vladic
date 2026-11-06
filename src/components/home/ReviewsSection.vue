<script setup lang="ts">
import { site } from '@shared/site'
import AppIcon from '@/components/AppIcon.vue'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import SplitText from '@/components/SplitText.vue'
import { reviews } from '@/data/home'
</script>

<template>
  <section id="klijenti" class="section section--gray">
    <div class="container">
      <EyebrowLabel>Zadovoljni klijenti</EyebrowLabel>
      <div class="section-head">
        <SplitText class="h2" text="Poverenje koje klijenti potvrđuju" />
        <p class="section-head__text reveal">Iskustva klijenata sa Google-a – o posvećenosti, stručnosti i pristupu svakom predmetu.</p>
      </div>
      <div class="reviews">
        <a class="rating-card reveal" :href="site.mapsUrl" target="_blank" rel="noopener">
          <div class="rating-card__top">
            <span class="stars" aria-hidden="true"><AppIcon v-for="n in 5" :key="n" name="star" /></span>
            <AppIcon name="google" />
          </div>
          <div>
            <p class="rating-card__score">Odlično</p>
            <p>Na osnovu 40+ Google recenzija</p>
          </div>
          <span class="link-arrow">Pogledajte na Google-u <span aria-hidden="true">→</span></span>
        </a>
        <article v-for="r in reviews" :key="r.name" class="review reveal">
          <span class="stars" role="img" aria-label="Ocena 5 od 5"><AppIcon v-for="n in 5" :key="n" name="star" /></span>
          <blockquote>
            <p>{{ r.text }}</p>
          </blockquote>
          <footer>
            <span class="review__avatar" aria-hidden="true">{{ r.name.charAt(0) }}</span>
            <div>
              <strong>{{ r.name }}</strong>
              <small>{{ r.date }}</small>
            </div>
            <AppIcon name="google" class="review__g" />
          </footer>
        </article>
      </div>
    </div>
  </section>
</template>
