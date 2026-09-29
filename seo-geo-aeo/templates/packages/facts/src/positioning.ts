// packages/facts/src/positioning.ts - claims the OWNER confirmed, per language,
// each with its evidence.
//
// A superlative ("the first", "the largest", "termurah") is written on a page
// only when it is here with evidence and a confirmation date. A claim the
// owner rejects goes into forbidden.ts as a regex instead (AEO-10).
import { ownerFact } from "./placeholder";

export interface Claim {
  id: string;
  text: { en: string; id: string };
  /** Where the claim can be checked: a press URL or an internal path. */
  evidence: string;
  confirmedOn: string;
}

export const POSITIONING: Claim[] = [
  {
    id: "positioning-1",
    text: { en: ownerFact("one-sentence positioning EN"), id: ownerFact("one-sentence positioning ID") },
    evidence: ownerFact("evidence URL or internal path"),
    confirmedOn: ownerFact("confirmation date YYYY-MM-DD"),
  },
];

/** The lead positioning sentence for llms.txt and the home page. */
export function leadClaim(lang: "en" | "id"): string {
  return POSITIONING[0]?.text[lang] ?? "";
}
