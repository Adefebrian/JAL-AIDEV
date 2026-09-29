// apps/web/server/lib/seo.ts - sitemap.xml with hreflang alternates.
//
// Pure. `lastmod` comes from the page-dates record through the route table;
// a page without a date falls back to `fallback` (the build or boot day), so
// no <url> is ever emitted without one.

export interface SitemapPage {
  loc: string;
  lastmod?: string;
  /** hreflang -> absolute URL, x-default included; empty when untranslated. */
  alternates: Record<string, string>;
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function sitemapXml(pages: SitemapPage[], fallback: string): string {
  const urls = pages.map((p) => {
    const alt = Object.entries(p.alternates)
      .map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${xml(lang)}" href="${xml(href)}" />`)
      .join("");
    return `  <url>\n    <loc>${xml(p.loc)}</loc>\n    <lastmod>${xml(p.lastmod || fallback)}</lastmod>${alt}\n  </url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}
