// apps/web/server/lib/seo.test.ts - sitemap hreflang pairs and the lastmod
// fallback, from fixture pages. Pure, no network.
import { describe, expect, test } from "bun:test";
import { sitemapXml, type SitemapPage } from "./seo";

const O = "https://site.test";
const pair = { en: `${O}/rates`, id: `${O}/id/rates`, "x-default": `${O}/rates` };
const pages: SitemapPage[] = [
  { loc: `${O}/rates`, lastmod: "2026-09-20", alternates: pair },
  { loc: `${O}/id/rates`, lastmod: "2026-09-20", alternates: pair },
  { loc: `${O}/guide`, alternates: {} },
];

function urlBlock(xml: string, loc: string): string {
  const m = new RegExp(`<url>\\s*<loc>${loc.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}</loc>[\\s\\S]*?</url>`).exec(xml);
  if (!m) throw new Error(`no <url> for ${loc}`);
  return m[0];
}

describe("sitemapXml", () => {
  const xml = sitemapXml(pages, "2026-09-29");

  test("declares the sitemap and xhtml namespaces", () => {
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  test("each translated URL lists every alternate, itself included, plus x-default", () => {
    for (const loc of [`${O}/rates`, `${O}/id/rates`]) {
      const block = urlBlock(xml, loc);
      for (const [lang, href] of Object.entries(pair)) {
        expect(block).toContain(`<xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />`);
      }
    }
  });

  test("hreflang pairs are reciprocal", () => {
    const en = urlBlock(xml, `${O}/rates`);
    const id = urlBlock(xml, `${O}/id/rates`);
    expect(en).toContain(`hreflang="id" href="${O}/id/rates"`);
    expect(id).toContain(`hreflang="en" href="${O}/rates"`);
  });

  test("an untranslated page has no hreflang", () => {
    expect(urlBlock(xml, `${O}/guide`)).not.toContain("xhtml:link");
  });

  test("lastmod comes from the page, and falls back when the page has none", () => {
    expect(urlBlock(xml, `${O}/rates`)).toContain("<lastmod>2026-09-20</lastmod>");
    expect(urlBlock(xml, `${O}/guide`)).toContain("<lastmod>2026-09-29</lastmod>");
  });

  test("escapes XML in URLs", () => {
    const out = sitemapXml([{ loc: `${O}/a?b=1&c=2`, alternates: {} }], "2026-09-29");
    expect(out).toContain("<loc>https://site.test/a?b=1&amp;c=2</loc>");
  });
});
