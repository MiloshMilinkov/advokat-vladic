// Contact details and static page metadata shared by the Vue app and the Worker.

export const site = {
  name: 'Advokatska kancelarija Vladić',
  shortName: 'Advokat Vladić',
  lawyer: 'Nenad Vladić',
  phone: '+381 60 31 32 994',
  phoneHref: 'tel:+381603132994',
  phoneE164: '+381603132994',
  email: 'advokatvladic@gmail.com',
  address: 'Podgorička 2, Beograd',
  streetAddress: 'Podgorička 2',
  city: 'Beograd',
  postalCode: '11000',
  hours: 'Ponedeljak – petak: 09–19h',
  mapsUrl: 'https://maps.app.goo.gl/LpmWFEBNmfK8YntB9',
  calendlyUrl: 'https://calendly.com/advokatvladic/30min',
  youtubeUrl: 'https://www.youtube.com/results?search_query=advokat+Nenad+Vladi%C4%87',
  privacyUrl: 'https://advokatvladic.rs/wp-content/uploads/2025/10/Politika-privatnosti-sajt.docx.pdf',
  geo: { latitude: 44.7961905, longitude: 20.4720217 },
  socials: {
    instagram: 'https://www.instagram.com/advokatska_kancelarija_vladic/',
    linkedin: 'https://www.linkedin.com/in/nenad-vladi%C4%87-801a46167/',
    facebook: 'https://www.facebook.com/vladicnenad',
  },
  defaultOgImage: '/images/og/home.jpg',
} as const

export const staticPages = {
  home: {
    path: '/',
    title: 'Advokatska kancelarija Vladić Beograd – Nenad Vladić',
    description:
      'Advokatska kancelarija Vladić zastupa pravna i fizička lica u širokom spektru pravnih postupaka. Izdvaja nas opcija pomoći online putem.',
  },
  blog: {
    path: '/blog/',
    title: 'Blog – pravni saveti | Advokatska kancelarija Vladić Beograd',
    description:
      'Pravni saveti advokata Nenada Vladića: radno, porodično, imovinsko pravo, izvršenje i naknada štete – jasno objašnjena prava i postupci.',
    lead: 'Jasno objašnjena prava i postupci – da biste znali šta možete da očekujete i kada je pravo vreme da se obratite advokatu.',
  },
  tariff: {
    path: '/advokatska-tarifa/',
    title: 'Advokatska tarifa – cene advokatskih usluga | Nenad Vladić',
    description:
      'Naše usluge naplaćuju se prema važećoj Advokatskoj tarifi Republike Srbije, uz mogućnost individualnog dogovora u skladu sa složenošću slučaja.',
    lead: 'Naše usluge naplaćuju se prema važećoj Advokatskoj tarifi Republike Srbije, uz mogućnost individualnog dogovora u skladu sa složenošću slučaja i potrebnim angažovanjem. Verujemo u transparentnost i poverenje, pa klijent uvek unapred zna sve troškove i svaku fazu postupka.',
  },
  notFound: {
    path: '/404/',
    title: 'Stranica nije pronađena | Advokat Vladić',
    description: 'Tražena stranica ne postoji ili je premeštena.',
  },
  admin: {
    path: '/admin/',
    title: 'Administracija bloga | Advokat Vladić',
    description: 'Upravljanje člancima.',
  },
} as const

export const postTitle = (title: string, seoTitle?: string | null) => seoTitle || `${title} | ${site.shortName}`

const MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

/** "2026-06-30" → "30. jun 2026." */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d}. ${MONTHS[m - 1]} ${y}.`
}
