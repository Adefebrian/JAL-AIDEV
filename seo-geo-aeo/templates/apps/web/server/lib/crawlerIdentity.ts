// apps/web/server/lib/crawlerIdentity.ts - which crawler asked, for which
// page, on which day. Pure and import-free (integrate.md 8.2).
//
// Tokens are matched MOST SPECIFIC FIRST: OAI-SearchBot before GPTBot,
// Claude-SearchBot and Claude-User before ClaudeBot, Google-InspectionTool
// and GoogleOther before Googlebot. User agents are claimed, not verified; a
// burst of many "bots" in one second probing paths that do not exist is one
// scanner, which is why unknown paths collapse into one "(other)" bucket.

export const BOT_TOKENS: readonly string[] = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "anthropic-ai",
  "Perplexity-User",
  "PerplexityBot",
  "Google-InspectionTool",
  "GoogleOther",
  "Googlebot",
  "bingbot",
  "Applebot",
  "meta-externalagent",
  "meta-externalfetcher",
  "FacebookBot",
  "Amazonbot",
  "Bytespider",
  "DuckAssistBot",
  "YouBot",
  "MistralAI-User",
  "cohere-ai",
  "CCBot",
  "YandexBot",
  "Baiduspider",
  "PetalBot",
];

const LOWER = BOT_TOKENS.map((t) => [t, t.toLowerCase()] as const);

/** The crawler token in a user agent, or null for a person or unknown agent. */
export function identifyBot(userAgent: string | undefined | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  for (const [token, lower] of LOWER) if (ua.includes(lower)) return token;
  return null;
}

const ASSET_RE = /\.(js|mjs|css|map|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|glb|gltf|ktx2|hdr|wasm|bin)$/i;

/** Keeps the table small: live pages and discovery files by path, the rest bucketed. */
export function bucketPath(path: string, known: ReadonlySet<string>): string {
  const clean = path.split("?")[0] || "/";
  if (known.has(clean)) return clean;
  if (ASSET_RE.test(clean)) return "(asset)";
  return "(other)";
}

/** YYYY-MM-DD of `date` in the site timezone (not UTC, not the server's zone). */
export function dayIn(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
