<script setup lang="ts">
import { computed } from 'vue'

// Word-by-word "rise" headline; the reveal observer adds `.in` when visible.
const props = withDefaults(defineProps<{ text: string; tag?: string }>(), { tag: 'h2' })
const words = computed(() => props.text.split(/\s+/).filter(Boolean))
</script>

<template>
  <component :is="tag" class="split">
    <template v-for="(w, i) in words" :key="i"
      ><span class="w"><span :style="{ '--i': i }">{{ w }}</span></span
      >{{ i < words.length - 1 ? ' ' : '' }}</template
    >
  </component>
</template>
