<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import SplitText from '@/components/SplitText.vue'
import { steps } from '@/data/home'
import { columnsImage } from '@/lib/images'
</script>

<template>
  <section id="kako-radimo" class="process">
    <div class="parallax" aria-hidden="true">
      <img :src="columnsImage.src" :srcset="columnsImage.srcset" sizes="100vw" alt="" loading="lazy" decoding="async" width="1600" height="704" />
    </div>
    <div class="container">
      <div class="process__head">
        <div>
          <EyebrowLabel light>Kako radimo</EyebrowLabel>
          <SplitText class="h2 h2--light" text="Posvećenost, analitičnost i razumevanje vašeg problema" />
          <p class="process__text reveal">
            Poseban fokus je na zaštiti prava i interesa klijenata u postupcima koji zahtevaju visok nivo poverenja, diskrecije i
            profesionalne posvećenosti.
          </p>
        </div>
        <a href="#kontakt" class="btn btn--glass reveal">Zakažite razgovor</a>
      </div>
      <div class="steps">
        <article v-for="(s, i) in steps" :key="s.title" class="step reveal">
          <span class="step__icon" aria-hidden="true"><AppIcon :name="s.icon" /></span>
          <h3>{{ s.title }}</h3>
          <p>{{ s.text }}</p>
          <span class="step__num">{{ String(i + 1).padStart(2, '0') }}</span>
        </article>
      </div>
    </div>
  </section>
</template>
