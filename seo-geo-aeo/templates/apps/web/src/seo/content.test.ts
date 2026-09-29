// apps/web/src/seo/content.test.ts - what the site SERVES (integrate.md 8.3).
//
// Generates the bundle in memory with the same generator the build runs (so a
// fact edit is tested at once, never a stale dist/), serves it through the
// same createWebApp() server.ts boots, and requests every route and every
// discovery file with app.request. Pages are parsed with happy-dom.
//
// THE FORBIDDEN-CLAIMS TEST fails while any placeholder fact, owner-rejected
// claim or U+2014 dash reaches a served body, a JSON-LD block or a discovery
// file (acceptance criterion 4).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, test } from "bun:test";
import {
  ARTICLES,
  DEFAULT_LANG,
  DIFFERENTIATORS,
  LANGS,
  PAGE_DATES,
  QUOTES,
  business,
  findForbidden,
} from "@__APP_NAME__/facts";
import { DISCOVERY_PATHS, createWebApp } from "../../server";
import { buildRouteTable, indexable } from "../../server/lib/meta";
import { allPages } from "../content";
import { generateSeo } from "./content";
import { isType } from "./jsonld";
import llmsSkeleton from "./llms.skeleton.txt" with { type: "text" };

const webRoot = join(import.meta.dir, "..", "..");
const shell = readFileSync(join(webRoot, "src", "index.html"), "utf8");
const routes = buildRouteTable();
const live = indexable(routes);
const livePaths = new Set(live.map((r) => r.path));

type Served = { name: string; text: string };
const pages = new Map<string, string>();
const served: Served[] = [];

function doc(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html") as unknown as Document;
}

function ldGraphs(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));
}

function nodes(html: string): Record<string, unknown>[] {
  return ldGraphs(html).flatMap((g) => (g["@graph"] as Record<string, unknown>[]) ?? [g]);
}

beforeAll(async () => {
  const { bundle } = generateSeo({ sites: [{ url: business.website }], defaultLanguage: DEFAULT_LANG, languages: [...LANGS] });
  const app = createWebApp({ seo: bundle, shell, indexNowKey: undefined });
  for (const r of routes) {
    const res = await app.request(r.path);
    const text = await res.text();
    pages.set(r.path, text);
    served.push({ name: `page ${r.path}`, text });
  }
  for (const p of ["/this-page-does-not-exist", `/${LANGS.find((l) => l !== DEFAULT_LANG) ?? DEFAULT_LANG}/nope`]) {
    const res = await app.request(p);
    expect(res.status).toBe(404);
    served.push({ name: `404 ${p}`, text: await res.text() });
  }
  for (const p of DISCOVERY_PATHS) {
    const res = await app.request(p);
    expect({ path: p, status: res.status }).toEqual({ path: p, status: 200 });
    served.push({ name: `file ${p}`, text: await res.text() });
  }
});

describe("forbidden claims", () => {
  test("no placeholder, rejected claim or U+2014 dash in any served body, JSON-LD block or discovery file", () => {
    const failures = served.flatMap((s) => findForbidden(s.text).map((h) => `${s.name}: ${h.reason}: ...${h.match}...`));
    expect(failures).toEqual([]);
  });

  test("only people the owner allows to be named appear", () => {
    const hidden = business.people.filter((p) => !p.publish).map((p) => p.name);
    for (const s of served) for (const name of hidden) expect(s.text.includes(name)).toBe(false);
  });

  test("no self-serving review markup (hard law 5)", () => {
    for (const html of pages.values()) {
      for (const n of nodes(html)) {
        expect(isType(n, "Review") || isType(n, "AggregateRating")).toBe(false);
        expect("aggregateRating" in n || "review" in n).toBe(false);
      }
    }
  });
});

