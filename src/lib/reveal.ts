// Scroll-triggered entrance animations and number counters (port of the original
// site's behaviour). A MutationObserver picks up elements as Vue renders them, so
// components only need the `reveal` / `reveal-img` / `split` / `data-count` hooks.

const SELECTOR = '.reveal, .reveal-img, .split:not(.hero__title)'

export function installReveal(root: HTMLElement = document.body): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const supported = 'IntersectionObserver' in window && !reduced
  const seen = new WeakSet<Element>()

  // Decode images ahead of time so the reveal animation never shows a blank frame.
  const decoding = new WeakMap<Element, Promise<unknown>>()
  const decode = (el: Element) => {
    let p = decoding.get(el)
    if (!p) {
      p = Promise.all(
        Array.from(el.querySelectorAll('img'), (img) => {
          img.loading = 'eager'
          return img.decode().catch(() => {})
        }),
      )
      decoding.set(el, p)
    }
    return p
  }

  const preload = supported
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            void decode(e.target)
            preload!.unobserve(e.target)
          }
        },
        { rootMargin: '0px 0px 100% 0px' },
      )
    : null

  const reveal = supported
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            const el = e.target
            reveal!.unobserve(el)
            if (!el.querySelector('img')) {
              el.classList.add('in')
              continue
            }
            void Promise.race([decode(el), new Promise((r) => setTimeout(r, 800))]).then(() => el.classList.add('in'))
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
      )
    : null

  const counter = supported
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            const el = e.target as HTMLElement
            counter!.unobserve(el)
            const target = Number(el.dataset.count)
            const suffix = (el.textContent ?? '').replace(/[0-9]/g, '')
            let start: number | null = null
            const step = (t: number) => {
              start ??= t
              const k = Math.min((t - start) / 1400, 1)
              el.textContent = Math.round(target * (1 - (1 - k) ** 3)) + suffix
              if (k < 1) requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
          }
        },
        { threshold: 0.6 },
      )
    : null

  const scan = (node: ParentNode) => {
    const found: Element[] = []
    if (node instanceof Element && node.matches(SELECTOR)) found.push(node)
    node.querySelectorAll?.(SELECTOR).forEach((el) => found.push(el))
    for (const el of found) {
      if (seen.has(el)) continue
      seen.add(el)
      if (!reveal) {
        el.classList.add('in')
        continue
      }
      if (el.querySelector('img')) preload!.observe(el)
      reveal.observe(el)
    }
    if (counter) {
      const counters: Element[] = []
      if (node instanceof Element && node.matches('[data-count]')) counters.push(node)
      node.querySelectorAll?.('[data-count]').forEach((el) => counters.push(el))
      for (const el of counters) {
        if (seen.has(el)) continue
        seen.add(el)
        counter.observe(el)
      }
    }
  }

  scan(root)
  const mo = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => n.nodeType === 1 && scan(n as Element))
  })
  mo.observe(root, { childList: true, subtree: true })

  return () => {
    mo.disconnect()
    preload?.disconnect()
    reveal?.disconnect()
    counter?.disconnect()
  }
}
