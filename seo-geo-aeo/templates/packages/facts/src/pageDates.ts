// packages/facts/src/pageDates.ts - one dates record per content page.
//
// `published` is the first commit of the page in git:
//   git log --diff-filter=A --follow --format=%as -- apps/web/src/content/en.ts | tail -1
// `updated` is bumped by hand whenever the page's FACTS change. The sitemap
// lastmod, the JSON-LD dateModified and the visible <time> all follow it, in
// both languages (meta.test.ts checks this).
import { ownerFact } from "./placeholder";
import type { PageKey } from "./lang";

export interface PageDates {
  published: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
}

export const PAGE_DATES: Record<PageKey, PageDates> = {
  home: { published: ownerFact("home first commit date"), updated: ownerFact("home facts updated date") },
  rates: { published: ownerFact("rates first commit date"), updated: ownerFact("rates facts updated date") },
  guide: { published: ownerFact("guide first commit date"), updated: ownerFact("guide facts updated date") },
  contact: { published: ownerFact("contact first commit date"), updated: ownerFact("contact facts updated date") },
};
