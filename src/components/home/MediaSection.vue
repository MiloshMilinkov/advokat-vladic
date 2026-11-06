<script setup lang="ts">
import { site } from '@shared/site'
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EyebrowLabel from '@/components/EyebrowLabel.vue'
import SplitText from '@/components/SplitText.vue'
import { videos } from '@/data/home'

const slider = ref<HTMLElement>()
const atStart = ref(true)
const atEnd = ref(false)
/** Videos the visitor started – YouTube loads only on click (lite embed). */
const playing = reactive(new Set<string>())

const stepSize = () => {
  const el = slider.value!
  const first = el.firstElementChild as HTMLElement | null
  const gap = parseFloat(getComputedStyle(el).columnGap) || 18
  return (first?.offsetWidth ?? 0) + gap
}
const maxScroll = () => slider.value!.scrollWidth - slider.value!.clientWidth

function updateArrows() {
  const el = slider.value
  if (!el) return
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft >= maxScroll() - 2
}

function go(dir: -1 | 1) {
  slider.value?.scrollBy({ left: stepSize() * dir, behavior: 'smooth' })
}

// Mouse drag-to-scroll with inertia; touch devices use native scrolling.
const drag = { active: false, moved: false, startX: 0, startScroll: 0, lastX: 0, lastT: 0, velocity: 0, suppressClick: false }
let settleTimer: number | undefined

function onPointerDown(e: PointerEvent) {
  if (e.pointerType !== 'mouse' || e.button !== 0) return
  clearTimeout(settleTimer)
  Object.assign(drag, { active: true, moved: false, startX: e.clientX, lastX: e.clientX, startScroll: slider.value!.scrollLeft, lastT: performance.now(), velocity: 0 })
  slider.value!.classList.add('is-grabbing')
}
function onPointerMove(e: PointerEvent) {
  if (!drag.active) return
  const dx = e.clientX - drag.startX
  if (!drag.moved && Math.abs(dx) > 5) {
    drag.moved = true
    slider.value!.classList.add('is-dragging')
  }
  if (!drag.moved) return
  e.preventDefault()
  slider.value!.scrollLeft = drag.startScroll - dx
  const t = performance.now()
  const dt = Math.max(t - drag.lastT, 1)
  drag.velocity = 0.8 * ((e.clientX - drag.lastX) / dt) + 0.2 * drag.velocity
  drag.lastX = e.clientX
  drag.lastT = t
}
function onPointerUp() {
  if (!drag.active) return
  drag.active = false
  const el = slider.value
  if (!el) return
  el.classList.remove('is-grabbing')
  if (!drag.moved) return
  drag.suppressClick = true
  setTimeout(() => (drag.suppressClick = false), 0)
  const step = stepSize()
  const target = el.scrollLeft - drag.velocity * 220
  el.scrollTo({ left: Math.max(0, Math.min(Math.round(target / step) * step, maxScroll())), behavior: 'smooth' })
  settleTimer = window.setTimeout(() => el.classList.remove('is-dragging'), 600)
}
function onClickCapture(e: MouseEvent) {
  if (drag.suppressClick) {
    e.preventDefault()
    e.stopPropagation()
  }
}

function play(id: string, e: MouseEvent) {
  const box = (e.currentTarget as HTMLElement).closest('.video')
  playing.add(id)
  void nextTick(() => box?.querySelector('iframe')?.focus())
}

let preconnected = false
function preconnect() {
  if (preconnected) return
  preconnected = true
  for (const href of ['https://www.youtube-nocookie.com', 'https://www.google.com']) {
    const l = document.createElement('link')
    l.rel = 'preconnect'
    l.href = href
    document.head.append(l)
  }
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  window.addEventListener('blur', onPointerUp)
  window.addEventListener('resize', updateArrows, { passive: true })
  requestAnimationFrame(updateArrows)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  window.removeEventListener('blur', onPointerUp)
  window.removeEventListener('resize', updateArrows)
  clearTimeout(settleTimer)
})

const srcset = (id: string, widths: number[]) => widths.map((w) => `/images/yt/${id}-${w}.webp ${w}w`).join(', ')
</script>

<template>
  <section id="mediji" class="section">
    <div class="container">
      <EyebrowLabel>U medijima</EyebrowLabel>
      <div class="section-head">
        <SplitText class="h2" text="Pravni komentari u emisijama i podkastima" />
        <p class="section-head__text reveal">
          Gostovanja advokata Nenada Vladića na televiziji – o aktuelnim pravnim pitanjima, jasno i razumljivo.
        </p>
      </div>
      <div
        id="media-slider"
        ref="slider"
        class="slider reveal"
        tabindex="0"
        aria-label="Medijski nastupi – prevucite za još"
        @scroll.passive="updateArrows"
        @pointerdown="onPointerDown"
        @click.capture="onClickCapture"
        @dragstart.prevent
      >
        <article v-for="v in videos" :key="v.id" class="video-card">
          <div class="video">
            <iframe
              v-if="playing.has(v.id)"
              :src="`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`"
              :title="`${v.title}, ${v.channel}`"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
            <template v-else>
              <img
                :src="`/images/yt/${v.id}-${v.widths[0]}.webp`"
                :srcset="srcset(v.id, v.widths)"
                sizes="(max-width: 600px) 86vw, (max-width: 1000px) 50vw, 400px"
                alt=""
                loading="lazy"
                decoding="async"
                width="1280"
                height="720"
              />
              <button
                class="video__play"
                type="button"
                :aria-label="`Pusti video: ${v.title}, ${v.channel}`"
                @pointerenter="preconnect"
                @click="play(v.id, $event)"
              >
                <span><AppIcon name="play" /></span>
              </button>
            </template>
          </div>
          <span class="video-card__tag">{{ v.channel }}</span>
          <h3>{{ v.title }}</h3>
        </article>
      </div>
      <div class="slider-nav reveal">
        <a :href="site.youtubeUrl" target="_blank" rel="noopener" class="slider-nav__all">Pogledajte na YouTube-u</a>
        <div class="slider-nav__arrows">
          <button class="arrow-btn" type="button" aria-label="Prethodni video" :disabled="atStart" @click="go(-1)">←</button>
          <button class="arrow-btn arrow-btn--dark" type="button" aria-label="Sledeći video" :disabled="atEnd" @click="go(1)">→</button>
        </div>
      </div>
    </div>
  </section>
</template>
