import type { HeadData } from '@shared/head'
import { watchEffect } from 'vue'
import { applyHead, siteOrigin } from './head'

/** Keeps document <head> in sync with the current page's metadata. */
export function usePageHead(build: (origin: string) => HeadData | null) {
  watchEffect(() => {
    const head = build(siteOrigin)
    if (head) applyHead(head)
  })
}
