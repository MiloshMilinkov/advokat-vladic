<script setup lang="ts">
import { practiceAreas } from '@shared/practice-areas'
import { site } from '@shared/site'
import AppIcon from './AppIcon.vue'
import SiteLogo from './SiteLogo.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <SiteLogo />
        <p>Pravna pomoć i zastupanje fizičkih i pravnih lica u Beogradu i online.</p>
        <p class="footer__motto">{{ site.hours }}</p>
        <div class="socials">
          <a :href="site.socials.instagram" target="_blank" rel="noopener" aria-label="Instagram"><AppIcon name="instagram" /></a>
          <a :href="site.socials.linkedin" target="_blank" rel="noopener" aria-label="LinkedIn"><AppIcon name="linkedin" /></a>
          <a :href="site.socials.facebook" target="_blank" rel="noopener" aria-label="Facebook"><AppIcon name="facebook" /></a>
        </div>
      </div>
      <nav class="footer__col" aria-label="Meni u podnožju">
        <h2>Meni</h2>
        <a href="/#o-nama">O nama</a>
        <a href="/#oblasti">Oblasti rada</a>
        <a href="/#konsultacije">Online konsultacije</a>
        <a href="/#mediji">U medijima</a>
        <a href="/#klijenti">Klijenti</a>
        <a href="/blog/">Blog</a>
      </nav>
      <nav class="footer__col" aria-label="Pravne usluge">
        <h2>Pravne usluge</h2>
        <a v-for="a in practiceAreas" :key="a.slug" :href="`/${a.slug}/`">{{ a.name }}</a>
        <a href="/advokatska-tarifa/">Advokatska tarifa</a>
      </nav>
      <div class="footer__col">
        <h2>Kontakt</h2>
        <a :href="site.phoneHref">{{ site.phone }}</a>
        <a :href="`mailto:${site.email}`">{{ site.email }}</a>
        <a :href="site.mapsUrl" target="_blank" rel="noopener">{{ site.address }}</a>
        <a :href="site.calendlyUrl" target="_blank" rel="noopener">Online konsultacije</a>
      </div>
    </div>
    <div class="container footer__bottom">
      <p>© {{ year }} {{ site.name }}. Sva prava zadržana.</p>
      <nav aria-label="Pravne informacije">
        <a :href="site.privacyUrl" target="_blank" rel="noopener">Politika privatnosti</a>
        <a href="#top">Nazad na vrh ↑</a>
      </nav>
    </div>
  </footer>
</template>
