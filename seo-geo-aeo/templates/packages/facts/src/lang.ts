// packages/facts/src/lang.ts - language is a URL (hard law 4).
//
// The default language comes from `.jal/seo-geo-aeo.json` "defaultLanguage"
// (EN recommended). `/jal-seo-geo-aeo integrate` writes it into DEFAULT_LANG
// below, and lang.test.ts fails if the two ever disagree. The default lives at
// the bare path; every other language is a URL prefix (/id/... when EN is the
// default, /en/... when ID is), ONLY for the paths in TRANSLATED_PATHS, with
// hreflang plus x-default. An untranslated page has no prefixed twin and no
// hreflang, and a prefixed page links to its default-language URL instead.
// Never switch language by cookie. Pure and import-free.

export type Lang = "en" | "id";

export const LANGS: readonly Lang[] = ["en", "id"];
// Written by integrate from .jal/seo-geo-aeo.json "defaultLanguage".
export const DEFAULT_LANG: Lang = "en";

/** Every content page, keyed by a stable page key, with its base path (the
 * path in the default language). */
export const PAGE_PATHS = {
  home: "/",
  rates: "/rates",
  guide: "/guide",
  contact: "/contact",
} as const;

export type PageKey = keyof typeof PAGE_PATHS;

/** Base paths that really have a twin in every other language. lang.test.ts
 * pins this to the pages present in apps/web/src/content, so they cannot drift. */
export const TRANSLATED_PATHS: readonly string[] = ["/", "/rates", "/contact"];

/** Open Graph locales per language. */
export const OG_LOCALE: Record<Lang, string> = { en: "en_US", id: "id_ID" };

/** BCP 47 tags for hreflang and <html lang>. */
export const HREFLANG: Record<Lang, string> = { en: "en", id: "id" };

export function hasTranslation(basePath: string): boolean {
  return TRANSLATED_PATHS.includes(basePath);
}

/** The URL path of `basePath` in `lang`. Falls back to the default-language
 * path when the page is not translated, so a prefixed page never links to a
 * dead prefixed URL. */
export function pathForLang(basePath: string, lang: Lang): string {
  if (lang === DEFAULT_LANG || !hasTranslation(basePath)) return basePath;
  return basePath === "/" ? `/${lang}` : `/${lang}${basePath}`;
}

/** Splits a request path into its language and base path. */
export function splitLangPath(path: string): { lang: Lang; basePath: string } {
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue;
    if (path === `/${lang}`) return { lang, basePath: "/" };
    if (path.startsWith(`/${lang}/`)) return { lang, basePath: path.slice(lang.length + 1) };
  }
  return { lang: DEFAULT_LANG, basePath: path };
}

export function pageKeyForBasePath(basePath: string): PageKey | undefined {
  return (Object.keys(PAGE_PATHS) as PageKey[]).find((key) => PAGE_PATHS[key] === basePath);
}
