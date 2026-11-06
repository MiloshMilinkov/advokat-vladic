<script setup lang="ts">
import { logoImage } from '@/lib/images'

defineProps<{ eager?: boolean }>()
</script>

<template>
  <a href="/" class="logo">
    <img :src="logoImage.src" :srcset="logoImage.srcset" alt="" :loading="eager ? 'eager' : 'lazy'" decoding="async" width="34" height="34" />
    <span class="logo__text"><strong>Vladić</strong><small>Advokatska kancelarija</small></span>
    <span class="sr-only">– početna</span>
  </a>
</template>
