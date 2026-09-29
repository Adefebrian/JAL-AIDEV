// packages/facts/src/derived.ts - short strings computed from the facts, used
// by the client copy (apps/web/src/content), the route-table copy
// (apps/web/server/lib/metaCopy.ts) and the generator alike, so a fact is
// phrased the same way everywhere. Pure: reads only sibling fact modules.
import { business } from "./business";
import type { Lang } from "./lang";
import { showNumber } from "./placeholder";
import { ARTICLES, PRESS_FACTS, QUOTES, articleById } from "./press";
import { dayRange } from "./rates";

export function hoursText(lang: Lang): string {
  const to = lang === "id" ? "sampai" : "to";
  return business.hours.map((h) => `${dayRange(h.days, lang)} ${h.opens} ${to} ${h.closes}`).join(", ");
}

export function addressText(): string {
  const a = business.address;
  return `${a.street}, ${a.district}, ${a.area}, ${a.city}, ${a.region} ${a.postalCode}`;
}

export function countText(lang: Lang): string {
  const c = business.counts[0];
  if (!c) return "";
  return `${showNumber(c.value, (n) => String(n))} ${c.label[lang]}`;
}

export interface PressSource {
  name: string;
  url: string;
  pressId: string;
}

export function pressSource(articleId: string): PressSource {
  const a = articleById(articleId);
  return { name: a.outlet, url: a.url, pressId: a.id };
}

export interface QuoteViewData {
  id: string;
  text: string;
  speaker: string;
  role: string;
  outlet: string;
  url: string;
  date: string;
}

export function quoteViews(): QuoteViewData[] {
  return QUOTES.map((q) => {
    const a = articleById(q.articleId);
    return { id: q.id, text: q.text, speaker: q.speaker, role: q.role, outlet: a.outlet, url: a.url, date: a.date };
  });
}

export function pressFactItems(lang: Lang): { text: string; source: PressSource }[] {
  return PRESS_FACTS.map((f) => ({ text: f.text[lang], source: pressSource(f.articleId) }));
}

export function hasPress(): boolean {
  return ARTICLES.length > 0;
}

/** The first person the owner allows to be named, or the business itself. */
export function bylineAuthor(): string {
  return business.people.find((p) => p.publish)?.name ?? business.name;
}
