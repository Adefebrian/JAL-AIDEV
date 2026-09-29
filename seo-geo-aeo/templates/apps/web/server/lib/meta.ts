// apps/web/server/lib/meta.ts - the route table and the head injection.
//
// buildRouteTable() lists every route the server answers with the HTML shell:
// the indexable pages (from metaCopy.ts, one per page and language), the
// noindex routes, and a 404 entry per language. renderShellHtml() takes the
// built dist/index.html, sets <html lang>, writes the head (title,
// description, canonical, og, twitter, hreflang, geo, author, rss, llms,
// icons, manifest, preconnects, preload, JSON-LD) and puts the prerendered
// body inside #root.
//
// Pure: facts come from packages/facts, copy from metaCopy.ts, bodies from the
// SeoBundle passed in. No env, no fs, no network, safe in any test.
import {
  DEFAULT_LANG,
  HREFLANG,
  LANGS,
  OG_LOCALE,
  PAGE_DATES,
  PAGE_PATHS,
  business,
  hasTranslation,
  pathForLang,
  splitLangPath,
  type Lang,
  type PageKey,
} from "@__APP_NAME__/facts";
import { META_COPY, NOINDEX_COPY, NOT_FOUND_COPY, PRECONNECT, PUBLIC_ICONS } from "./metaCopy";
import type { SeoBundle } from "./seoTypes";

export interface Route {
  key: string;
  path: string;
  basePath: string;
  lang: Lang;
  title: string;
  description: string;
  /** Absolute canonical URL; undefined on noindex routes. */
  canonical?: string;
  published?: string;
  updated?: string;
  /** hreflang -> absolute URL, x-default included; empty when untranslated. */
  alternates: Record<string, string>;
  noindex: boolean;
  notFound?: boolean;
  /** Dynamic pages skip the shell cache and are appended at request time. */
  dynamic?: boolean;
  preloadImage?: string;
  ogType: "website" | "article";
  shell: "public" | "admin";
}

export const ORIGIN = business.website.replace(/\/+$/, "");

export function absolute(path: string): string {
  return path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
}

function alternatesFor(basePath: string): Record<string, string> {
  if (!hasTranslation(basePath)) return {};
  const out: Record<string, string> = {};
  for (const lang of LANGS) out[HREFLANG[lang]] = absolute(pathForLang(basePath, lang));
  out["x-default"] = absolute(pathForLang(basePath, DEFAULT_LANG));
  return out;
}

export function buildRouteTable(): Route[] {
  const routes: Route[] = [];
  for (const lang of LANGS) {
    const copy = META_COPY[lang];
    for (const key of Object.keys(copy) as PageKey[]) {
      const meta = copy[key];
      if (!meta) continue;
      const basePath = PAGE_PATHS[key];
      const path = pathForLang(basePath, lang);
      if (lang !== DEFAULT_LANG && path === basePath) {
        throw new Error(`metaCopy: ${lang}.${key} has copy but ${basePath} is not in TRANSLATED_PATHS`);
      }
      routes.push({
        key,
        path,
        basePath,
        lang,
        title: meta.title,
        description: meta.description,
        canonical: absolute(path),
        published: PAGE_DATES[key].published,
        updated: PAGE_DATES[key].updated,
        alternates: alternatesFor(basePath),
        noindex: false,
        ogType: key === "guide" ? "article" : "website",
        shell: "public",
      });
    }
  }
  for (const r of NOINDEX_COPY) {
    const { lang, basePath } = splitLangPath(r.path);
    routes.push({ key: r.path, path: r.path, basePath, lang, ...r.copy, alternates: {}, noindex: true, ogType: "website", shell: r.shell });
  }
  return routes;
}

export function notFoundRoute(path: string): Route {
  const { lang } = splitLangPath(path);
  return { key: "404", path, basePath: path, lang, ...NOT_FOUND_COPY[lang], alternates: {}, noindex: true, notFound: true, ogType: "website", shell: "public" };
}

