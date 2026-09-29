import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { capture, tempProject } from "./fixtures/testkit.ts";
import { CHECKLIST, type Finding, type Status } from "./lib/findings.ts";
import { band, findPreviousReport, main, scoreFindings } from "./score.ts";

const f = (id: string, status: Status, source = "audit"): Finding => ({ id, status, evidence: `${id} ${status}`, fix: "code", source, hint: `fix ${id}` });

const BASE: Finding[] = [
  f("F-02", "PASS"),
  f("F-03", "WARN"),
  f("SEO-01", "PASS"),
  f("SEO-05", "FAIL"),
  f("SEO-16", "PASS"),
  f("AEO-04", "PASS"),
  f("AEO-05", "WARN"),
  f("GEO-06", "PASS", "audit"),
  f("GEO-06", "WARN", "density"),
];
const CONFIRM = [{ id: "GEO-13", status: "PASS" as Status, confirmedBy: "owner", date: "2026-09-28" }];

describe("scoring math (section 4.5)", () => {
  test("pillar score = round(100 x sum(weight x status) / sum(weight)), foundation counted in every pillar", () => {
    const r = scoreFindings({ findings: BASE, confirmations: CONFIRM });
    // SEO: F-02 3x1 + F-03 3x0.5 + SEO-01 3x1 + SEO-05 3x0 = 7.5 of 12
    expect(r.scores.SEO).toMatchObject({ score: 63, earned: 7.5, possible: 12, counted: 4, band: "weak" });
    // AEO: 3 + 1.5 + 3 + 1.5 = 9 of 12
    expect(r.scores.AEO).toMatchObject({ score: 75, earned: 9, possible: 12, band: "needs work" });
    // GEO: 3 + 1.5 + GEO-06 2x0.5 + GEO-13 2x1 = 7.5 of 10
    expect(r.scores.GEO).toMatchObject({ score: 75, earned: 7.5, possible: 10 });
  });

  test("N/A is excluded from the total", () => {
    const withNa = scoreFindings({ findings: [...BASE, f("SEO-08", "N/A"), f("SEO-10", "N/A")], confirmations: CONFIRM });
    const without = scoreFindings({ findings: BASE, confirmations: CONFIRM });
    expect(withNa.scores.SEO).toEqual(without.scores.SEO);
    expect(withNa.items.find((i) => i.id === "SEO-08")!.state).toBe("na");
  });

  test("the worst status wins when several sources report one item", () => {
    const r = scoreFindings({ findings: BASE });
    const geo06 = r.items.find((i) => i.id === "GEO-06")!;
    expect(geo06.status).toBe("WARN");
    expect(geo06.sources.sort()).toEqual(["audit", "density"]);
  });

  test("unconfirmed human-only items are excluded and listed as unverified, never guessed as PASS", () => {
    const r = scoreFindings({ findings: BASE });
    expect(r.unverified).toEqual(["SEO-16", "SEO-17", "GEO-13"]);
    const seo16 = r.items.find((i) => i.id === "SEO-16")!;
    expect(seo16.state).toBe("unverified");
    expect(seo16.status).toBeNull();
    expect(seo16.evidence[0]).toContain("not counted");
    // A machine PASS on SEO-16 changed nothing.
    expect(r.scores.SEO.possible).toBe(12);
  });

  test("an owner confirmation makes a human item count", () => {
    const confirmed = scoreFindings({ findings: BASE, confirmations: [{ id: "SEO-16", status: "FAIL", confirmedBy: "owner", date: "2026-09-29" }] });
    expect(confirmed.unverified).not.toContain("SEO-16");
    expect(confirmed.scores.SEO).toMatchObject({ earned: 7.5, possible: 14, score: 54 });
  });

  test("a confirmation without who or when is ignored", () => {
    const r = scoreFindings({ findings: BASE, confirmations: [{ id: "SEO-16", status: "PASS" } as any] });
    expect(r.unverified).toContain("SEO-16");
  });

  test("items with no finding are listed as not measured and excluded", () => {
    const r = scoreFindings({ findings: BASE });
    expect(r.notMeasured).toContain("F-01");
    expect(r.notMeasured).toContain("GEO-11");
    expect(r.notMeasured).not.toContain("SEO-01");
  });

  test("all PASS on every automatic item scores 100 in every pillar", () => {
    const auto = CHECKLIST.items.filter((i) => i.check === "auto").map((i) => f(i.id, "PASS"));
    const r = scoreFindings({ findings: auto });
    for (const p of ["SEO", "AEO", "GEO"] as const) expect(r.scores[p].score).toBe(100);
  });

  test("bands: 90 to 100 strong, 70 to 89 needs work, below 70 weak", () => {
    expect(band(100)).toBe("strong");
    expect(band(90)).toBe("strong");
    expect(band(89)).toBe("needs work");
    expect(band(70)).toBe("needs work");
    expect(band(69)).toBe("weak");
    expect(band(null)).toBeNull();
  });

  test("delta against a previous report, per pillar and per item", () => {
    const previous = scoreFindings({ findings: [...BASE.filter((x) => x.id !== "SEO-05"), f("SEO-05", "PASS")], confirmations: CONFIRM });
    const r = scoreFindings({ findings: BASE, confirmations: CONFIRM, previous });
    expect(r.scores.SEO.previous).toBe(88);
    expect(r.scores.SEO.delta).toBe(63 - 88);
    expect(r.scores.AEO.delta).toBe(0);
    expect(r.itemDeltas).toEqual([{ id: "SEO-05", from: "PASS", to: "FAIL" }]);
  });

  test("backlog impact = weight x (1 - status), highest first", () => {
    const r = scoreFindings({ findings: BASE });
    expect(r.backlog.map((b) => [b.id, b.impact])).toEqual([["SEO-05", 3], ["AEO-05", 1.5], ["F-03", 1.5], ["GEO-06", 1]]);
  });

  test("unknown ids are reported, not scored", () => {
    const r = scoreFindings({ findings: [...BASE, f("SEO-99", "FAIL")] });
    expect(r.ignored).toEqual(["SEO-99"]);
  });
});

