import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CHECKLIST } from "./lib/findings.ts";

const SPEC = join(import.meta.dir, "../../docs/superpowers/specs/2026-09-29-jal-seo-geo-aeo-instruction.md");

describe("checklist.json", () => {
  test("holds F-01 to F-04, SEO-01 to SEO-18, AEO-01 to AEO-12 and GEO-01 to GEO-14", () => {
    const ids = CHECKLIST.items.map((i) => i.id);
    const expected = [
      ...Array.from({ length: 4 }, (_, i) => `F-0${i + 1}`),
      ...Array.from({ length: 18 }, (_, i) => `SEO-${String(i + 1).padStart(2, "0")}`),
      ...Array.from({ length: 12 }, (_, i) => `AEO-${String(i + 1).padStart(2, "0")}`),
      ...Array.from({ length: 14 }, (_, i) => `GEO-${String(i + 1).padStart(2, "0")}`),
    ];
    expect(ids).toEqual(expected);
  });

  test("every item has a pillar, a weight from 1 to 3, a check method and a fix method", () => {
    for (const i of CHECKLIST.items) {
      expect(["F", "SEO", "AEO", "GEO"]).toContain(i.pillar);
      expect(i.id.startsWith(i.pillar === "F" ? "F-" : i.pillar)).toBe(true);
      expect([1, 2, 3]).toContain(i.weight);
      expect(["auto", "evidence", "human", "console", "crawler"]).toContain(i.check);
      expect(i.fix.length).toBeGreaterThan(0);
      expect(i.title.length).toBeGreaterThan(10);
    }
  });

  test("only the console, Business Profile and offsite items are human-only", () => {
    expect(CHECKLIST.items.filter((i) => i.humanOnly).map((i) => i.id)).toEqual(["SEO-16", "SEO-17", "GEO-13"]);
  });

  test.if(existsSync(SPEC))("ids and weights match section 5 of the instruction", () => {
    const text = readFileSync(SPEC, "utf8");
    const rows = [...text.matchAll(/^\| ((?:F|SEO|AEO|GEO)-\d{2}) \| .* \| (\d) \| ([^|]+) \| ([^|]+) \|$/gm)];
    const spec = new Map(rows.map((m) => [m[1], { weight: Number(m[2]), check: m[3].trim(), fix: m[4].trim() }]));
    expect(spec.size).toBe(CHECKLIST.items.length);
    for (const i of CHECKLIST.items) {
      const s = spec.get(i.id)!;
      expect(s).toBeDefined();
      expect(i.weight).toBe(s.weight);
      expect(i.checkText).toBe(s.check);
      expect(i.fix.join(" + ")).toBe(s.fix);
    }
  });

  test("no em dash or en dash in the checklist", () => {
    expect(readFileSync(join(import.meta.dir, "checklist.json"), "utf8")).not.toMatch(/[\u2014\u2013]/);
  });
});
