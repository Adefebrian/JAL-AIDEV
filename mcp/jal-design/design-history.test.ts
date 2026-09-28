import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { designHistory, summarize, type DesignLogEntry } from "./design-history";

const e = (over: Partial<DesignLogEntry>): DesignLogEntry => ({
  ts: "2026-09-29T00:00:00Z",
  product: "p",
  surface: "marketing",
  section_kind: "hero",
  stack: ["mu.R02"],
  ...over,
});

let repo: string;
beforeAll(async () => {
  repo = await mkdtemp(join(tmpdir(), "jal-design-history-"));
  await mkdir(join(repo, ".jal", "memory"), { recursive: true });
  const lines = [
    JSON.stringify(e({ stack: ["nz.section.gaze", "mu.R02"], taste: 2.6, disposition: "ship" })),
    "not json",
    JSON.stringify(e({ stack: ["nz.section.gaze", "mu.R02"], taste: 2.4, disposition: "ship" })),
    JSON.stringify(e({ stack: ["three.studio_object"], taste: 1.2, disposition: "rebuild", audit_failures: ["reduced-motion"] })),
    JSON.stringify(e({ section_kind: "data_table", surface: "product_ui", stack: ["core.table"], taste: 2.1 })),
  ];
  await writeFile(join(repo, ".jal", "memory", "design-log.jsonl"), lines.join("\n") + "\n");
});
afterAll(async () => {
  await rm(repo, { recursive: true, force: true });
});

describe("design history", () => {
  test("ranks stacks by mean taste, skips corrupt lines, and filters by section kind", () => {
    const h = designHistory(repo, { section_kind: "hero" });
    expect(h.entries).toBe(3);
    expect(h.top[0].stack).toBe("nz.section.gaze + mu.R02");
    expect(h.top[0].mean_taste).toBe(2.5);
    expect(h.top[0].shipped).toBe(2);
  });

  test("puts rebuilt or low-scoring stacks on the avoid list, never on top", () => {
    const h = designHistory(repo, { section_kind: "hero" });
    expect(h.avoid.map((s) => s.stack)).toContain("three.studio_object");
    expect(h.top.map((s) => s.stack)).not.toContain("three.studio_object");
  });

  test("per-recipe stats count every layer a recipe appeared in", () => {
    const h = designHistory(repo, { section_kind: "hero" });
    expect(h.recipes["mu.R02"]).toEqual({ runs: 2, mean_taste: 2.5 });
  });

  test("an empty or missing log returns an empty history", () => {
    expect(summarize([]).entries).toBe(0);
    expect(designHistory(join(repo, "nope")).top).toEqual([]);
  });
});
