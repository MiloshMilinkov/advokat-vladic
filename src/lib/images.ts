// Responsive image helpers for the files in public/images (same widths the
// original Astro build produced).

const set = (base: string, widths: number[]) => widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ')

export const heroImage = {
  src: '/images/hero-cekic-1920.webp',
  srcset: set('/images/hero-cekic', [640, 960, 1280, 1600, 1920]),
}

export const columnsImage = {
  src: '/images/stubovi-1600.webp',
  srcset: set('/images/stubovi', [640, 1000, 1600]),
}

export const areaCardImage = (slug: string) => ({
  src: `/images/oblasti/${slug}-800.webp`,
  srcset: set(`/images/oblasti/${slug}`, [400, 600, 800]),
})

export const areaCoverImage = (slug: string) => ({
  src: `/images/oblasti/${slug}.webp`,
  srcset: `/images/oblasti/${slug}-800.webp 800w, /images/oblasti/${slug}.webp 2000w`,
})

/** Bundled blog covers have 480–1536 px variants; anything else is used as-is. */
export function coverSrcset(url: string | null | undefined): string | undefined {
  const m = url?.match(/^\/images\/blog\/([a-z0-9-]+)\.webp$/)
  if (!m) return undefined
  return set(`/images/blog/${m[1]}`, [480, 720, 960, 1240, 1536])
}

/** Placeholders for personal photos – replace the files to use real portraits. */
export const portraitImage = '/images/placeholders/portrait.svg'
export const avatarImage = '/images/placeholders/avatar.svg'
export const logoImage = { src: '/images/logo-nv.webp', srcset: '/images/logo-nv.webp 1x, /images/logo-nv@2x.webp 2x' }
