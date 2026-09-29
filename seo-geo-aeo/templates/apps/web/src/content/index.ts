// apps/web/src/content/index.ts - lookups over the per-language copy.
import { LANGS, splitLangPath, type Lang, type PageKey } from "@__APP_NAME__/facts";
import { EN } from "./en";
import { ID } from "./id";
import type { LangContent, PageCopy, SiteCopy } from "./types";

export const CONTENT: Record<Lang, LangContent> = { en: EN, id: ID };

export function siteCopy(lang: Lang): SiteCopy {
  return CONTENT[lang].site;
}

export function pageFor(lang: Lang, key: PageKey): PageCopy | undefined {
  return CONTENT[lang].pages[key];
}

/** Every live page in every language: exactly the indexable URLs. */
export function allPages(): PageCopy[] {
  return LANGS.flatMap((lang) => Object.values(CONTENT[lang].pages).filter((p): p is PageCopy => Boolean(p)));
}

export function findPage(pathname: string): PageCopy | undefined {
  return allPages().find((p) => p.path === pathname);
}

export function langOfPath(pathname: string): Lang {
  return splitLangPath(pathname).lang;
}
