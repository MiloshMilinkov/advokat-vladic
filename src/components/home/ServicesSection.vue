<script setup lang="ts">
import { practiceAreas } from '@shared/practice-areas'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import SplitText from '@/components/SplitText.vue'
import { areaCardImage } from '@/lib/images'
</script>

<template>
  <section id="oblasti" class="section">
    <div class="container">
      <EyebrowLabel>Oblasti rada</EyebrowLabel>
      <div class="section-head">
        <SplitText class="h2" text="Pravna pomoć i zastupanje za fizička i pravna lica" />
        <p class="section-head__text reveal">
          Od radnih i porodičnih sporova do privrednih, krivičnih i upravnih postupaka – izaberite oblast i saznajte više.
        </p>
      </div>
      <div class="services">
        <a v-for="a in practiceAreas" :key="a.slug" class="service-card reveal" :href="`/${a.slug}/`">
          <img
            :src="areaCardImage(a.slug).src"
            :srcset="areaCardImage(a.slug).srcset"
            sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 400px"
            alt=""
            loading="lazy"
            decoding="async"
            :width="a.coverWidth"
            :height="a.coverHeight"
          />
          <div class="service-card__body">
            <h3>{{ a.name }}</h3>
            <p>{{ a.cardText }}</p>
            <span class="link-arrow">Saznajte više <span aria-hidden="true">→</span></span>
          </div>
        </a>
      </div>
    </div>
  </section>
  <div class="marquee" aria-hidden="true">
    <div class="marquee__track">
      <template v-for="round in 2" :key="round">
        <span v-for="(a, i) in practiceAreas" :key="`${round}-${a.slug}`" class="marquee__item" :class="{ 'marquee__item--muted': i % 2 === 1 }">
          {{ a.name }}
          <svg class="marquee__sep" viewBox="0 0 24 24"><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" /></svg>
        </span>
      </template>
    </div>
  </div>
</template>
