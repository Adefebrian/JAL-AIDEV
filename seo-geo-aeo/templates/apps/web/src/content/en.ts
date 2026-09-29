// apps/web/src/content/en.ts - English page copy (default language, bare paths).
//
// Copy only: every fact is read from packages/facts. Titles follow the formulas in
// standard.md 12.3 and must land at 50 to 60 characters with the real facts;
// descriptions at 120 to 158 (meta.test.ts). If a title runs long once the
// owner's facts are in, shorten the words here, never the facts.
import {
  BANDS,
  DIFFERENTIATORS,
  PAGE_DATES,
  PAGE_PATHS,
  addressText,
  bandHours,
  business,
  bylineAuthor,
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

const L = "en" as const;
const b = business;
const city = b.address.city;
const area = b.address.area;
const href = (key: PageKey) => pathForLang(PAGE_PATHS[key], L);

const nav: NavItem[] = [
  { key: "home", label: "Home", href: href("home") },
  { key: "rates", label: "Rates", href: href("rates") },
  { key: "guide", label: "Guide", href: href("guide") },
  { key: "contact", label: "Contact", href: href("contact") },
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
        heading: "In the press",
        list: pressFactItems(L).map((f) => ({ text: f.text, source: f.source })),
        quotes: quoteViews(),
      },
    ]
  : [];

const home = page("home", {
  title: `${b.name}, ${b.category.en} in ${city}, ${area}`,
  description: `${b.name} is a ${b.category.en} in ${area}, ${city}. Open ${hoursText(L)}, from ${rupiah(lowestPrice())} per hour. Rates, a guide and answers.`,
  breadcrumb: "Home",
  h1: `${b.name}, ${b.category.en} in ${city}`,
  lead: leadClaim(L),
  keyFacts: [
    { label: "Address", value: addressText() },
    { label: "Open", value: hoursText(L) },
    { label: "Price from", value: `${rupiah(lowestPrice())} per hour` },
    { label: "Size", value: countText(L) },
  ],
  sections: [
    {
      id: "where",
      heading: `Where is ${b.name}?`,
      paragraphs: [`${b.name} is at ${addressText()}. ${b.address.landmark.en}.`],
      list: [{ text: "Open the map", href: b.maps.shareUrl }],
    },
    {
      id: "facilities",
      heading: "Facilities",
      list: b.amenities.map((a) => ({ text: a.en })),
    },
    {
      id: "different",
      heading: "What makes it different",
      list: DIFFERENTIATORS.map((d) => ({ text: d.text.en, href: d.url.startsWith("/") ? pathForLang(d.url, L) : d.url })),
    },
    ...pressSection,
  ],
  faq: [
    {
      q: `Where is ${b.name} in ${city}?`,
      a: `${b.name} is at ${addressText()}. ${b.address.landmark.en}.`,
    },
    {
      q: `What time is ${b.name} open?`,
      a: `${b.name} is open ${hoursText(L)}. Book ahead for evenings.`,
    },
    {
      q: `How much does it cost to play at ${b.name}?`,
      a: `Prices start at ${rupiah(lowestPrice())} per hour. The full list with the clock hours of each band is on the rates page.`,
    },
  ],
});

const cheap = cheapestBand();
const rates = page("rates", {
  title: `${b.category.en} Prices in ${city}, Rates at ${b.name}`,
  description: `${b.category.en} rates at ${b.name}, ${city}: from ${rupiah(lowestPrice())} per hour, cheapest ${bandHours(cheap, L)}. Every band with its clock hours.`,
  breadcrumb: "Rates",
  h1: `${b.name} rates`,
  lead: `Prices start at ${rupiah(lowestPrice())} per hour, in the ${cheap.name.en} band from ${bandHours(cheap, L)}.`,
  keyFacts: [
    { label: "Cheapest hours", value: bandHours(cheap, L) },
    { label: "Price from", value: `${rupiah(lowestPrice())} per hour` },
  ],
  sections: [
    {
      id: "bands",
      heading: "Rates by time band",
      table: {
        caption: "Price per hour by band",
        head: ["Band", "Days", "Hours", "Price per hour"],
        rows: scheduleGrid(L),
        sentence: BANDS.map((x) => `${x.name.en} runs ${bandHours(x, L)} at ${rupiah(x.pricePerHour)} per hour.`).join(" "),
      },
    },
  ],
  faq: [
    {
      q: `What is the cheapest time to play at ${b.name}?`,
      a: `The cheapest time is ${bandHours(cheap, L)}, at ${rupiah(cheap.pricePerHour)} per hour. That is the ${cheap.name.en} band.`,
    },
    {
      q: `How much is one hour at ${b.name}?`,
      a: `One hour costs from ${rupiah(lowestPrice())}. The price depends on the band shown in the table above.`,
    },
  ],
});

const guide = page("guide", {
  title: `${b.topic.name} in ${city}: Beginner Guide at ${b.name}`,
  description: `How to play your first game at ${b.name}, ${city}: book online, arrive early, rent gear. Open ${hoursText(L)}, from ${rupiah(lowestPrice())}.`,
  breadcrumb: "Guide",
  h1: `Your first game at ${b.name}`,
  lead: `Book a slot online, arrive a little early, and play. The steps below take about five minutes to read.`,
  byline: { author: bylineAuthor() },
  sections: [
    {
      id: "steps",
      heading: "How do I play my first game?",
      steps: [
        `Book a slot on ${b.bookingUrl}.`,
        `Arrive 15 minutes before your slot at ${addressText()}.`,
        `Play within the opening hours, ${hoursText(L)}.`,
      ],
    },
  ],
  faq: [
    {
      q: `Do I need to book before I come to ${b.name}?`,
      a: `Yes, book a slot online first. Walk-ins play only when a slot is free.`,
    },
  ],
});

const contact = page("contact", {
  title: `Contact ${b.name}, ${city}: WhatsApp and Hours`,
  description: `Reach ${b.name} in ${city} on WhatsApp ${b.phone} or ${b.email}. Open ${hoursText(L)}. Address and map inside.`,
  breadcrumb: "Contact",
  h1: `Contact ${b.name}`,
  lead: `WhatsApp is the fastest way to reach ${b.name}.`,
  keyFacts: [
    { label: "WhatsApp", value: b.phone },
    { label: "Email", value: b.email },
    { label: "Address", value: addressText() },
    { label: "Open", value: hoursText(L) },
  ],
  sections: [
    {
      id: "channels",
      heading: "Where can I reach you?",
      list: [
        { text: "Chat on WhatsApp", href: b.whatsappUrl },
        { text: "Book a slot", href: b.bookingUrl },
        { text: "Open the map", href: b.maps.shareUrl },
      ],
    },
  ],
  faq: [
    {
      q: `What is the phone number of ${b.name}?`,
      a: `The number is ${b.phone}, on WhatsApp and phone. Messages are answered during opening hours.`,
    },
  ],
});

export const EN: LangContent = {
  site: {
    lang: L,
    brand: b.name,
    nav,
    keyFactsHeading: "Key facts",
    faqHeading: "Questions people ask",
    updatedLabel: "Updated",
    byLabel: "By",
    footerLinks: [nav[3]!, nav[1]!, nav[2]!],
    footerLine: `${b.name}, ${addressText()}.`,
    notFound: {
      title: `Page not found | ${b.name}`,
      h1: "This page does not exist",
      body: "The link may be old. Start again from the home page.",
      homeLabel: "Go to the home page",
    },
  },
  pages: { home, rates, guide, contact },
};