describe("score.ts CLI", () => {
  let project: { dir: string; cleanup: () => Promise<void> };
  beforeEach(async () => {
    project = await tempProject();
  });
  afterEach(async () => {
    await project.cleanup();
  });

  test("reads audit, density and human files and picks the previous report automatically", async () => {
    const dir = join(project.dir, ".jal/seo-geo-aeo");
    await mkdir(dir, { recursive: true });
    const prev = scoreFindings({ findings: [f("SEO-01", "FAIL")] });
    await writeFile(join(dir, "audit-2026-09-20.json"), JSON.stringify(prev));
    await writeFile(join(dir, "audit-2026-09-29.json"), JSON.stringify({ scores: { SEO: { score: 1 } } }));
    await writeFile(join(project.dir, "audit.json"), JSON.stringify({ tool: "audit", origin: "https://padel.example", findings: [f("SEO-01", "PASS")] }));
    await writeFile(join(project.dir, "density.json"), JSON.stringify({ tool: "density", findings: [f("GEO-06", "WARN", "density")] }));
    await writeFile(join(project.dir, "human.json"), JSON.stringify({ confirmations: CONFIRM }));
    const c = capture({ cwd: project.dir, env: {} });
    const code = await main(["--audit", "audit.json", "--density", "density.json", "--human", "human.json", "--previous", "auto", "--out", "score.json"], c.deps);
    expect(c.err()).toBe("");
    expect(code).toBe(0);
    const out = JSON.parse(c.out());
    expect(out.site).toBe("https://padel.example");
    expect(out.previous.path).toBe(join(dir, "audit-2026-09-20.json"));
    expect(out.scores.SEO.delta).toBe(100);
    expect(out.unverified).toEqual(["SEO-16", "SEO-17"]);
    expect(await Bun.file(join(project.dir, "score.json")).exists()).toBe(true);
  });

  test("findPreviousReport ignores today's and later reports", async () => {
    const dir = join(project.dir, "reports");
    await mkdir(dir);
    for (const d of ["2026-09-01", "2026-09-15", "2026-09-29", "2026-10-01"]) await writeFile(join(dir, `audit-${d}.json`), "{}");
    expect(await findPreviousReport(dir, "2026-09-29")).toBe(join(dir, "audit-2026-09-15.json"));
    expect(await findPreviousReport(join(project.dir, "none"), "2026-09-29")).toBeNull();
  });
});
