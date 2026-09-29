// packages/facts/src/placeholder.ts - the one way to mark a fact the owner has
// not confirmed yet.
//
// Hard law 1 (verified facts only): `/jal-seo-geo-aeo integrate` installs the
// fact modules with every value wrapped in ownerFact() or ownerNumber(). The
// command then asks the owner for each one and replaces the call with the
// confirmed literal plus a `// confirmed YYYY-MM-DD by <who>` comment.
//
// A placeholder is loud on purpose. ownerFact() returns a marker string and
// ownerNumber() returns a sentinel number, and both are in FORBIDDEN_CLAIMS
// (forbidden.ts). So while ANY placeholder reaches a served body, a
// JSON-LD block or a discovery file, content.test.ts fails, and the build
// refuses to write dist/seo.json (unless SEO_ALLOW_PLACEHOLDERS=1 for a local
// draft). This module imports nothing, so any test can load it.

export const PLACEHOLDER_MARK = "[[OWNER-FACT";

/** A text fact the owner still has to confirm. */
export function ownerFact(hint: string): string {
  return `${PLACEHOLDER_MARK}: ${hint}]]`;
}

// Sentinel numbers sit in -900000001 .. -900000099. No real price, count or
// coordinate is ever in that range, so a leaked sentinel is unambiguous.
const numericHints = new Map<number, string>();
let nextSentinel = 0;

/** A numeric fact the owner still has to confirm (price, count, coordinate). */
export function ownerNumber(hint: string): number {
  nextSentinel += 1;
  const n = -(900_000_000 + nextSentinel);
  numericHints.set(n, hint);
  return n;
}

export function isPlaceholderNumber(n: number): boolean {
  return numericHints.has(n);
}

/** Formats a number for copy; a sentinel becomes the loud text marker. */
export function showNumber(n: number, format: (n: number) => string): string {
  const hint = numericHints.get(n);
  return hint === undefined ? format(n) : ownerFact(hint);
}

/** The site origin until the owner confirms it. `.invalid` is a reserved TLD
 * (RFC 2606), so it can never be a real host, and it is a URL that parses. */
export const PLACEHOLDER_ORIGIN = "https://owner-fact.invalid";

/** Regexes that detect a leaked placeholder in any served text. */
export const PLACEHOLDER_PATTERNS: RegExp[] = [/\[\[OWNER-FACT/, /-9000000\d\d\b/, /owner-fact\.invalid/];
