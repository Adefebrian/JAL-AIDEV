// packages/facts/src/differentiators.ts - what is different, each with the URL
// where a reader can see it. content.test.ts proves every internal URL is live.
import { ownerFact } from "./placeholder";

export interface Differentiator {
  id: string;
  text: { en: string; id: string };
  /** Internal path (e.g. "/rates") or an absolute URL. */
  url: string;
  confirmedOn: string;
}

export const DIFFERENTIATORS: Differentiator[] = [
  {
    id: "diff-1",
    text: { en: ownerFact("differentiator EN"), id: ownerFact("differentiator ID") },
    url: "/rates",
    confirmedOn: ownerFact("confirmation date YYYY-MM-DD"),
  },
];
