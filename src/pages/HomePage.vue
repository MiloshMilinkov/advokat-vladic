<script setup lang="ts">
import { homeHead } from '@shared/head'
import AboutSection from '@/components/home/AboutSection.vue'
import BlogTeaser from '@/components/home/BlogTeaser.vue'
import ConsultSection from '@/components/home/ConsultSection.vue'
import ContactSection from '@/components/home/ContactSection.vue'
import HomeHero from '@/components/home/HomeHero.vue'
import MediaSection from '@/components/home/MediaSection.vue'
import ProcessSection from '@/components/home/ProcessSection.vue'
import ReviewsSection from '@/components/home/ReviewsSection.vue'
import ServicesSection from '@/components/home/ServicesSection.vue'
import StatsBar from '@/components/home/StatsBar.vue'
import { usePageHead } from '@/lib/usePageHead'

usePageHead(homeHead)
</script>

<template>
  <HomeHero />
  <StatsBar />
  <AboutSection />
  <ServicesSection />
  <ProcessSection />
  <ReviewsSection />
  <ConsultSection />
  <MediaSection />
  <BlogTeaser />
  <ContactSection />
</template>
