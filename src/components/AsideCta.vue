<script setup lang="ts">
import { site } from '@shared/site'
import AppIcon from './AppIcon.vue'

defineProps<{ title: string; text: string }>()
</script>

<template>
  <div class="aside-cta">
    <p class="aside-cta__title">{{ title }}</p>
    <p>{{ text }}</p>
    <a :href="site.phoneHref" class="btn btn--light"><AppIcon name="phone" class="icon" />{{ site.phone }}</a>
    <a :href="site.calendlyUrl" class="btn btn--glass" target="_blank" rel="noopener">Online konsultacije</a>
  </div>
</template>
