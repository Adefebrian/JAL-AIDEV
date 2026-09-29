// apps/web/server/lib/seoTypes.ts - the contract of dist/seo.json.
//
// The server owns this type. The build-time generator (src/seo/content.ts)
// imports it as a type to produce a matching file; nothing under server/
// imports apps/web/src (integrate.md 8.2). Titles and descriptions are NOT in
// here: the server has its own mirrored copy in metaCopy.ts. Pure types.

export interface SeoPageBody {
  path: string;
  /** Prerendered body: the page's own first paint, placed inside #root. */
  body: string;
  /** The page's JSON-LD graph, serialized into one ld+json script. */
  jsonLd: unknown;
  /** The client title, so the server can refuse a stale or drifted file. */
  title: string;
}

export interface SeoBundle {
  version: 1;
  generatedAt: string;
  /** Hosts from .jal/seo-geo-aeo.json. IndexNow submits only for these. */
  indexNowHosts: string[];
  /** Name of the env var that holds the IndexNow key. */
  indexNowKeyEnv: string;
  pages: SeoPageBody[];
  /** 404 body per language. */
  notFound: Record<string, string>;
  files: {
    robotsTxt: string;
    llmsTxt: string;
    llmsFullTxt: string;
    aiTxt: string;
    summaryJson: string;
    faqJson: string;
    feedXml: string;
    manifest: string;
  };
}
