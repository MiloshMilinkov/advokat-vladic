// Practice areas ("Oblasti rada"): drives the home cards, nav dropdown, footer,
// practice pages and their SEO tags (shared by the SPA and the Worker).

export interface PracticeArea {
  slug: string
  /** Short name used in nav, breadcrumbs and cards. */
  name: string
  cardText: string
  /** <h1> of the practice page. */
  title: string
  lead: string
  metaTitle: string
  metaDescription: string
  serviceType: string
  serviceDescription: string
  /** Blog category whose posts are listed at the bottom of the page. */
  blogCategory: string
  coverWidth: number
  coverHeight: number
}

export const practiceAreas: PracticeArea[] = [
  {
    "slug": "advokat-za-radno-pravo",
    "name": "Radno pravo",
    "cardText": "Nezakonit otkaz, mobing, diskriminacija, neisplaćene zarade, povrede na radu i drugi sporovi iz radnog odnosa.",
    "title": "Advokat za radno pravo Beograd",
    "lead": "Advokatska kancelarija Vladić pruža pravnu pomoć zaposlenima i poslodavcima u svim oblastima radnog prava, uključujući radne sporove, nezakonit otkaz, mobing, diskriminaciju na radu, neisplaćene zarade i zaštitu prava zaposlenih.",
    "metaTitle": "Advokat za radno pravo Beograd | Nenad Vladić",
    "metaDescription": "Advokat za radno pravo u Beogradu. Pravna pomoć u vezi sa otkazom ugovora o radu, mobingom, neisplaćenom zaradom, godišnjim odmorom i zaštitom prava zaposlenih.",
    "serviceType": "Radno pravo",
    "serviceDescription": "Advokat za radno pravo u Beogradu. Pravna pomoć u vezi sa otkazom ugovora o radu, mobingom, neisplaćenom zaradom, godišnjim odmorom i zaštitom prava zaposlenih.",
    "blogCategory": "radno-pravo",
    "coverWidth": 2000,
    "coverHeight": 1333
  },
  {
    "slug": "advokat-za-privredno-pravo",
    "name": "Privredno pravo",
    "cardText": "Osnivanje društava, ugovori i interni akti, statusne promene, naplata potraživanja i privredni sporovi.",
    "title": "Advokat za privredno pravo Beograd",
    "lead": "Advokatska kancelarija pruža pravne usluge u oblasti privrednog prava, obuhvatajući sve faze osnivanja, poslovanja i zaštite interesa pravnih lica i preduzetnika.",
    "metaTitle": "Advokat za privredno pravo Beograd | Nenad Vladić",
    "metaDescription": "Advokat za privredno pravo Nenad Vladić pomaže oko osnivanja pravnih lica, komercijalnih ugovora, privrednih sporova i drugih usluga.",
    "serviceType": "Privredno pravo",
    "serviceDescription": "Advokat za privredno pravo Nenad Vladić pomaže oko osnivanja pravnih lica, komercijalnih ugovora, privrednih sporova i drugih usluga.",
    "blogCategory": "privredno-pravo",
    "coverWidth": 2000,
    "coverHeight": 1331
  },
  {
    "slug": "advokat-za-porodicno-i-nasledno-pravo",
    "name": "Porodično i nasledno pravo",
    "cardText": "Razvod, alimentacija, roditeljsko pravo, podela imovine, testamenti i ostavinski postupci – uz potpunu diskreciju.",
    "title": "Advokat za porodično i nasledno pravo Beograd",
    "lead": "Advokatska kancelarija Vladić pruža pravnu pomoć i zastupanje u svim oblastima porodičnog i naslednog prava, uključujući razvode brakova, starateljstvo nad decom, alimentaciju, podelu imovine, zaštitu od nasilja u porodici, ostavinske postupke i nasledne sporove.",
    "metaTitle": "Advokat za porodično i nasledno pravo Beograd | Nenad Vladić",
    "metaDescription": "Advokat za porodično i nasledno pravo u Beogradu. Pravna pomoć u vezi sa razvodom, alimentacijom, poveravanjem dece, podelom imovine, testamentom i ostavinom.",
    "serviceType": "Porodično i nasledno pravo",
    "serviceDescription": "Advokat za porodično i nasledno pravo u Beogradu. Pravna pomoć u vezi sa razvodom, alimentacijom, poveravanjem dece, podelom imovine, testamentom i ostavinom.",
    "blogCategory": "porodicno-pravo",
    "coverWidth": 2000,
    "coverHeight": 1125
  },
  {
    "slug": "advokat-za-imovinsko-pravne-odnose",
    "name": "Imovinsko pravni odnosi",
    "cardText": "Nekretnine, smetanje državine, naknada štete, izvršni postupci i izrada svih vrsta ugovora.",
    "title": "Advokat za imovinsko pravo, nekretnine i izvršni postupak Beograd",
    "lead": "Advokatska kancelarija Vladić pruža pravnu pomoć i zastupanje u svim oblastima imovinskog prava, obligacionih odnosa, prava svojine, nekretnina i izvršnih postupaka, sa posebnim fokusom na zaštitu imovinskih prava, pravnu sigurnost prilikom prometa nepokretnosti i efikasnu naplatu potraživanja.",
    "metaTitle": "Advokat za imovinsko pravne odnose Beograd | Nenad Vladić",
    "metaDescription": "Advokat za imovinske odnose u Beogradu. Pravna pomoć u vezi kupoprodaje nepokretnosti, ugovorima, iseljenjem, svojinskim sporovima i zaštitom imovinskih prava.",
    "serviceType": "Imovinsko pravni odnosi",
    "serviceDescription": "Advokat za imovinske odnose u Beogradu. Pravna pomoć u vezi kupoprodaje nepokretnosti, ugovorima, iseljenjem, svojinskim sporovima i zaštitom imovinskih prava.",
    "blogCategory": "imovinsko-pravo",
    "coverWidth": 2000,
    "coverHeight": 1335
  },
  {
    "slug": "advokat-za-krivicno-i-prekrsajno-pravo",
    "name": "Krivično i prekršajno pravo",
    "cardText": "Odbrana okrivljenih i zastupanje oštećenih – od pritvora i krivičnih prijava do žalbi i pravnih lekova.",
    "title": "Advokat za krivično i prekršajno pravo Beograd",
    "lead": "Advokatska kancelarija Vladić pruža pravnu pomoć i zastupanje u svim fazama krivičnih i prekršajnih postupaka, uz profesionalnu odbranu prava i interesa okrivljenih i oštećenih lica pred sudovima, tužilaštvima, policijom i drugim nadležnim organima.",
    "metaTitle": "Advokat za krivično i prekršajno pravo Beograd | Nenad Vladić",
    "metaDescription": "Advokat za krivično i prekršajno pravo Nenad Vladić pomaže okrivljenima i oštećenima u vezi pomilovanja, ukidanja pritvora, žalbi i drugih usluga.",
    "serviceType": "Krivično i prekršajno pravo",
    "serviceDescription": "Advokat za krivično i prekršajno pravo Nenad Vladić pomaže okrivljenima i oštećenima u vezi pomilovanja, ukidanja pritvora, žalbi i drugih usluga.",
    "blogCategory": "krivicno-pravo",
    "coverWidth": 2000,
    "coverHeight": 1362
  },
  {
    "slug": "advokat-za-upravno-pravo",
    "name": "Upravno pravo",
    "cardText": "Katastar, uknjižba, brisanje hipoteka, legalizacija objekata, državljanstvo i upravni sporovi.",
    "title": "Advokat za upravno pravo Beograd",
    "lead": "Advokatska kancelarija Vladić pruža pravnu pomoć i zastupanje u svim oblastima upravnog prava, upravnim postupcima i sporovima pred državnim organima, sa ciljem efikasne zaštite prava i interesa klijenata u odnosima sa organima uprave i drugim nadležnim institucijama.",
    "metaTitle": "Advokat za upravno pravo Beograd | Nenad Vladić",
    "metaDescription": "Advokat za upravno pravo u Beogradu. Pravna pomoć u postupcima pred katastrom nepokretnosti, upravnim sporovima, podnošenju tužbi i zaštiti prava građana.",
    "serviceType": "Upravno pravo",
    "serviceDescription": "Advokat za upravno pravo u Beogradu. Pravna pomoć u postupcima pred katastrom nepokretnosti, upravnim sporovima, podnošenju tužbi i zaštiti prava građana.",
    "blogCategory": "upravno-pravo",
    "coverWidth": 2000,
    "coverHeight": 1276
  }
]

export const practiceAreaBySlug = new Map(practiceAreas.map((a) => [a.slug, a]))
