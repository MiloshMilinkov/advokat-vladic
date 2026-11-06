<script setup lang="ts">
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import { portraitImage } from '@/lib/images'
</script>

<template>
  <section id="o-nama" class="section section--gray">
    <div class="container">
      <div class="about__head">
        <EyebrowLabel>O kancelariji</EyebrowLabel>
        <h2 class="about__lead reveal">
          Kancelarija je usmerena na pružanje jasne, efikasne i odgovorne pravne zaštite, uz individualan pristup svakom predmetu i
          detaljnu analizu pravnih i činjeničnih pitanja.
        </h2>
      </div>
      <div class="about__grid">
        <figure class="about__img reveal-img">
          <img
            :src="portraitImage"
            alt="Advokat Nenad Vladić, osnivač Advokatske kancelarije Vladić iz Beograda."
            loading="lazy"
            decoding="async"
            width="800"
            height="1000"
          />
          <figcaption>
            <strong>Nenad Vladić</strong>
            <span>Advokat i osnivač kancelarije</span>
          </figcaption>
        </figure>
        <div class="about__text reveal">
          <p>
            Nenad Vladić je advokat i osnivač Advokatske kancelarije Vladić, sa sedištem u Beogradu. Diplomirao je na Pravnom fakultetu
            Univerziteta u Beogradu.
          </p>
          <p>
            Advokatska kancelarija pruža pravnu pomoć i zastupanje fizičkim i pravnim licima u oblasti radnog prava, privrednog prava,
            porodičnog i naslednog prava, ugovornog prava, kao i u krivičnim i prekršajnim postupcima.
          </p>
          <ul class="dot-list">
            <li>Temeljna priprema i pravna preciznost</li>
            <li>Strateški pristup zastupanju pred sudovima i organima</li>
            <li>Poverenje, diskrecija i profesionalna posvećenost</li>
          </ul>
          <p class="about__quote">
            Zastupanje se ne posmatra kao formalnost ili rutina, već kao ozbiljna odgovornost koja zahteva posvećenost, analitičnost i
            potpuno razumevanje konkretnog problema klijenta.
          </p>
          <div class="about__buttons">
            <a href="#oblasti" class="btn btn--outline">Oblasti rada</a>
            <a href="#kontakt" class="btn btn--dark">Kontaktirajte nas <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
