// packages/facts/src/press.ts - independent coverage, verified.
//
// An article enters this record only after it was fetched and read (write the
// checkedOn date). A quote is a WHOLE sentence of 15 words or fewer, copied
// verbatim, attributed to speaker, role, outlet and date, and checked against
// the article on the day it is added (hard law 6). Never quote a known error.
// content.test.ts enforces the quote rules and that every citation on a page
// equals this record. Remove dead links (GEO-12).
//
// No coverage yet? Leave ARTICLES and QUOTES empty; GEO-08 is then N/A.
import { ownerFact } from "./placeholder";

export interface Article {
  id: string;
  outlet: string;
  title: string;
  url: string;
  date: string; // YYYY-MM-DD, as published
  checkedOn: string; // YYYY-MM-DD, the day it was fetched and read
}

export interface Quote {
  id: string;
  articleId: string;
  text: string;
  speaker: string;
  role: string;
  checkedOn: string;
}

/** A third-party claim shown beside its source (GEO-07). */
export interface PressFact {
  id: string;
  text: { en: string; id: string };
  articleId: string;
}

export const ARTICLES: Article[] = [
  {
    id: "article-1",
    outlet: ownerFact("outlet name"),
    title: ownerFact("article headline"),
    url: ownerFact("article URL"),
    date: ownerFact("publication date YYYY-MM-DD"),
    checkedOn: ownerFact("date the article was fetched and read"),
  },
];

export const QUOTES: Quote[] = [
  {
    id: "quote-1",
    articleId: "article-1",
    text: ownerFact("verbatim whole sentence, 15 words or fewer"),
    speaker: ownerFact("speaker"),
    role: ownerFact("speaker role"),
    checkedOn: ownerFact("date checked against the article"),
  },
];

export const PRESS_FACTS: PressFact[] = [
  { id: "fact-1", text: { en: ownerFact("press fact EN"), id: ownerFact("press fact ID") }, articleId: "article-1" },
];

export function articleById(id: string): Article {
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) throw new Error(`press.ts: unknown article ${id}`);
  return a;
}

export function quoteById(id: string): Quote {
  const q = QUOTES.find((x) => x.id === id);
  if (!q) throw new Error(`press.ts: unknown quote ${id}`);
  return q;
}
