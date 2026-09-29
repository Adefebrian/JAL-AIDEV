// apps/web/src/content/types.ts - the shape of page copy, per language.
// The client renders it (src/pages/SitePage.tsx) and the build-time generator
// (src/seo/content.ts) renders the SAME components from the SAME objects, so
// the prerendered body is the page's own first paint (hard law 2).
import type { Lang, PageKey } from "@__APP_NAME__/facts";
import type { FaqEntry, KeyFact, Source } from "@__APP_NAME__/ui";

export type { FaqEntry, KeyFact, Source };

export interface Table {
  caption: string;
  head: string[];
  rows: string[][];
  /** The same data as one sentence: merged cells flatten badly (AEO-09). */
  sentence: string;
}

export interface LinkItem {
  text: string;
  href?: string;
  source?: Source;
}

export interface QuoteView {
  id: string;
  text: string;
  speaker: string;
  role: string;
  outlet: string;
  url: string;
  date: string;
}

export interface Section {
  id: string;
  heading: string;
  paragraphs?: string[];
  table?: Table;
  /** Ordered steps; a page with steps gets HowTo markup equal to them. */
  steps?: string[];
  list?: LinkItem[];
  quotes?: QuoteView[];
}

export interface PageCopy {
  key: PageKey;
  lang: Lang;
  /** Base path (default language), e.g. "/rates". */
  basePath: string;
  /** URL path in this language, e.g. "/id/rates". */
  path: string;
  /** 50 to 60 characters, names the place (hard law 7). */
  title: string;
  /** 120 to 158 characters, the answer first. */
  description: string;
  breadcrumb: string;
  h1: string;
  lead: string;
  keyFacts?: KeyFact[];
  sections: Section[];
  faq: FaqEntry[];
  /** Editorial pages carry a byline and a visible <time> (AEO-11). */
  byline?: { author: string };
  published: string;
  updated: string;
  /** Hero image to preload, when the page has one. */
  preloadImage?: string;
}

export interface NavItem {
  key: PageKey;
  label: string;
  href: string;
}

export interface SiteCopy {
  lang: Lang;
  brand: string;
  nav: NavItem[];
  keyFactsHeading: string;
  faqHeading: string;
  updatedLabel: string;
  byLabel: string;
  footerLinks: NavItem[];
  footerLine: string;
  notFound: { title: string; h1: string; body: string; homeLabel: string };
}

export interface LangContent {
  site: SiteCopy;
  pages: Partial<Record<PageKey, PageCopy>>;
}
