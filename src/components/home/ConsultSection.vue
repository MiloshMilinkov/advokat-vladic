<script setup lang="ts">
import { site } from '@shared/site'
import AppIcon from '@/components/AppIcon.vue'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import SplitText from '@/components/SplitText.vue'
import { heroImage } from '@/lib/images'
</script>

<template>
  <section id="konsultacije" class="consult">
    <div class="parallax" aria-hidden="true">
      <img :src="heroImage.src" :srcset="heroImage.srcset" sizes="100vw" alt="" loading="lazy" decoding="async" width="1920" height="1080" />
    </div>
    <div class="container consult__inner">
      <EyebrowLabel light center>Online konsultacije</EyebrowLabel>
      <SplitText class="h2 h2--light consult__title" text="Pravni savet brzo i sigurno – bez napuštanja doma" />
      <p class="consult__text reveal">Advokatska kancelarija Vladić pruža konsultacije u Beogradu, na adresi Podgorička 2, ali i online.</p>
      <p class="consult__text reveal">Izaberite termin koji vam najviše odgovara i zakažite sastanak putem online kalendara.</p>
      <div class="consult__chips reveal">
        <span class="glass-chip"><AppIcon name="video" class="icon" />Video poziv</span>
        <span class="glass-chip"><AppIcon name="clock" class="icon" />{{ site.hours }}</span>
        <span class="glass-chip"><AppIcon name="lock" class="icon" />Potpuna poverljivost</span>
      </div>
      <div class="consult__buttons reveal">
        <a :href="site.calendlyUrl" class="btn btn--light" target="_blank" rel="noopener"><AppIcon name="calendar" class="icon" />Zakažite sastanak</a>
        <a :href="site.phoneHref" class="btn btn--glass">Pozovite {{ site.phone }}</a>
      </div>
    </div>
  </section>
</template>
