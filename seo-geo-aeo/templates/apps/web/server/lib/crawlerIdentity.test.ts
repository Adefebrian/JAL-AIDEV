// apps/web/server/lib/crawlerIdentity.test.ts - most specific token first,
// path bucketing, the day in the site timezone. Pure.
import { describe, expect, test } from "bun:test";
import { BOT_TOKENS, bucketPath, dayIn, identifyBot } from "./crawlerIdentity";

describe("identifyBot", () => {
  test("names each documented token", () => {
    for (const token of BOT_TOKENS) expect(identifyBot(`Mozilla/5.0 (compatible; ${token}/1.0; +https://example.test/bot)`)).toBe(token);
  });

  test("the most specific token wins when a user agent carries two", () => {
    expect(identifyBot("Mozilla/5.0; compatible; GPTBot/1.1 OAI-SearchBot/1.0")).toBe("OAI-SearchBot");
    expect(identifyBot("Mozilla/5.0; ClaudeBot/1.0 Claude-SearchBot/1.0")).toBe("Claude-SearchBot");
    expect(identifyBot("Mozilla/5.0; ClaudeBot/1.0 Claude-User/1.0")).toBe("Claude-User");
    expect(identifyBot("Mozilla/5.0 (compatible; Google-InspectionTool/1.0;) Googlebot/2.1")).toBe("Google-InspectionTool");
    expect(identifyBot("Mozilla/5.0 (compatible; GoogleOther) Googlebot")).toBe("GoogleOther");
    expect(identifyBot("PerplexityBot Perplexity-User/1.0")).toBe("Perplexity-User");
  });

  test("OAI-SearchBot is listed before GPTBot and FacebookBot after meta-externalfetcher", () => {
    expect(BOT_TOKENS.indexOf("OAI-SearchBot")).toBeLessThan(BOT_TOKENS.indexOf("GPTBot"));
    expect(BOT_TOKENS.indexOf("Claude-SearchBot")).toBeLessThan(BOT_TOKENS.indexOf("ClaudeBot"));
    expect(BOT_TOKENS.indexOf("FacebookBot")).toBe(BOT_TOKENS.indexOf("meta-externalfetcher") + 1);
  });

  test("matching ignores case", () => {
    expect(identifyBot("mozilla/5.0 (compatible; BINGBOT/2.0)")).toBe("bingbot");
  });

  test("a person or an unknown agent is not a crawler", () => {
    expect(identifyBot("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15")).toBeNull();
    expect(identifyBot(undefined)).toBeNull();
    expect(identifyBot("")).toBeNull();
  });
});

describe("bucketPath", () => {
  const known = new Set(["/", "/rates", "/id/rates", "/llms.txt"]);
  test("live pages and discovery files keep their path", () => {
    expect(bucketPath("/rates", known)).toBe("/rates");
    expect(bucketPath("/llms.txt?x=1", known)).toBe("/llms.txt");
  });
  test("assets collapse to one bucket, unknown paths to another", () => {
    expect(bucketPath("/chunk-abc123.js", known)).toBe("(asset)");
    expect(bucketPath("/wp-login.php", known)).toBe("(other)");
    expect(bucketPath("/.env", known)).toBe("(other)");
  });
});

describe("dayIn", () => {
  test("uses the site timezone, not UTC", () => {
    const late = new Date("2026-09-29T20:00:00Z");
    expect(dayIn(late, "Asia/Jakarta")).toBe("2026-09-30");
    expect(dayIn(late, "UTC")).toBe("2026-09-29");
  });
});
