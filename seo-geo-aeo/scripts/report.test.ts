import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { capture, tempProject } from "./fixtures/testkit.ts";
import type { Finding, Status } from "./lib/findings.ts";
import { Redactor } from "./lib/redact.ts";
import { main, renderReport, saveReport } from "./report.ts";
import { scoreFindings } from "./score.ts";

const f = (id: string, status: Status, evidence = `${id} evidence`): Finding => ({ id, status, evidence, fix: "code", source: "audit", hint: `fix ${id}` });
const findings = [f("F-02", "PASS"), f("SEO-01", "FAIL", "line 8 is not a standard directive | Content-Signal"), f("SEO-05", "PASS"), f("AEO-04", "WARN"), f("GEO-06", "WARN"), f("GEO-11", "WARN", "ClaudeBot has not read /rates in 14 days")];
const previous = scoreFindings({ findings: [f("F-02", "PASS"), f("SEO-01", "PASS"), f("SEO-05", "PASS")] });
const score = scoreFindings({
  findings,
  previous,
  site: "https://padel.example",
  now: new Date("2026-09-29T08:00:00Z"),
  context: { console: [{ tool: "gsc", command: "inspect", results: [{ url: "https://padel.example/", verdict: "PASS", coverageState: "Submitted and indexed" }, { url: "https://padel.example/rates", verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed" }] }] },
});

describe("renderReport (section 4.6)", () => {
  const md = renderReport(score, { date: "2026-09-29" });

  test("has the five sections in order", () => {
    const order = ["## 1. Scores", "## 2. Items by pillar", "## 3. Why it may not be showing up yet", "## 4. Questions for the owner", "## 5. Human steps"].map((h) => md.indexOf(h));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(md).not.toContain("## 6. Backlog");
  });

  test("shows the scores with the delta against the previous audit", () => {
    expect(md).toMatch(/\| SEO \| 67 \| weak \| -33 \|/);
    expect(md).toContain("Unverified (human only, excluded from the score, never guessed as PASS): SEO-16, SEO-17, GEO-13.");
    expect(md).toContain("SEO-01 PASS to FAIL");
  });

  test("one table per pillar plus the shared foundation, with who fixes each item", () => {
    for (const h of ["### Shared foundation (counted in every pillar)", "### SEO", "### AEO", "### GEO"]) expect(md).toContain(h);
    expect(md).toContain("| ID | Item | Status | Evidence | Fix | Who fixes it |");
    expect(md).toMatch(/\| SEO-01 \| .* \| FAIL \| line 8 is not a standard directive \\\| Content-Signal \| fix SEO-01 \| code \|/);
    expect(md).toMatch(/\| SEO-16 \| .* \| UNVERIFIED \| needs owner confirmation \|/);
  });

  test("explains why it may not show up from crawler and console evidence", () => {
    expect(md).toContain("Crawl coverage (crawler log): ClaudeBot has not read /rates in 14 days");
    expect(md).toContain("URL Inspection of 2 URLs: 1 Submitted and indexed, 1 Discovered - currently not indexed.");
    expect(md).toContain("Content quality is never assumed to be the cause without this evidence.");
  });

  test("asks the owner about owner-fixed gaps and lists the human steps", () => {
    expect(md).toMatch(/- GEO-06: Statistic density/);
    expect(md).toContain("- SEO-16 (UNVERIFIED)");
    expect(md).toContain("Credentials go in the project env or Coolify, never in chat.");
  });

  test("the boost report adds the backlog ordered by impact", () => {
    const boost = renderReport(score, { date: "2026-09-29", boost: true, effort: { "SEO-01": "S" } });
    expect(boost).toContain("## 6. Backlog");
    const rows = boost.split("\n").filter((l) => /^\| \d/.test(l));
    expect(rows[0]).toMatch(/^\| 3\.0 \| SEO-01 \| FAIL \| S \|/);
  });

  test("no em dash or en dash anywhere", () => {
    const boost = renderReport(score, { date: "2026-09-29", boost: true });
    expect(boost).not.toMatch(/[\u2014\u2013]/);
  });
});

describe("saveReport and CLI", () => {
  let project: { dir: string; cleanup: () => Promise<void> };
  beforeEach(async () => {
    project = await tempProject();
  });
  afterEach(async () => {
    await project.cleanup();
  });

  test("saves audit-YYYY-MM-DD.md and the .json next to it", async () => {
    await writeFile(join(project.dir, "score.json"), JSON.stringify(score));
    const c = capture({ cwd: project.dir, env: {} });
    expect(await main(["score.json"], c.deps)).toBe(0);
    const dir = join(project.dir, ".jal/seo-geo-aeo");
    const md = await readFile(join(dir, "audit-2026-09-29.md"), "utf8");
    const saved = JSON.parse(await readFile(join(dir, "audit-2026-09-29.json"), "utf8"));
    expect(md).toContain("# SEO, AEO and GEO audit: https://padel.example");
    expect(saved.scores.SEO.score).toBe(67);
    expect(saved.report.markdown).toBe(join(dir, "audit-2026-09-29.md"));
    expect(JSON.parse(c.out()).markdown).toBe(join(dir, "audit-2026-09-29.md"));
  });

  test("redacts secrets that reached the evidence", async () => {
    const leaked = scoreFindings({ findings: [f("SEO-15", "FAIL", "key file /leakedkey1234567890.txt returns 404")] });
    const paths = await saveReport(leaked, join(project.dir, "out"), { date: "2026-09-29" }, new Redactor({ INDEXNOW_KEY: "leakedkey1234567890" }));
    expect(await readFile(paths.markdown, "utf8")).not.toContain("leakedkey1234567890");
    expect(await readFile(paths.json, "utf8")).not.toContain("leakedkey1234567890");
  });

  test("refuses input that is not score output", async () => {
    await writeFile(join(project.dir, "x.json"), JSON.stringify({ findings: [] }));
    const c = capture({ cwd: project.dir, env: {} });
    expect(await main(["x.json"], c.deps)).toBe(1);
    expect(c.err()).toContain("not score.ts output");
  });
});
