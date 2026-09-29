// apps/web/src/content/id.ts - Indonesian page copy, under /id.
//
// Only pages listed in packages/facts lang.ts TRANSLATED_PATHS appear here
// (lang.test.ts pins the two together). Links to an untranslated page use
// pathForLang(), which returns the English URL, so /id never links to a dead
// /id path. Every fact is read from packages/facts.
import {
  BANDS,
  DIFFERENTIATORS,
  PAGE_DATES,
  PAGE_PATHS,
  addressText,
  bandHours,
  business,
  cheapestBand,
  countText,
  hasPress,
  hoursText,
  leadClaim,
  lowestPrice,
  pathForLang,
  pressFactItems,
  quoteViews,
  rupiah,
  scheduleGrid,
  type PageKey,
} from "@__APP_NAME__/facts";
import type { LangContent, NavItem, PageCopy, Section } from "./types";

const L = "id" as const;
const b = business;
const city = b.address.city;
const area = b.address.area;
const href = (key: PageKey) => pathForLang(PAGE_PATHS[key], L);

const nav: NavItem[] = [
  { key: "home", label: "Beranda", href: href("home") },
  { key: "rates", label: "Harga", href: href("rates") },
  { key: "guide", label: "Panduan", href: href("guide") },
  { key: "contact", label: "Kontak", href: href("contact") },
];

function page(key: PageKey, rest: Omit<PageCopy, "key" | "lang" | "basePath" | "path" | "published" | "updated">): PageCopy {
  return {
    key,
    lang: L,
    basePath: PAGE_PATHS[key],
    path: href(key),
    published: PAGE_DATES[key].published,
    updated: PAGE_DATES[key].updated,
    ...rest,
  };
}

const pressSection: Section[] = hasPress()
  ? [
      {
        id: "press",
        heading: "Diliput media",
        list: pressFactItems(L).map((f) => ({ text: f.text, source: f.source })),
        quotes: quoteViews(),
      },
    ]
  : [];

const home = page("home", {
  title: `${b.name}, ${b.category.id} di ${city}, ${area}`,
  description: `${b.name} adalah ${b.category.id} di ${area}, ${city}. Buka ${hoursText(L)}, mulai ${rupiah(lowestPrice())} per jam. Harga dan panduan.`,
  breadcrumb: "Beranda",
  h1: `${b.name}, ${b.category.id} di ${city}`,
  lead: leadClaim(L),
  keyFacts: [
    { label: "Alamat", value: addressText() },
    { label: "Buka", value: hoursText(L) },
    { label: "Harga mulai", value: `${rupiah(lowestPrice())} per jam` },
    { label: "Ukuran", value: countText(L) },
  ],
  sections: [
    {
      id: "where",
      heading: `Di mana ${b.name}?`,
      paragraphs: [`${b.name} ada di ${addressText()}. ${b.address.landmark.id}.`],
      list: [{ text: "Buka peta", href: b.maps.shareUrl }],
    },
    {
      id: "facilities",
      heading: "Fasilitas",
      list: b.amenities.map((a) => ({ text: a.id })),
    },
    {
      id: "different",
      heading: "Apa bedanya",
      list: DIFFERENTIATORS.map((d) => ({ text: d.text.id, href: d.url.startsWith("/") ? pathForLang(d.url, L) : d.url })),
    },
    ...pressSection,
  ],
  faq: [
    {
      q: `Di mana lokasi ${b.name} di ${city}?`,
      a: `${b.name} ada di ${addressText()}. ${b.address.landmark.id}.`,
    },
    {
      q: `Jam berapa ${b.name} buka?`,
      a: `${b.name} buka ${hoursText(L)}. Pesan lebih dulu untuk jam malam.`,
    },
    {
      q: `Berapa biaya main di ${b.name}?`,
      a: `Harga mulai ${rupiah(lowestPrice())} per jam. Daftar lengkap dengan jam setiap tarif ada di halaman harga.`,
    },
  ],
});

const cheap = cheapestBand();
const rates = page("rates", {
  title: `Harga ${b.category.id} di ${city}, Tarif ${b.name}`,
  description: `Tarif ${b.category.id} di ${b.name}, ${city}: mulai ${rupiah(lowestPrice())} per jam, paling hemat ${bandHours(cheap, L)}. Semua tarif dengan jamnya.`,
  breadcrumb: "Harga",
  h1: `Harga di ${b.name}`,
  lead: `Harga mulai ${rupiah(lowestPrice())} per jam, pada tarif ${cheap.name.id} jam ${bandHours(cheap, L)}.`,
  keyFacts: [
    { label: "Jam paling hemat", value: bandHours(cheap, L) },
    { label: "Harga mulai", value: `${rupiah(lowestPrice())} per jam` },
  ],
  sections: [
    {
      id: "bands",
      heading: "Harga per tarif jam",
      table: {
        caption: "Harga per jam menurut tarif",
        head: ["Tarif", "Hari", "Jam", "Harga per jam"],
        rows: scheduleGrid(L),
        sentence: BANDS.map((x) => `${x.name.id} berlaku ${bandHours(x, L)} dengan harga ${rupiah(x.pricePerHour)} per jam.`).join(" "),
      },
    },
  ],
  faq: [
    {
      q: `Jam berapa main di ${b.name} paling hemat?`,
      a: `Jam paling hemat adalah ${bandHours(cheap, L)}, dengan harga ${rupiah(cheap.pricePerHour)} per jam. Itu tarif ${cheap.name.id}.`,
    },
    {
      q: `Berapa harga satu jam di ${b.name}?`,
      a: `Satu jam mulai ${rupiah(lowestPrice())}. Harganya tergantung tarif jam di tabel di atas.`,
    },
  ],
});

const contact = page("contact", {
  title: `Kontak ${b.name}, ${city}: WhatsApp dan Jam Buka`,
  description: `Hubungi ${b.name} di ${city}: WhatsApp ${b.phone}, email ${b.email}. Buka ${hoursText(L)}.`,
  breadcrumb: "Kontak",
  h1: `Kontak ${b.name}`,
  lead: `WhatsApp adalah cara tercepat menghubungi ${b.name}.`,
  keyFacts: [
    { label: "WhatsApp", value: b.phone },
    { label: "Email", value: b.email },
    { label: "Alamat", value: addressText() },
    { label: "Buka", value: hoursText(L) },
  ],
  sections: [
    {
      id: "channels",
      heading: "Ke mana saya bisa menghubungi?",
      list: [
        { text: "Chat di WhatsApp", href: b.whatsappUrl },
        { text: "Pesan jadwal", href: b.bookingUrl },
        { text: "Buka peta", href: b.maps.shareUrl },
      ],
    },
  ],
  faq: [
    {
      q: `Berapa nomor telepon ${b.name}?`,
      a: `Nomornya ${b.phone}, untuk WhatsApp dan telepon. Pesan dibalas pada jam buka.`,
    },
  ],
});

export const ID: LangContent = {
  site: {
    lang: L,
    brand: b.name,
    nav,
    keyFactsHeading: "Fakta utama",
    faqHeading: "Pertanyaan yang sering ditanyakan",
    updatedLabel: "Diperbarui",
    byLabel: "Oleh",
    footerLinks: [nav[3]!, nav[1]!, nav[2]!],
    footerLine: `${b.name}, ${addressText()}.`,
    notFound: {
      title: `Halaman tidak ditemukan | ${b.name}`,
      h1: "Halaman ini tidak ada",
      body: "Tautannya mungkin sudah lama. Mulai lagi dari beranda.",
      homeLabel: "Ke beranda",
    },
  },
  pages: { home, rates, contact },
};
