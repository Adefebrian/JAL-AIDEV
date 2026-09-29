// apps/web/src/seo/content.ts - BUILD TIME ONLY: the generator.
//
// Renders every page with the SAME components the browser hydrates, builds
// the JSON-LD graphs and every discovery file from packages/facts, and returns
// the dist/seo.json bundle. build-hook.ts writes it; the tests call it in
// memory. Never imported by the runtime server (the image carries no src/).
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { DEFAULT_LANG, LANGS, PLACEHOLDER_PATTERNS } from "@__APP_NAME__/facts";
import { allPages, pageFor, siteCopy } from "../content";
import { NotFoundPage, SitePage } from "../pages/SitePage";
import type { SeoBundle } from "../../server/lib/seoTypes";
import { aiTxt, faqJson, feedXml, llmsFullTxt, llmsTxt, manifestJson, robotsTxt, summaryJson } from "./discovery";
import { pageGraph } from "./jsonld";
import robotsTemplate from "./robots.txt" with { type: "text" };
import llmsSkeleton from "./llms.skeleton.txt" with { type: "text" };

/** The shape of .jal/seo-geo-aeo.json that the generator reads (webmaster.md 7.4). */
export interface SeoConfig {
  sites: { url: string; indexNowKeyEnv?: string }[];
  languages?: string[];
  defaultLanguage?: string;
  keyUrls?: string[];
}

export interface GenerateResult {
  bundle: SeoBundle;
  /** Hints of every placeholder fact found anywhere in the bundle. */
  placeholders: string[];
}

export function findPlaceholders(text: string): string[] {
  const hints = new Set<string>();
  for (const m of text.matchAll(/\[\[OWNER-FACT: ([^\]]*)\]\]/g)) hints.add(m[1]!);
  for (const m of text.matchAll(/-9000000\d\d\b/g)) hints.add(`numeric sentinel ${m[0]}`);
  if (text.includes("owner-fact.invalid")) hints.add("site origin (business.website)");
  if (hints.size === 0 && PLACEHOLDER_PATTERNS.some((p) => p.test(text))) hints.add("placeholder");
  return [...hints];
}

export function generateSeo(config: SeoConfig | null, now: Date = new Date()): GenerateResult {
  if (config?.defaultLanguage && config.defaultLanguage !== DEFAULT_LANG) {
    throw new Error(`packages/facts lang.ts DEFAULT_LANG "${DEFAULT_LANG}" disagrees with .jal/seo-geo-aeo.json defaultLanguage "${config.defaultLanguage}"`);
  }
  const pages = allPages();
  const rendered = pages.map((page) => ({ page, body: renderToString(createElement(SitePage, { page, site: siteCopy(page.lang) })) }));
  const llms = llmsTxt(llmsSkeleton, pages);
  const bundle: SeoBundle = {
    version: 1,
    generatedAt: now.toISOString(),
    indexNowHosts: (config?.sites ?? []).map((s) => new URL(s.url).host),
    indexNowKeyEnv: config?.sites[0]?.indexNowKeyEnv ?? "INDEXNOW_KEY",
    pages: rendered.map(({ page, body }) => ({
      path: page.path,
      title: page.title,
      body,
      jsonLd: pageGraph(page, pageFor(page.lang, "home")),
    })),
    notFound: Object.fromEntries(LANGS.map((lang) => [lang, renderToString(createElement(NotFoundPage, { site: siteCopy(lang) }))])),
    files: {
      robotsTxt: robotsTxt(robotsTemplate),
      llmsTxt: llms,
      llmsFullTxt: llmsFullTxt(llms, rendered),
      aiTxt: aiTxt(),
      summaryJson: summaryJson(pages),
      faqJson: faqJson(pages),
      feedXml: feedXml(pages),
      manifest: manifestJson(),
    },
  };
  return { bundle, placeholders: findPlaceholders(JSON.stringify(bundle)) };
}