describe("JSON-LD", () => {
  test("every indexable page has one valid graph with the required nodes", () => {
    for (const r of live) {
      const graphs = ldGraphs(pages.get(r.path)!);
      expect(graphs).toHaveLength(1);
      expect(graphs[0]!["@context"]).toBe("https://schema.org");
      const ns = nodes(pages.get(r.path)!);
      for (const type of ["WebSite", "Organization", "LocalBusiness", "WebPage", "BreadcrumbList"]) {
        expect({ path: r.path, type, found: ns.some((n) => isType(n, type)) }).toEqual({ path: r.path, type, found: true });
      }
    }
  });

  test("the place node has hours, geo, amenities, offers, sameAs and hasMap with the cid", () => {
    const placeNode = nodes(pages.get(live[0]!.path)!).find((n) => isType(n, "LocalBusiness"))!;
    const hours = placeNode.openingHoursSpecification as { closes: string }[];
    expect(hours.length).toBeGreaterThan(0);
    for (const h of hours) expect(h.closes).not.toBe("24:00");
    expect((placeNode.geo as { latitude: number }).latitude).toBeNumber();
    expect((placeNode.amenityFeature as unknown[]).length).toBeGreaterThan(0);
    expect(((placeNode.hasOfferCatalog as { itemListElement: unknown[] }).itemListElement).length).toBeGreaterThan(0);
    expect((placeNode.sameAs as string[]).length).toBeGreaterThan(0);
    expect((placeNode.hasMap as string[]).some((u) => u.includes("?cid="))).toBe(true);
  });

  test("the WebPage node names the page with its title and dates", () => {
    for (const r of live) {
      const page = nodes(pages.get(r.path)!).find((n) => isType(n, "WebPage"))!;
      expect(page.name).toBe(r.title);
      expect(page.dateModified).toBe(r.updated);
      expect(page.datePublished).toBe(r.published);
    }
  });
});

describe("markup equals what the page shows (hard law 2)", () => {
  test("FAQPage markup equals the rendered FAQ", () => {
    for (const r of live) {
      const html = pages.get(r.path)!;
      const shown = [...doc(html).querySelectorAll(".faq-item")].map((el) => ({
        q: el.querySelector("h3")?.textContent ?? "",
        a: el.querySelector("p")?.textContent ?? "",
      }));
      const faq = nodes(html).find((n) => isType(n, "FAQPage"));
      const marked = ((faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[]) ?? []).map((q) => ({ q: q.name, a: q.acceptedAnswer.text }));
      expect(shown.length).toBeGreaterThan(0);
      expect(marked).toEqual(shown);
    }
  });

  test("HowTo markup equals the rendered steps", () => {
    for (const r of live) {
      const html = pages.get(r.path)!;
      const steps = [...doc(html).querySelectorAll("ol.site-steps li")].map((li) => li.textContent ?? "");
      const howTo = nodes(html).filter((n) => isType(n, "HowTo"));
      const marked = howTo.flatMap((h) => (h.step as { text: string }[]).map((s) => s.text));
      expect(marked).toEqual(steps);
    }
  });

  test("offers in the markup are the bands in the rates table", () => {
    const rates = live.find((r) => r.key === "rates");
    if (!rates) return;
    const html = pages.get(rates.path)!;
    const shownBands = [...doc(html).querySelectorAll(".site-table tbody th")].map((th) => th.textContent ?? "");
    const offers = (nodes(html).find((n) => isType(n, "LocalBusiness"))!.hasOfferCatalog as { itemListElement: { name: string }[] }).itemListElement;
    expect(offers.map((o) => o.name)).toEqual(shownBands);
  });
});

