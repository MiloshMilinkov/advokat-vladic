import type { IconName } from '@/lib/icons'

export const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: 'user', title: 'Individualan pristup', text: 'Svaki predmet je drugačiji. Pažljivo slušamo i upoznajemo se sa svim okolnostima vašeg slučaja.' },
  { icon: 'search', title: 'Detaljna analiza', text: 'Temeljna priprema i analiza pravnih i činjeničnih pitanja – uz punu pravnu preciznost.' },
  { icon: 'scales', title: 'Strateško zastupanje', text: 'Zastupanje pred sudovima, državnim organima i institucijama, sa jasnom strategijom.' },
  { icon: 'shield', title: 'Poverenje i diskrecija', text: 'Zastupanje nije formalnost, već ozbiljna odgovornost koja zahteva posvećenost i diskreciju.' },
]

export const reviews = [
  {
    name: 'Milan Ristić',
    date: '29. 9. 2025.',
    text: 'Gospodin Nenad je osoba zbog koje sam ja sada bez brige u pogledu pravnih stvari! Apsolutno poverenje koje svaki put opravda svojim znanjem i borbenošću, a ujedno sasvim prirodan, pristupačan i pun empatije! Svaka preporuka za najboljeg advokata!',
  },
  {
    name: 'Pavle Rakočević',
    date: '29. 9. 2025.',
    text: 'Veoma profesionalan i posvećen. Od prvog kontakta do završetka postupka, sve je bilo jasno objašnjeno i efikasno urađeno. Pružio mi je osećaj sigurnosti i poverenja tokom celog procesa. Preporuka svima kojima je potrebna pravna pomoć!',
  },
  {
    name: 'Nemanja Egić',
    date: '29. 9. 2025.',
    text: 'Nenada sam kontaktirao po preporuci zbog imovinsko-pravnog spora. Od prvog susreta Nenad je pokazao posvećenost i strpljenje, sve mi je jasno objasnio i bio dostupan za sva pitanja. Sve preporuke za Nenada.',
  },
  { name: 'Isidora', date: '7. 10. 2025.', text: 'Posvećen, prijatan, empatičan, a borben. Sve preporuke za ovog advokata!' },
  {
    name: 'Milica Marković',
    date: '29. 9. 2025.',
    text: 'Profesionalan, precizan i prijatan, a najvažnije stručan. Bilo je zadovoljstvo sarađivati sa njim, sve preporuke!',
  },
]

/** YouTube appearances; thumbnails are self-hosted in public/images/yt. */
export const videos: { id: string; channel: string; title: string; widths: [number, number] }[] = [
  { id: 'BrAAMMuky-o', channel: 'Newsmax Balkans', title: 'Emisija Presek', widths: [400, 640] },
  { id: 'D_cwcatpGpo', channel: 'Newsmax Balkans', title: 'Emisija Presek', widths: [400, 640] },
  { id: 'Y7gifb4JXQY', channel: 'TV UNA', title: 'Emisija Podne', widths: [400, 640] },
  { id: 'rby9KllEX2s', channel: 'TV UNA', title: 'Emisija Podne', widths: [400, 480] },
  { id: 'G8t9uAEQnt8', channel: 'Newsmax Balkans', title: 'Jutarnji program', widths: [400, 640] },
  { id: 'O5OSheUb4SA', channel: 'Podcast', title: 'Podcast „Ono pravo”', widths: [400, 640] },
  { id: 'khwDnv5iC44', channel: 'TV Nova S', title: 'Jutarnji program', widths: [400, 640] },
]
