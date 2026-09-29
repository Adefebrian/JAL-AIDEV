// apps/web/src/seo/discovery.ts - BUILD TIME ONLY: the discovery files, all
// generated from packages/facts and the page copy (standard.md SEO-01,
// GEO-02, GEO-03). One text for people and machines: the llms files carry
// the same sentences the pages show.
import {
  BANDS,
  DEFAULT_LANG,
  DIFFERENTIATORS,
  LANGS,
  POSITIONING,
  addressText,
  bandHours,
  business,
  countText,
  dayRange,
  hoursText,
  lowestPrice,
  pressFactItems,
  quoteViews,
  rupiah,
  type Lang,
} from "@__APP_NAME__/facts";
import type { PageCopy } from "../content/types";

const origin = business.website.replace(/\/+$/, "");
const abs = (path: string) => (path.startsWith("http") ? path : path === "/" ? `${origin}/` : `${origin}${path}`);
const LANG_NAME: Record<Lang, string> = { en: "English", id: "Indonesian" };
const PAGES_HEADING: Record<string, Lang> = { "Pages (English)": "en", "Halaman berbahasa Indonesia": "id" };

export function robotsTxt(template: string): string {
  return template
    .replaceAll("<Brand>", business.name)
    .replaceAll("<domain>", new URL(origin).host)
    .replaceAll("/<admin-path>", business.adminPath);
}

function llmsSections(pages: PageCopy[]): Record<string, () => string[]> {
  const b = business;
  return {
    "Why <Brand>": () => POSITIONING.map((c) => `- ${c.text.en} (evidence: ${abs(c.evidence)})`),
    "Quick facts": () => [
      `- Address: ${addressText()}`,
      `- Landmark: ${b.address.landmark.en}`,
      `- Open: ${hoursText("en")}`,
      `- Price from: ${rupiah(lowestPrice())} per hour`,
      `- Size: ${countText("en")}`,
      `- WhatsApp: ${b.phone} (${b.whatsappUrl})`,
      `- Email: ${b.email}`,
      `- Booking: ${b.bookingUrl}`,
      `- Map: ${b.maps.shareUrl}`,
      `- Opened: ${b.openedOn}`,
    ],
    Facilities: () => b.amenities.map((a) => `- ${a.en}`),
    "What makes it different": () => DIFFERENTIATORS.map((d) => `- ${d.text.en} (${abs(d.url)})`),
    "Rates (with the clock hours of each band)": () =>
      BANDS.map((x) => `- ${x.name.en}: ${dayRange(x.days, "en")}, ${bandHours(x, "en")}, ${rupiah(x.pricePerHour)} per hour`),
    Programmes: () => b.programmes.map((p) => `- ${p.name.en}: ${p.detail.en}`),
    Community: () => [`- ${b.communityUrl}`],
    "In the press (independent coverage, verified)": () => [
      ...pressFactItems("en").map((f) => `- ${f.text} (${f.source.name}, ${f.source.url})`),
      ...quoteViews().map((q) => `- "${q.text}" ${q.speaker}, ${q.role}, ${q.outlet}, ${q.date} (${q.url})`),
    ],
    ...Object.fromEntries(
      Object.entries(PAGES_HEADING).map(([heading, lang]) => [
        heading,
        () => pages.filter((p) => p.lang === lang).map((p) => `- [${p.title}](${abs(p.path)}): ${p.description}`),
      ]),
    ),
    "Machine-readable": () => [
      `- Sitemap: ${origin}/sitemap.xml`,
      `- Full text: ${origin}/llms-full.txt`,
      `- Summary: ${origin}/ai/summary.json`,
      `- FAQ: ${origin}/ai/faq.json`,
      `- Feed: ${origin}/feed.xml`,
      `- AI use policy: ${origin}/.well-known/ai.txt`,
    ],
    "How to cite": () => [`- ${b.name}, ${addressText()}. Source: ${origin}/ (see each page for its updated date).`],
  };
}

