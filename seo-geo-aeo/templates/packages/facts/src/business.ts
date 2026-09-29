// packages/facts/src/business.ts - who, where, when: the entity facts.
//
// ONE SOURCE PER FACT (hard law 3). Name, address, phone, hours, geo and
// channels are defined here once. Pages, JSON-LD, llms.txt, summary.json and
// the head all read them from here; nothing restates them as a literal.
//
// Every value is an ownerFact()/ownerNumber() placeholder until the owner
// confirms it. When you replace one, write the confirmation date beside it:
//   name: "Real Name", // confirmed 2026-09-29 by <owner name>, WhatsApp
// content.test.ts fails while any placeholder reaches a served body.
import { PLACEHOLDER_ORIGIN, ownerFact, ownerNumber } from "./placeholder";

export interface Person {
  name: string;
  role: { en: string; id: string };
  credentials?: string;
  /** Only people the owner allows to be named. publish:false never appears. */
  publish: boolean;
}

export interface OpeningHours {
  /** schema.org day names, e.g. ["Monday", "Tuesday"]. */
  days: string[];
  opens: string; // "HH:MM"
  /** Midnight is written 23:59, never 24:00 (standard SEO-07). */
  closes: string;
}

export const business = {
  // confirmed: <YYYY-MM-DD> by <owner>
  name: ownerFact("official business name"),
  // confirmed: <YYYY-MM-DD> by <owner>. The names people actually type.
  alternateNames: [ownerFact("alternate name people use")],
  // The category word used in titles and llms.txt, e.g. "Padel Club".
  category: { en: ownerFact("category in English"), id: ownerFact("category in Indonesian") },
  // schema.org types: place is LocalBusiness plus the most specific subtypes;
  // the organization carries its industry subtype.
  placeTypes: ["LocalBusiness"] as string[],
  orgTypes: ["Organization"] as string[],
  // confirmed: <YYYY-MM-DD>. Canonical origin, https, one host, no trailing slash.
  website: PLACEHOLDER_ORIGIN,
  address: {
    street: ownerFact("street address"),
    district: ownerFact("district or kelurahan"),
    area: ownerFact("area named in titles, e.g. the kecamatan"),
    city: ownerFact("city"),
    region: ownerFact("province"),
    postalCode: ownerFact("postcode"),
    country: "ID",
    /** ISO 3166-2 code for geo.region, e.g. "ID-JB". */
    regionCode: ownerFact("ISO 3166-2 region code"),
    landmark: { en: ownerFact("landmark or directions in English"), id: ownerFact("landmark in Indonesian") },
  },
  // Resolve the owner's map share link to coordinates and the ?cid= URL.
  geo: { lat: ownerNumber("latitude"), lng: ownerNumber("longitude") },
  maps: {
    shareUrl: ownerFact("map share link"),
    cidUrl: ownerFact("https://maps.google.com/?cid=<cid> resolved from the share link"),
  },
  timezone: "Asia/Jakarta",
  hours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: ownerFact("opening time HH:MM"),
      closes: ownerFact("closing time HH:MM, midnight is 23:59"),
    },
  ] as OpeningHours[],
  phone: ownerFact("phone in +62 format"),
  whatsappUrl: ownerFact("https://wa.me/<number>"),
  email: ownerFact("public email"),
  bookingUrl: ownerFact("booking platform URL"),
  communityUrl: ownerFact("community platform URL"),
  // Socials, booking, community and the maps cid, used as sameAs.
  sameAs: [ownerFact("social profile URL")],
  openedOn: ownerFact("official opening date YYYY-MM-DD"),
  /** Counts that answer "how many" questions, e.g. courts. */
  counts: [{ label: { en: ownerFact("count label EN"), id: ownerFact("count label ID") }, value: ownerNumber("count") }],
  amenities: [{ en: ownerFact("amenity EN"), id: ownerFact("amenity ID") }],
  programmes: [
    {
      name: { en: ownerFact("programme name EN"), id: ownerFact("programme name ID") },
      detail: { en: ownerFact("ages, level, duration EN"), id: ownerFact("ages, level, duration ID") },
    },
  ],
  people: [
    {
      name: ownerFact("person the owner allows to be named"),
      role: { en: ownerFact("role EN"), id: ownerFact("role ID") },
      publish: true,
    },
  ] as Person[],
  /** The topic the business is about, linked to Wikidata and Wikipedia.
   * Search the items in the UI; never guess a Q-id (offsite.md). */
  topic: { name: ownerFact("topic, e.g. the sport"), sameAs: [] as string[] },
  /** og:image: a 1200x630 PNG under dist or a CDN path, never SVG. */
  ogImage: ownerFact("/og.png (1200x630 PNG)"),
  /** /.well-known/ai.txt Content-Signal for AI training. The owner decides. */
  aiTrain: ownerFact("yes or no: may AI models train on this site"),
  /** Admin path disallowed in robots.txt and served noindex. */
  adminPath: "/admin",
};
