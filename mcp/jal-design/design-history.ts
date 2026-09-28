// Design learning memory. Every /jal-ui build appends one JSON line per
// section to .jal/memory/design-log.jsonl (what was stacked, how it scored,
// what failed). This aggregates that history so the next run's JEV calls
// (ui.direction_screen, ui.component_recipe, imm.recipe) see which stacks
// worked on similar sections and which failed. Zero dependencies.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type DesignLogEntry = {
  ts: string;
  product: string;
  surface: string; // product_ui | marketing | immersive
  section_kind: string; // hero, feature_grid, data_table, ...
  direction?: string; // direction preset or seed key
  stack: string[]; // recipe IDs in layer order, e.g. ["nz.section.gaze", "mu.R02", "gsap.scrub"]
  taste?: number; // ui.final_taste or imm.taste score (0 to 3)
  disposition?: string; // ui.finish_disposition: ship | fix | rebuild | recapture
  audit_failures?: string[]; // ui_audit rule names that failed before the final pass
  kept?: boolean; // survived to the shipped build
};

export type StackStat = {
  stack: string;
  runs: number;
  mean_taste: number | null;
  shipped: number;
  rebuilt: number;
  audit_failures: Record<string, number>;
};

export type DesignHistory = {
  entries: number;
  section_kind?: string;
  top: StackStat[]; // best mean taste first (min runs applied)
  avoid: StackStat[]; // rebuilt or repeatedly failing audits
  recipes: Record<string, { runs: number; mean_taste: number | null }>;
};

export function logPath(repo: string): string {
  return join(repo, ".jal", "memory", "design-log.jsonl");
}

export function readDesignLog(repo: string): DesignLogEntry[] {
  const p = logPath(repo);
  if (!existsSync(p)) return [];
  const out: DesignLogEntry[] = [];
  for (const line of readFileSync(p, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line) as DesignLogEntry;
      if (Array.isArray(e.stack) && typeof e.section_kind === "string") out.push(e);
    } catch {
      // skip a corrupt line, never fail the whole history
    }
  }
  return out;
}

function mean(xs: number[]): number | null {
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;
}

export function summarize(
  entries: DesignLogEntry[],
  opts: { section_kind?: string; surface?: string; minRuns?: number; limit?: number } = {},
): DesignHistory {
  const minRuns = opts.minRuns ?? 1;
  const limit = opts.limit ?? 5;
  const pool = entries.filter(
    (e) => (!opts.section_kind || e.section_kind === opts.section_kind) && (!opts.surface || e.surface === opts.surface),
  );
  const byStack = new Map<string, DesignLogEntry[]>();
  const byRecipe = new Map<string, number[]>();
  const recipeRuns = new Map<string, number>();
  for (const e of pool) {
    const key = e.stack.join(" + ");
    byStack.set(key, [...(byStack.get(key) ?? []), e]);
    for (const r of e.stack) {
      recipeRuns.set(r, (recipeRuns.get(r) ?? 0) + 1);
      if (typeof e.taste === "number") byRecipe.set(r, [...(byRecipe.get(r) ?? []), e.taste]);
    }
  }
  const stats: StackStat[] = [...byStack.entries()].map(([stack, es]) => {
    const fails: Record<string, number> = {};
    for (const e of es) for (const f of e.audit_failures ?? []) fails[f] = (fails[f] ?? 0) + 1;
    return {
      stack,
      runs: es.length,
      mean_taste: mean(es.flatMap((e) => (typeof e.taste === "number" ? [e.taste] : []))),
      shipped: es.filter((e) => e.disposition === "ship" || e.kept === true).length,
      rebuilt: es.filter((e) => e.disposition === "rebuild").length,
      audit_failures: fails,
    };
  });
  const top = stats
    .filter((s) => s.runs >= minRuns && s.mean_taste !== null && s.rebuilt === 0)
    .sort((a, b) => (b.mean_taste ?? 0) - (a.mean_taste ?? 0) || b.shipped - a.shipped)
    .slice(0, limit);
  const avoid = stats
    .filter((s) => s.rebuilt > 0 || (s.mean_taste !== null && s.mean_taste < 1.5) || Object.values(s.audit_failures).some((n) => n >= 2))
    .sort((a, b) => b.rebuilt - a.rebuilt || (a.mean_taste ?? 3) - (b.mean_taste ?? 3))
    .slice(0, limit);
  const recipes: Record<string, { runs: number; mean_taste: number | null }> = {};
  for (const [r, runs] of recipeRuns) recipes[r] = { runs, mean_taste: mean(byRecipe.get(r) ?? []) };
  return { entries: pool.length, section_kind: opts.section_kind, top, avoid, recipes };
}

export function designHistory(repo: string, opts: Parameters<typeof summarize>[1] = {}): DesignHistory {
  return summarize(readDesignLog(repo), opts);
}