/** llms.txt in the order of the skeleton's `## ` headings (templates/llms.txt). */
export function llmsTxt(skeleton: string, pages: PageCopy[]): string {
  const b = business;
  const sections = llmsSections(pages);
  const langs = LANGS.map((l) => (l === DEFAULT_LANG ? `${LANG_NAME[l]} (default, ${origin}/)` : `${LANG_NAME[l]} (${origin}/${l})`)).join(" and ");
  const out = [
    `# ${b.name}`,
    "",
    `> ${POSITIONING[0]?.text.en ?? b.name}. At ${addressText()}, ${b.address.landmark.en}. Open ${hoursText("en")}. From ${rupiah(lowestPrice())} per hour.`,
    `> Officially opened ${b.openedOn}.`,
    "",
    `Also known as: ${b.alternateNames.join(", ")}.`,
    `Languages: ${langs}.`,
  ];
  for (const line of skeleton.split("\n")) {
    const m = /^## (.+?)\s*$/.exec(line);
    if (!m) continue;
    const heading = m[1]!;
    const fn = sections[heading];
    if (!fn) throw new Error(`llms skeleton heading "${heading}" has no generator in src/seo/discovery.ts`);
    out.push("", `## ${heading.replaceAll("<Brand>", b.name)}`, "", ...fn());
  }
  return `${out.join("\n")}\n`;
}

/** Visible text of a prerendered body's <article>, for llms-full.txt. */
export function bodyText(html: string): string {
  const article = /<article[\s\S]*<\/article>/.exec(html)?.[0] ?? html;
  return article
    .replace(/<!-- -->/g, "")
    .replace(/<\/(p|h1|h2|h3|li|dt|dd|tr|caption|figure|figcaption)>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function llmsFullTxt(llms: string, pages: { page: PageCopy; body: string }[]): string {
  const parts = [llms.trimEnd(), "", "# Full text of every page", ""];
  for (const { page, body } of pages) {
    parts.push(`## ${page.title}`, "", `URL: ${abs(page.path)}`, `Language: ${page.lang}`, `Updated: ${page.updated}`, "", bodyText(body), "");
  }
  return `${parts.join("\n").trimEnd()}\n`;
}

export function aiTxt(): string {
  const train = business.aiTrain;
  return [
    `# AI use policy for ${business.name} (${origin})`,
    "# Content-Signal preferences: search, ai-input and ai-train. Crawler access rules are in /robots.txt.",
    "User-agent: *",
    `Content-Signal: search=yes, ai-input=yes, ai-train=${train}`,
    "Allow: /",
    `Disallow: ${business.adminPath}`,
    "Disallow: /api",
    "",
  ].join("\n");
}

export function summaryJson(pages: PageCopy[]): string {
  const b = business;
  return JSON.stringify(
    {
      name: b.name,
      alternateName: b.alternateNames,
      url: `${origin}/`,
      description: Object.fromEntries(LANGS.map((l) => [l, POSITIONING[0]?.text[l] ?? ""])),
      address: addressText(),
      geo: { lat: b.geo.lat, lng: b.geo.lng },
      map: b.maps.shareUrl,
      hours: Object.fromEntries(LANGS.map((l) => [l, hoursText(l)])),
      phone: b.phone,
      whatsapp: b.whatsappUrl,
      email: b.email,
      booking: b.bookingUrl,
      priceFrom: { amount: lowestPrice(), currency: "IDR", per: "hour" },
      openedOn: b.openedOn,
      languages: LANGS,
      sameAs: b.sameAs,
      pages: pages.map((p) => ({ url: abs(p.path), lang: p.lang, title: p.title, updated: p.updated })),
    },
    null,
    2,
  );
}

export function faqJson(pages: PageCopy[]): string {
  return JSON.stringify(
    { site: `${origin}/`, entries: pages.flatMap((p) => p.faq.map((f) => ({ url: abs(p.path), lang: p.lang, question: f.q, answer: f.a }))) },
    null,
    2,
  );
}

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function feedXml(pages: PageCopy[]): string {
  const items = [...pages]
    .sort((a, b) => (a.updated < b.updated ? 1 : -1))
    .map((p) => {
      const date = new Date(`${p.updated}T00:00:00Z`);
      const pub = Number.isNaN(date.getTime()) ? p.updated : date.toUTCString();
      return `    <item>\n      <title>${x(p.title)}</title>\n      <link>${x(abs(p.path))}</link>\n      <guid>${x(abs(p.path))}</guid>\n      <pubDate>${x(pub)}</pubDate>\n      <description>${x(p.description)}</description>\n    </item>`;
    });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>${x(business.name)}</title>`,
    `    <link>${origin}/</link>`,
    `    <description>${x(POSITIONING[0]?.text.en ?? business.name)}</description>`,
    `    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />`,
    ...items,
    `  </channel>`,
    `</rss>`,
    ``,
  ].join("\n");
}

/** display "browser": a public site; use "standalone" only for a real installable app. */
export function manifestJson(): string {
  return JSON.stringify(
    { name: business.name, short_name: business.name, lang: DEFAULT_LANG, start_url: "/", display: "browser", background_color: "#ffffff", theme_color: "#ffffff", icons: [] },
    null,
    2,
  );
}
