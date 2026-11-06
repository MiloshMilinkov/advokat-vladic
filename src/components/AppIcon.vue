<script setup lang="ts">
import { icons, type IconName } from '@/lib/icons'

defineProps<{ name: IconName }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- static, trusted icon markup -->
  <svg viewBox="0 0 24 24" aria-hidden="true" v-html="icons[name]" />
</template>
