<script setup lang="ts">
import { site } from '@shared/site'
import AppIcon from '@/components/AppIcon.vue'
import SplitText from '@/components/SplitText.vue'
import { heroImage } from '@/lib/images'
</script>

<template>
  <section id="pocetna" class="hero">
    <div class="hero__media" aria-hidden="true">
      <img
        :src="heroImage.src"
        :srcset="heroImage.srcset"
        sizes="100vw"
        alt=""
        loading="eager"
        decoding="sync"
        fetchpriority="high"
        width="1920"
        height="1080"
      />
    </div>
    <div class="container hero__content">
      <p class="eyebrow eyebrow--light"><span class="eyebrow__line"></span>Advokat Nenad Vladić · Beograd</p>
      <SplitText tag="h1" class="hero__title" text="Advokatska kancelarija Vladić Beograd" />
      <p class="hero__lead">
        Pravna pomoć i zastupanje fizičkih i pravnih lica – jasno, efikasno i odgovorno, uz individualan pristup svakom predmetu.
      </p>
      <ul class="dot-list dot-list--light">
        <li>Zastupanje pred sudovima i državnim organima</li>
        <li>Poverenje, diskrecija i profesionalna posvećenost</li>
        <li>Konsultacije u kancelariji i online</li>
      </ul>
      <div class="hero__buttons">
        <a :href="site.phoneHref" class="btn btn--light"><AppIcon name="phone" class="icon" />Pozovite advokata</a>
        <a href="#konsultacije" class="btn btn--glass">Zakažite online konsultacije</a>
      </div>
    </div>
    <div class="container hero__bottom">
      <p><span class="dot"></span>{{ site.address }}</p>
      <a href="#statistika" class="hero__scroll">Skrolujte dalje <span aria-hidden="true">↓</span></a>
    </div>
  </section>
</template>
