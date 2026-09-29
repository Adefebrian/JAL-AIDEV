// apps/web/server/lib/meta.test.ts - the route table and the head
// (integrate.md 8.3). Imports meta.ts and metaCopy.ts plus the client content
// modules and compares the copies byte for byte. No network, no env.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Glob } from "bun";
import { describe, expect, test } from "bun:test";
import { DEFAULT_LANG, LANGS, PAGE_DATES, PAGE_PATHS, TRANSLATED_PATHS, business, type PageKey } from "@__APP_NAME__/facts";
import { CONTENT, allPages } from "../../src/content";
import { generateSeo } from "../../src/seo/content";
import { createWebApp } from "../../server";
import { META_COPY, NOT_FOUND_COPY } from "./metaCopy";
import { buildRouteTable, indexable, notFoundRoute, renderShellHtml } from "./meta";

const webRoot = join(import.meta.dir, "..", "..");
const shell = readFileSync(join(webRoot, "src", "index.html"), "utf8");
const routes = buildRouteTable();
const live = indexable(routes);
const { bundle } = generateSeo(null);
const place = business.address.city;

describe("route table", () => {
  test("indexable paths are exactly the live pages", () => {
    expect(live.map((r) => r.path).sort()).toEqual(allPages().map((p) => p.path).sort());
  });

  test("route paths are unique", () => {
    expect(new Set(routes.map((r) => r.path)).size).toBe(routes.length);
  });

  test("the default language has every page, other languages exactly the translated paths", () => {
    expect(Object.keys(CONTENT[DEFAULT_LANG].pages).sort()).toEqual(Object.keys(PAGE_PATHS).sort());
    for (const lang of LANGS.filter((l) => l !== DEFAULT_LANG)) {
      const bases = Object.values(CONTENT[lang].pages).map((p) => p!.basePath);
      expect(bases.sort()).toEqual([...TRANSLATED_PATHS].sort());
    }
  });
});

describe("server and client copy mirror each other", () => {
  test("every title and description matches byte for byte", () => {
    for (const page of allPages()) {
      const meta = META_COPY[page.lang][page.key];
      expect({ path: page.path, title: meta?.title, description: meta?.description }).toEqual({
        path: page.path,
        title: page.title,
        description: page.description,
      });
    }
  });

  test("metaCopy has no page the client does not have", () => {
    for (const lang of LANGS) {
      for (const key of Object.keys(META_COPY[lang]) as PageKey[]) expect(CONTENT[lang].pages[key]).toBeDefined();
    }
  });

  test("the 404 titles match", () => {
    for (const lang of LANGS) expect(NOT_FOUND_COPY[lang].title).toBe(CONTENT[lang].site.notFound.title);
  });

  test("the built bundle carries the same titles", () => {
    for (const p of bundle.pages) expect(p.title).toBe(live.find((r) => r.path === p.path)?.title ?? `(no route for ${p.path})`);
  });
});

describe("measured metadata (hard law 7)", () => {
  test("indexable titles are 50 to 60 characters and name the place", () => {
    for (const r of live) {
      expect({ path: r.path, title: r.title, length: r.title.length, ok: r.title.length >= 50 && r.title.length <= 60 }).toMatchObject({ ok: true });
      expect(r.title).toContain(place);
    }
  });

  test("descriptions are 120 to 158 characters", () => {
    for (const r of live) {
      const n = r.description.length;
      expect({ path: r.path, description: r.description, length: n, ok: n >= 120 && n <= 158 }).toMatchObject({ ok: true });
    }
  });

  test("no title anywhere is under 15 characters", () => {
    for (const r of [...routes, notFoundRoute("/nope"), notFoundRoute("/id/nope")]) expect(r.title.length).toBeGreaterThanOrEqual(15);
  });

  test("titles and descriptions are unique", () => {
    expect(new Set(live.map((r) => r.title)).size).toBe(live.length);
    expect(new Set(live.map((r) => r.description)).size).toBe(live.length);
  });
});

describe("head injection", () => {
  test("prefixed routes declare their language in <html lang>", () => {
    for (const r of routes) expect(renderShellHtml(shell, r, bundle)).toContain(`<html lang="${r.lang}"`);
    expect(routes.some((r) => r.lang !== DEFAULT_LANG)).toBe(true);
  });

  test("the head has canonical, hreflang, locale alternate, geo, feed, llms, manifest and author", () => {
    for (const r of live) {
      const html = renderShellHtml(shell, r, bundle);
      expect(html).toContain(`<link rel="canonical" href="${r.canonical}" />`);
      expect(html).toContain(`<meta property="og:url" content="${r.canonical}" />`);
      expect(html).toContain('name="geo.region"');
      expect(html).toContain('name="geo.position"');
      expect(html).toContain('type="application/rss+xml"');
      expect(html).toContain('href="/llms.txt"');
      expect(html).toContain('rel="manifest"');
      expect(html).toContain('name="author"');
      expect(html).toContain('<script type="application/ld+json">');
      if (TRANSLATED_PATHS.includes(r.basePath)) {
        for (const lang of LANGS) expect(html).toContain(`hreflang="${lang}"`);
        expect(html).toContain('hreflang="x-default"');
        expect(html).toContain('property="og:locale:alternate"');
      } else {
        expect(html).not.toContain("hreflang=");
      }
    }
  });

  test("noindex routes carry only noindex: no canonical, hreflang, og or JSON-LD", () => {
    for (const r of [...routes.filter((x) => x.noindex), notFoundRoute("/nope")]) {
      const html = renderShellHtml(shell, r, bundle);
      expect(html).toContain('<meta name="robots" content="noindex" />');
      expect(html).not.toContain('rel="canonical"');
      expect(html).not.toContain("hreflang=");
      expect(html).not.toContain("og:url");
      expect(html).not.toContain("application/ld+json");
    }
  });

  test("the prerendered body sits inside #root", () => {
    for (const r of live) {
      const body = bundle.pages.find((p) => p.path === r.path)!.body;
      expect(body.length).toBeGreaterThan(200);
      expect(renderShellHtml(shell, r, bundle)).toContain(`<div id="root">${body}</div>`);
    }
  });

  test("with no seo.json the head is still complete and #root is empty", () => {
    const html = renderShellHtml(shell, live[0]!, null);
    expect(html).toContain(`<title>${live[0]!.title.replace(/&/g, "&amp;")}</title>`);
    expect(html).toContain('<div id="root"></div>');
  });
});

describe("dates", () => {
  test("dated pages take lastmod from pageDates in every language", async () => {
    const app = createWebApp({ seo: null, shell, today: "2000-01-01" });
    const xml = await (await app.request("/sitemap.xml")).text();
    for (const r of live) {
      const updated = PAGE_DATES[r.key as PageKey].updated;
      expect(r.updated).toBe(updated);
      expect(xml).toContain(`<loc>${r.canonical}</loc>\n    <lastmod>${updated}</lastmod>`);
    }
  });
});

describe("runtime boundary (integrate.md 8.2)", () => {
  test("nothing under server/, server.ts or serve.ts imports apps/web/src", async () => {
    const offenders: string[] = [];
    const files = ["server.ts", "serve.ts", ...new Glob("server/**/*.ts").scanSync(webRoot)].filter((f) => !f.endsWith(".test.ts"));
    for (const rel of files) {
      const src = readFileSync(join(webRoot, rel), "utf8");
      for (const m of src.matchAll(/(?:import|from)\s*[^"']*["']([^"']+)["']/g)) {
        if (/(^|\/)src(\/|$)/.test(m[1]!)) offenders.push(`${rel}: ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
