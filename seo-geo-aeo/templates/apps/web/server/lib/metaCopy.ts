// apps/web/server/lib/metaCopy.ts - the route-table copy: title and
// description per page and language.
//
// Owned by the SAME author as apps/web/src/content (jal-frontend), because it
// mirrors that copy byte for byte (hard law 3). meta.test.ts compares every
// title and description here with the client copy and fails on any drift.
// It reads facts only from packages/facts, never from apps/web/src (the
// runtime image carries no client source). With dist/seo.json missing, the
// server still sends a correct head from this file.
import {
  bandHours,
  business,
  cheapestBand,
  hoursText,
  lowestPrice,
  rupiah,
  type Lang,
  type PageKey,
} from "@__APP_NAME__/facts";

export interface MetaCopy {
  title: string;
  description: string;
}

const b = business;
const city = b.address.city;
const area = b.address.area;
const cheap = cheapestBand();

export const META_COPY: Record<Lang, Partial<Record<PageKey, MetaCopy>>> = {
  en: {
    home: {
      title: `${b.name}, ${b.category.en} in ${city}, ${area}`,
      description: `${b.name} is a ${b.category.en} in ${area}, ${city}. Open ${hoursText("en")}, from ${rupiah(lowestPrice())} per hour. Rates, a guide and answers.`,
    },
    rates: {
      title: `${b.category.en} Prices in ${city}, Rates at ${b.name}`,
      description: `${b.category.en} rates at ${b.name}, ${city}: from ${rupiah(lowestPrice())} per hour, cheapest ${bandHours(cheap, "en")}. Every band with its clock hours.`,
    },
    guide: {
      title: `${b.topic.name} in ${city}: Beginner Guide at ${b.name}`,
      description: `How to play your first game at ${b.name}, ${city}: book online, arrive early, rent gear. Open ${hoursText("en")}, from ${rupiah(lowestPrice())}.`,
    },
    contact: {
      title: `Contact ${b.name}, ${city}: WhatsApp and Hours`,
      description: `Reach ${b.name} in ${city} on WhatsApp ${b.phone} or ${b.email}. Open ${hoursText("en")}. Address and map inside.`,
    },
  },
  id: {
    home: {
      title: `${b.name}, ${b.category.id} di ${city}, ${area}`,
      description: `${b.name} adalah ${b.category.id} di ${area}, ${city}. Buka ${hoursText("id")}, mulai ${rupiah(lowestPrice())} per jam. Harga dan panduan.`,
    },
    rates: {
      title: `Harga ${b.category.id} di ${city}, Tarif ${b.name}`,
      description: `Tarif ${b.category.id} di ${b.name}, ${city}: mulai ${rupiah(lowestPrice())} per jam, paling hemat ${bandHours(cheap, "id")}. Semua tarif dengan jamnya.`,
    },
    contact: {
      title: `Kontak ${b.name}, ${city}: WhatsApp dan Jam Buka`,
      description: `Hubungi ${b.name} di ${city}: WhatsApp ${b.phone}, email ${b.email}. Buka ${hoursText("id")}.`,
    },
  },
};

/** The 404 page per language (noindex, still at least 15 characters). */
export const NOT_FOUND_COPY: Record<Lang, MetaCopy> = {
  en: { title: `Page not found | ${b.name}`, description: "This page does not exist. Start again from the home page." },
  id: { title: `Halaman tidak ditemukan | ${b.name}`, description: "Halaman ini tidak ada. Mulai lagi dari beranda." },
};

/** Noindex routes that still get a shell (the app, the admin view). */
export const NOINDEX_COPY: { path: string; shell: "public" | "admin"; copy: MetaCopy }[] = [
  { path: "/app", shell: "public", copy: { title: `${b.name} app`, description: `${b.name} app.` } },
  { path: `${b.adminPath}/crawl`, shell: "admin", copy: { title: `Crawler log | ${b.name}`, description: "Crawler log." } },
];

/** Unhashed files in apps/web/public, linked from the head (integrate.md 8.2). */
export const PUBLIC_ICONS: { rel: string; href: string; type?: string; sizes?: string }[] = [
  // { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  // { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
  // { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

/** Third-party origins the page fetches from early. */
export const PRECONNECT: string[] = [];
