// Page recipes and the anti-repetition law, as data an agent can check
// before it writes markup (identity.md section 5). A page is the ordered
// list of its compositions; validatePageRecipe returns every broken rule.
//   1. A marketing page opens on a Masthead (any variant). Nothing else is a hero.
//   2. No two adjacent sections share a composition.
//   3. No composition appears more than twice on a page (Masthead and Footer once).
//   4. A marketing page carries the data identity: at least one BentoGrid,
//      SpecTable, SpecRail section, or StatRow.
//   5. A StatRow never directly follows the Masthead (no big-number hero).
//   6. The Footer, when present, is last.
export type CompositionId =
  | "masthead"
  | "logo-row"
  | "split"
  | "bento"
  | "stat-row"
  | "spec-table"
  | "spec-rail"
  | "feature-grid"
  | "media"
  | "sticky-story"
  | "quote"
  | "pricing"
  | "faq"
  | "cta-band"
  | "footer"
  /** Hand-written layout on the kit grid, recorded in docs/design/direction.md. */
  | "custom";

export type PageKind = "marketing" | "product";

const DATA_IDENTITY: CompositionId[] = ["bento", "spec-table", "spec-rail", "stat-row"];
const ONCE: CompositionId[] = ["masthead", "footer"];

export function validatePageRecipe(sections: CompositionId[], kind: PageKind = "marketing"): string[] {
  const errors: string[] = [];
  if (sections.length === 0) return ["the page has no sections"];
  if (kind === "marketing" && sections[0] !== "masthead") {
    errors.push(`a marketing page opens on a masthead, not ${sections[0]}`);
  }
  for (let i = 1; i < sections.length; i++) {
    if (sections[i] === sections[i - 1] && sections[i] !== "custom") {
      errors.push(`sections ${i} and ${i + 1} are both ${sections[i]}; neighbors must differ`);
    }
  }
  const counts = new Map<CompositionId, number>();
  for (const s of sections) counts.set(s, (counts.get(s) ?? 0) + 1);
  for (const [s, n] of counts) {
    if (s === "custom") continue;
    const cap = ONCE.includes(s) ? 1 : 2;
    if (n > cap) errors.push(`${s} appears ${n} times; at most ${cap}`);
  }
  if (kind === "marketing" && !sections.some((s) => DATA_IDENTITY.includes(s))) {
    errors.push("a marketing page needs a bento, spec-table, spec-rail, or stat-row to carry the data identity");
  }
  const m = sections.indexOf("masthead");
  if (m !== -1 && sections[m + 1] === "stat-row") errors.push("a stat-row directly under the masthead reads as a big-number hero");
  const f = sections.indexOf("footer");
  if (f !== -1 && f !== sections.length - 1) errors.push("the footer must be last");
  return errors;
}

/** The page recipes in identity.md, in section order. JEV still gates each region. */
export const PAGE_RECIPES: Record<string, CompositionId[]> = {
  product_landing: ["masthead", "logo-row", "split", "stat-row", "sticky-story", "bento", "spec-table", "quote", "feature-grid", "pricing", "faq", "cta-band", "footer"],
  saas_landing: ["masthead", "logo-row", "bento", "sticky-story", "split", "quote", "pricing", "faq", "cta-band", "footer"],
  company_profile: ["masthead", "split", "stat-row", "feature-grid", "quote", "split", "cta-band", "footer"],
  portfolio: ["masthead", "bento", "split", "quote", "media", "cta-band", "footer"],
  docs_home: ["masthead", "feature-grid", "spec-table", "faq", "footer"],
  pricing: ["masthead", "pricing", "spec-table", "faq", "cta-band", "footer"],
  app_dashboard_entry: ["custom", "bento", "spec-table"],
};