describe("key facts, sources, quotes, bylines", () => {
  test("home, rates and contact open with a key-facts block", () => {
    for (const r of live.filter((x) => ["home", "rates", "contact"].includes(x.key))) {
      expect(doc(pages.get(r.path)!).querySelectorAll(".seo-keyfacts .seo-keyfact").length).toBeGreaterThan(0);
    }
  });

  test("every press citation equals the record", () => {
    for (const html of pages.values()) {
      for (const a of doc(html).querySelectorAll("a[data-press-id]")) {
        const rec = ARTICLES.find((x) => x.id === a.getAttribute("data-press-id"));
        expect(rec).toBeDefined();
        expect(a.getAttribute("href")).toBe(rec!.url);
        expect(a.textContent).toBe(rec!.outlet);
      }
    }
  });

  test("quotes are whole sentences of 15 words or fewer, attributed, and in the record", () => {
    for (const q of QUOTES) {
      expect(q.text.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(15);
      expect(q.text).toMatch(/^["“]?[\p{Lu}\p{N}].*[.!?]["”]?$/u);
      expect(q.speaker && q.role && q.checkedOn).toBeTruthy();
      expect(ARTICLES.some((a) => a.id === q.articleId)).toBe(true);
    }
    for (const html of pages.values()) {
      for (const fig of doc(html).querySelectorAll("figure[data-quote-id]")) {
        const rec = QUOTES.find((q) => q.id === fig.getAttribute("data-quote-id"));
        expect(rec).toBeDefined();
        expect(fig.querySelector("blockquote p")?.textContent).toBe(rec!.text);
      }
    }
  });

  test("editorial pages show a byline with a visible <time> from the dates record", () => {
    for (const r of live.filter((x) => x.key === "guide")) {
      const time = doc(pages.get(r.path)!).querySelector(".seo-byline time");
      expect(time?.getAttribute("datetime")).toBe(PAGE_DATES.guide.updated);
      expect(nodes(pages.get(r.path)!).find((n) => isType(n, "WebPage"))?.author).toBeDefined();
    }
  });

  // Legal text matches the code: add a test here when the project has a
  // privacy page (name each form, the analytics, the processors, UU PDP).
});

describe("links", () => {
  test("prefixed pages never link to an untranslated prefixed path", () => {
    for (const lang of LANGS.filter((l) => l !== DEFAULT_LANG)) {
      for (const r of live.filter((x) => x.lang === lang)) {
        for (const a of doc(pages.get(r.path)!).querySelectorAll(`a[href^="/${lang}"]`)) {
          const href = a.getAttribute("href")!;
          expect({ from: r.path, href, live: livePaths.has(href) }).toEqual({ from: r.path, href, live: true });
        }
      }
    }
  });

  test("every internal link on a page resolves to a live route", () => {
    for (const r of live) {
      for (const a of doc(pages.get(r.path)!).querySelectorAll('a[href^="/"]')) {
        const href = a.getAttribute("href")!.split("#")[0]!;
        expect({ from: r.path, href, live: livePaths.has(href) }).toEqual({ from: r.path, href, live: true });
      }
    }
  });

  test("every differentiator URL is live", () => {
    for (const d of DIFFERENTIATORS) if (d.url.startsWith("/")) expect(livePaths.has(d.url)).toBe(true);
  });
});

describe("discovery files", () => {
  const file = (p: string) => served.find((s) => s.name === `file ${p}`)!.text;

  test("llms.txt carries every skeleton heading, in order", () => {
    const headings = llmsSkeleton.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.replaceAll("<Brand>", business.name));
    const out = file("/llms.txt").split("\n").filter((l) => l.startsWith("## "));
    expect(out).toEqual(headings);
    expect(file("/.well-known/llms.txt")).toBe(file("/llms.txt"));
  });

  test("llms-full.txt carries every page's text", () => {
    for (const p of allPages()) expect(file("/llms-full.txt")).toContain(p.h1);
  });

  test("faq.json equals the rendered FAQs", () => {
    const entries = (JSON.parse(file("/ai/faq.json")) as { entries: { question: string }[] }).entries;
    expect(entries.map((e) => e.question)).toEqual(allPages().flatMap((p) => p.faq.map((f) => f.q)));
  });

  test("robots.txt names the crawlers, keeps admin and API out, and links the sitemap", () => {
    const robots = file("/robots.txt");
    for (const token of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Googlebot", "bingbot"]) {
      expect(robots).toContain(`User-agent: ${token}`);
    }
    expect(robots).toContain(`Disallow: ${business.adminPath}`);
    expect(robots).toContain("Disallow: /api");
    expect(robots).toMatch(/^Sitemap: https:\/\/.+\/sitemap\.xml$/m);
    expect(robots).not.toMatch(/^Content-Signal:/m);
  });

  test("ai.txt carries the Content-Signal line", () => {
    expect(file("/.well-known/ai.txt")).toMatch(/^Content-Signal: search=yes, ai-input=yes, ai-train=(yes|no)$/m);
  });

  test("the sitemap lists exactly the indexable URLs", () => {
    const locs = [...file("/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual(live.map((r) => r.canonical ?? r.path).sort());
  });
});
