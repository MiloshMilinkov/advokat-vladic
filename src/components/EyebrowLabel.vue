<script setup lang="ts">
withDefaults(defineProps<{ light?: boolean; center?: boolean; reveal?: boolean }>(), { reveal: true })
</script>

<template>
  <p class="eyebrow" :class="{ 'eyebrow--light': light, 'eyebrow--center': center, reveal }">
    <span class="eyebrow__line"></span><slot />
  </p>
</template>
