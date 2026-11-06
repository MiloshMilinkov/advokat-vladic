import type { HeadData } from '@shared/head'
import { watchEffect } from 'vue'
import { applyHead, siteOrigin } from './head'

/**
 * Keeps document <head> in sync with the current page's metadata. On the server
 * this is a no-op: the Worker writes the <head> tags itself.
 */
export function usePageHead(build: (origin: string) => HeadData | null) {
  if (import.meta.env.SSR) return
  watchEffect(() => {
    const head = build(siteOrigin())
    if (head) applyHead(head)
  })
}