export function indexable(routes: Route[]): Route[] {
  return routes.filter((r) => !r.noindex);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** JSON for a <script> data block: `<` escaped so no string can close the tag. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function renderHead(route: Route, jsonLd?: unknown): string {
  const tags: string[] = [];
  tags.push(`<meta name="description" content="${esc(route.description)}" />`);
  if (route.noindex) {
    // noindex routes carry ONLY noindex: no canonical, hreflang, og or JSON-LD.
    tags.push(`<meta name="robots" content="noindex" />`);
    return tags.join("\n    ");
  }
  const canonical = route.canonical ?? absolute(route.path);
  const ogImage = business.ogImage.startsWith("http") ? business.ogImage : `${ORIGIN}${business.ogImage}`;
  tags.push(`<link rel="canonical" href="${esc(canonical)}" />`);
  for (const [lang, href] of Object.entries(route.alternates)) {
    tags.push(`<link rel="alternate" hreflang="${esc(lang)}" href="${esc(href)}" />`);
  }
  tags.push(`<meta property="og:type" content="${route.ogType}" />`);
  tags.push(`<meta property="og:site_name" content="${esc(business.name)}" />`);
  tags.push(`<meta property="og:title" content="${esc(route.title)}" />`);
  tags.push(`<meta property="og:description" content="${esc(route.description)}" />`);
  tags.push(`<meta property="og:url" content="${esc(canonical)}" />`);
  tags.push(`<meta property="og:image" content="${esc(ogImage)}" />`);
  tags.push(`<meta property="og:image:width" content="1200" />`);
  tags.push(`<meta property="og:image:height" content="630" />`);
  tags.push(`<meta property="og:locale" content="${OG_LOCALE[route.lang]}" />`);
  if (Object.keys(route.alternates).length > 0) {
    for (const lang of LANGS) if (lang !== route.lang) tags.push(`<meta property="og:locale:alternate" content="${OG_LOCALE[lang]}" />`);
  }
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${esc(route.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${esc(route.description)}" />`);
  tags.push(`<meta name="twitter:image" content="${esc(ogImage)}" />`);
  tags.push(`<meta name="geo.region" content="${esc(business.address.regionCode)}" />`);
  tags.push(`<meta name="geo.placename" content="${esc(business.address.city)}" />`);
  tags.push(`<meta name="geo.position" content="${business.geo.lat};${business.geo.lng}" />`);
  tags.push(`<meta name="ICBM" content="${business.geo.lat}, ${business.geo.lng}" />`);
  tags.push(`<meta name="author" content="${esc(business.name)}" />`);
  tags.push(`<link rel="alternate" type="application/rss+xml" title="${esc(business.name)}" href="/feed.xml" />`);
  tags.push(`<link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />`);
  tags.push(`<link rel="manifest" href="/site.webmanifest" />`);
  for (const icon of PUBLIC_ICONS) {
    const extra = `${icon.type ? ` type="${esc(icon.type)}"` : ""}${icon.sizes ? ` sizes="${esc(icon.sizes)}"` : ""}`;
    tags.push(`<link rel="${esc(icon.rel)}" href="${esc(icon.href)}"${extra} />`);
  }
  for (const origin of PRECONNECT) tags.push(`<link rel="preconnect" href="${esc(origin)}" crossorigin />`);
  if (route.preloadImage) tags.push(`<link rel="preload" as="image" href="${esc(route.preloadImage)}" fetchpriority="high" />`);
  if (jsonLd !== undefined) tags.push(`<script type="application/ld+json">${jsonForScript(jsonLd)}</script>`);
  return tags.join("\n    ");
}

/**
 * The full HTML for a route. `shell` is dist/index.html (or dist/admin.html);
 * `seo` supplies the prerendered body and JSON-LD for this path, when built.
 */
export function renderShellHtml(shell: string, route: Route, seo: SeoBundle | null): string {
  const page = seo?.pages.find((p) => p.path === route.path);
  const body = route.notFound ? (seo?.notFound[route.lang] ?? "") : (page?.body ?? "");
  let html = shell.replace(/<html lang="[^"]*"/, `<html lang="${HREFLANG[route.lang]}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`);
  html = html.replace("</head>", `    ${renderHead(route, route.noindex ? undefined : page?.jsonLd)}\n  </head>`);
  html = html.includes('<div id="root"></div>')
    ? html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    : html.replace("<body>", `<body><div id="root">${body}</div>`);
  return html;
}
