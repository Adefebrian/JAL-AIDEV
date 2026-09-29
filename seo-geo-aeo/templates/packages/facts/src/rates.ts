// packages/facts/src/rates.ts - prices and time bands, defined once.
//
// Every band states its clock hours, because "jam berapa paling murah"
// (which hour is cheapest) is a real assistant question and the answer is
// the hours, not the band name. Replace each placeholder with the owner's
// confirmed value and date.
import { ownerFact, ownerNumber, showNumber } from "./placeholder";
import type { Lang } from "./lang";

export interface Band {
  id: string;
  name: Record<Lang, string>;
  /** schema.org day names this band applies to. */
  days: string[];
  from: string; // "HH:MM"
  to: string; // "HH:MM", midnight is 23:59
  pricePerHour: number;
}

export const CURRENCY = "IDR";

// confirmed: <YYYY-MM-DD> by <owner>
export const BANDS: Band[] = [
  {
    id: "offpeak",
    name: { en: ownerFact("off-peak band name EN"), id: ownerFact("off-peak band name ID") },
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    from: ownerFact("off-peak start HH:MM"),
    to: ownerFact("off-peak end HH:MM"),
    pricePerHour: ownerNumber("off-peak price per hour"),
  },
  {
    id: "peak",
    name: { en: ownerFact("peak band name EN"), id: ownerFact("peak band name ID") },
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    from: ownerFact("peak start HH:MM"),
    to: ownerFact("peak end HH:MM"),
    pricePerHour: ownerNumber("peak price per hour"),
  },
];

/** Thousands grouped with a dot, no Intl, so server and browser agree byte for byte. */
export function rupiah(n: number): string {
  return showNumber(n, (v) => `Rp ${String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`);
}

/** "06:00 to 16:00" in copy; the words differ per language. */
export function bandHours(band: Band, lang: Lang): string {
  return lang === "id" ? `${band.from} sampai ${band.to}` : `${band.from} to ${band.to}`;
}

const DAY_NAMES: Record<Lang, Record<string, string>> = {
  en: { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" },
  id: { Monday: "Sen", Tuesday: "Sel", Wednesday: "Rab", Thursday: "Kam", Friday: "Jum", Saturday: "Sab", Sunday: "Min" },
};

export function dayRange(days: string[], lang: Lang): string {
  if (days.length === 7) return lang === "id" ? "setiap hari" : "every day";
  const first = days[0] ?? "";
  const last = days[days.length - 1] ?? "";
  const names = DAY_NAMES[lang];
  return days.length === 1 ? (names[first] ?? first) : `${names[first] ?? first} ${lang === "id" ? "sampai" : "to"} ${names[last] ?? last}`;
}

/** Rows for the rates table: band, days, clock hours, price. */
export function scheduleGrid(lang: Lang): string[][] {
  return BANDS.map((b) => [b.name[lang], dayRange(b.days, lang), bandHours(b, lang), rupiah(b.pricePerHour)]);
}

export function lowestPrice(): number {
  return Math.min(...BANDS.map((b) => b.pricePerHour));
}

export function cheapestBand(): Band {
  return BANDS.reduce((a, b) => (b.pricePerHour < a.pricePerHour ? b : a));
}

/** schema.org priceRange text, e.g. "Rp 200.000 to Rp 350.000 per hour". */
export function priceRange(): string {
  const prices = BANDS.map((b) => b.pricePerHour);
  return `${rupiah(Math.min(...prices))} to ${rupiah(Math.max(...prices))} per hour`;
}
