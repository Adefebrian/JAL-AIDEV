// packages/facts/src/forbidden.ts - every rejected claim is a regex here.
//
// content.test.ts scans EVERY served body, every JSON-LD block, llms.txt,
// llms-full.txt, ai.txt, summary.json, faq.json, feed.xml, robots.txt and the
// sitemap against this list. When the owner rejects a claim, add a row with
// the date; never delete a row to make a test pass.
import { PLACEHOLDER_PATTERNS } from "./placeholder";

export interface ForbiddenClaim {
  pattern: RegExp;
  reason: string;
  rejectedOn: string;
}

// U+2014, built from its code point so this file itself stays free of it.
const LONG_DASH = new RegExp(String.fromCharCode(0x2014));

export const FORBIDDEN_CLAIMS: ForbiddenClaim[] = [
  // A placeholder fact reaching a served body is always a failure.
  ...PLACEHOLDER_PATTERNS.map((pattern) => ({
    pattern,
    reason: "placeholder fact reached served text; ask the owner and fill it in packages/facts",
    rejectedOn: "always",
  })),
  // JAL frontend law: no long dash (U+2014) in any frontend copy.
  { pattern: LONG_DASH, reason: "U+2014 dash in frontend copy (JAL law)", rejectedOn: "always" },
  // Unconfirmed market superlatives ("the cheapest in <city>", "terbaik di
  // <kota>", "number one"). A band being the cheapest of the business's OWN
  // prices ("the cheapest time is 06:00") is a fact, not a superlative, and
  // passes. Remove a phrase only after positioning.ts holds the
  // owner-confirmed claim with evidence.
  {
    pattern: /\b(cheapest|best|largest|biggest|first) (in|of all)\b|\b(termurah|terbaik|terbesar|pertama) (di|se)\b|\bnumber one\b|\bnomor satu\b|#1\b/i,
    reason: "superlative not confirmed by the owner (AEO-10)",
    rejectedOn: "always",
  },
  // Owner-rejected claims go below, one row each, for example:
  // { pattern: /\bfirst\b[^.]{0,40}\bclub\b/i, reason: "owner: we are not the first club", rejectedOn: "2026-09-29" },
];

/** Every forbidden match in `text`, for readable test failures. */
export function findForbidden(text: string): { reason: string; match: string }[] {
  const hits: { reason: string; match: string }[] = [];
  for (const claim of FORBIDDEN_CLAIMS) {
    const m = claim.pattern.exec(text);
    if (m) {
      const start = Math.max(0, m.index - 24);
      hits.push({ reason: claim.reason, match: text.slice(start, m.index + m[0].length + 40).replace(/\s+/g, " ") });
    }
  }
  return hits;
}
