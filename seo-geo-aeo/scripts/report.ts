#!/usr/bin/env bun
// report.ts <score.json> [--out-dir .jal/seo-geo-aeo] [--date YYYY-MM-DD] [--boost]
//           [--questions q.json] [--effort e.json]
// Renders the section 4.6 report as markdown from score.ts output and saves
// audit-YYYY-MM-DD.md plus audit-YYYY-MM-DD.json next to it, so the next run
// can show the delta.

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";
import { emitError, resolveDeps, today, type Deps } from "./lib/cli.ts";
import { Redactor } from "./lib/redact.ts";
import { PILLARS, REPORT_DIR, type ItemResult, type ScoreResult } from "./score.ts";

export type ReportOptions = {
  date: string;
  boost?: boolean;
  questions?: string[];
  /** Effort per backlog id (S, M or L); JEV orders ties. */
  effort?: Record<string, string>;
};

const CONSOLE_SETUP = [
  "Search Console: add a Domain property (DNS TXT) or a URL-prefix property, submit the sitemap, and add the automation service account as a user if the scripts will be used.",
  "Bing Webmaster Tools: import from Search Console or verify, submit the sitemap, create the API key, and use the IndexNow key issued there.",
  "Yandex Webmaster: add and verify the site, submit the sitemap, and create an OAuth token.",
  "Business Profile, Bing Places and Apple Business Connect: same NAP, hours and website as the site (offsite pack).",
  "Credentials go in the project env or Coolify, never in chat.",
];

function cell(s: string): string {
  return s.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}

function statusCell(i: ItemResult): string {
  if (i.state === "unverified") return "UNVERIFIED";
  if (i.state === "not-measured") return "NOT MEASURED";
  return i.status ?? "";
}

function who(i: ItemResult): string {
  return i.fix.join(" + ");
}

function signed(n: number | null): string {
  if (n === null) return "first audit";
  return n > 0 ? `+${n}` : String(n);
}

function table(items: ItemResult[]): string[] {
  const out = ["| ID | Item | Status | Evidence | Fix | Who fixes it |", "|---|---|---|---|---|---|"];
  for (const i of items) {
    const evidence = i.evidence.length ? i.evidence.join(" / ") : i.state === "unverified" ? "needs owner confirmation" : "no finding in this run";
    out.push(`| ${i.id} | ${cell(i.title)} | ${statusCell(i)} | ${cell(evidence)} | ${cell(i.hints[0] ?? (i.status === "PASS" ? "none" : ""))} | ${who(i)} |`);
  }
  return out;
}

function summariseConsole(ctx: unknown): string[] {
  const lines: string[] = [];
  for (const c of Array.isArray(ctx) ? ctx : ctx ? [ctx] : []) {
    const results = Array.isArray((c as any)?.results) ? (c as any).results : [];
    if ((c as any)?.command === "inspect" && results.length) {
      const counts = new Map<string, number>();
      for (const r of results) counts.set(r.coverageState ?? r.verdict ?? "unknown", (counts.get(r.coverageState ?? r.verdict ?? "unknown") ?? 0) + 1);
      lines.push(`URL Inspection of ${results.length} URLs: ${[...counts].map(([k, v]) => `${v} ${k}`).join(", ")}.`);
      const notIndexed = results.filter((r: any) => r.verdict && r.verdict !== "PASS").map((r: any) => r.url);
      if (notIndexed.length) lines.push(`Not indexed yet: ${notIndexed.join(", ")}.`);
    } else if ((c as any)?.command === "performance" && Array.isArray((c as any)?.rows)) {
      lines.push(`Search performance: ${(c as any).rows.length} query and page rows over ${(c as any).startDate ?? "?"} to ${(c as any).endDate ?? "?"}.`);
    }
  }
  return lines;
}

export function renderReport(score: ScoreResult, opts: ReportOptions): string {
  const byId = new Map(score.items.map((i) => [i.id, i]));
  const L: string[] = [];
  L.push(`# SEO, AEO and GEO audit${score.site ? `: ${score.site}` : ""}`, "", `Date: ${opts.date}. Generated ${score.generatedAt}.`, "");

  L.push("## 1. Scores", "", "| Pillar | Score | Band | Delta | Items counted |", "|---|---|---|---|---|");
  for (const p of PILLARS) {
    const s = score.scores[p];
    L.push(`| ${p} | ${s.score ?? "n/a"} | ${s.band ?? "n/a"} | ${signed(s.delta)} | ${s.counted} |`);
  }
  L.push("", "Bands: 90 to 100 strong; 70 to 89 needs work; below 70 weak. Shared foundation items F-01 to F-04 count in every pillar. N/A items are excluded.");
  if (score.unverified.length) L.push("", `Unverified (human only, excluded from the score, never guessed as PASS): ${score.unverified.join(", ")}.`);
  if (score.notMeasured.length) L.push("", `Not measured in this run (excluded): ${score.notMeasured.join(", ")}.`);
  if (score.itemDeltas.length) L.push("", `Changed since the previous audit: ${score.itemDeltas.map((d) => `${d.id} ${d.from ?? "none"} to ${d.to ?? "none"}`).join("; ")}.`);
  L.push("");

  L.push("## 2. Items by pillar", "");
  L.push("### Shared foundation (counted in every pillar)", "", ...table(score.items.filter((i) => i.pillar === "F")), "");
  for (const p of PILLARS) L.push(`### ${p}`, "", ...table(score.items.filter((i) => i.pillar === p)), "");

  const open = score.items.filter((i) => (i.state === "scored" && i.status !== "PASS") || i.state === "unverified" || i.state === "not-measured");
  const code = open.filter((i) => i.state === "scored" && i.fix.includes("code"));
  const owner = open.filter((i) => i.fix.includes("owner"));
  const human = open.filter((i) => i.fix.includes("human") || i.state === "unverified");
  L.push("### Gaps by who fixes them", "");
  L.push(`- Code can fix: ${code.map((i) => `${i.id} (${i.status})`).join(", ") || "none"}.`);
  L.push(`- Needs owner facts: ${owner.map((i) => i.id).join(", ") || "none"}.`);
  L.push(`- Offsite or human only: ${human.map((i) => i.id).join(", ") || "none"}.`, "");

  L.push("## 3. Why it may not be showing up yet", "");
  const geo11 = byId.get("GEO-11");
  if (geo11 && geo11.evidence.length) L.push(`- Crawl coverage (crawler log): ${cell(geo11.evidence.join(" / "))}`);
  else if (score.context.crawler) L.push(`- Crawl coverage (crawler log): ${cell(JSON.stringify(score.context.crawler).slice(0, 400))}`);
  else L.push("- Crawl coverage: no crawler log evidence was supplied for this run.");
  const consoleLines = summariseConsole(score.context.console);
  if (consoleLines.length) for (const l of consoleLines) L.push(`- Index state (consoles): ${l}`);
  else L.push("- Index state: no Search Console, Bing or Yandex evidence was supplied for this run.");
  const geo13 = byId.get("GEO-13");
  L.push(`- List-intent prompts: answered from third-party listicles and directories; GEO-13 is ${geo13 ? statusCell(geo13) : "not listed"}.`);
  L.push("- Content quality is never assumed to be the cause without this evidence.", "");

  L.push("## 4. Questions for the owner", "");
  const qs = [
    ...owner.map((i) => `${i.id}: ${i.title}${i.hints[0] ? ` (${i.hints[0]})` : ""}. Which verified facts should the site use?`),
    ...(opts.questions ?? []),
  ];
  L.push(...(qs.length ? qs.map((q) => `- ${q}`) : ["- None from this run."]), "");

  L.push("## 5. Human steps", "");
  for (const i of score.items.filter((x) => x.humanOnly)) {
    L.push(`- ${i.id} (${statusCell(i)}): ${i.title}. ${i.state === "unverified" ? "Confirm it and record the confirmation so it counts." : "Confirmed."}`);
  }
  for (const s of CONSOLE_SETUP) L.push(`- ${s}`);
  L.push("");

  if (opts.boost) {
    L.push("## 6. Backlog", "", "| Impact | ID | Status | Effort | Fix | Who fixes it |", "|---|---|---|---|---|---|");
    for (const b of score.backlog) {
      L.push(`| ${b.impact.toFixed(1)} | ${b.id} | ${b.status} | ${opts.effort?.[b.id] ?? "unsized"} | ${cell(b.hint ?? "")} | ${b.fix.join(" + ")} |`);
    }
    if (score.backlog.length === 0) L.push("| 0 | none | PASS | none | nothing to fix | none |");
    L.push("", "Impact = weight x (1 - status), with PASS 1, WARN 0.5 and FAIL 0. JEV orders ties.", "");
  }
  return L.join("\n");
}

export async function saveReport(score: ScoreResult, dir: string, opts: ReportOptions, redactor = new Redactor()): Promise<{ markdown: string; json: string }> {
  await mkdir(dir, { recursive: true });
  const markdown = join(dir, `audit-${opts.date}.md`);
  const json = join(dir, `audit-${opts.date}.json`);
  await writeFile(markdown, redactor.exact(redactor.value(renderReport(score, opts))) + "\n");
  await writeFile(json, redactor.json({ ...score, report: { date: opts.date, markdown } }) + "\n");
  return { markdown, json };
}

async function readJsonFile(cwd: string, file: string): Promise<any> {
  const path = isAbsolute(file) ? file : join(cwd, file);
  if (!existsSync(path)) throw new Error(`not found: ${file}`);
  return JSON.parse(await readFile(path, "utf8"));
}

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = new Redactor(deps.env);
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      options: {
        "out-dir": { type: "string" },
        date: { type: "string" },
        boost: { type: "boolean" },
        questions: { type: "string" },
        effort: { type: "string" },
      },
      allowPositionals: true,
    });
    if (!positionals[0]) throw new Error("usage: report.ts <score.json> [--boost] [--out-dir .jal/seo-geo-aeo]");
    const score = (await readJsonFile(deps.cwd, positionals[0])) as ScoreResult;
    if (score?.tool !== "score" || !score.scores) throw new Error(`${positionals[0]} is not score.ts output`);
    const date = values.date ?? today(deps.now());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("--date must be YYYY-MM-DD");
    const questions = values.questions ? ((await readJsonFile(deps.cwd, values.questions)) as string[]) : undefined;
    const effort = values.effort ? ((await readJsonFile(deps.cwd, values.effort)) as Record<string, string>) : undefined;
    const outDir = values["out-dir"] ? (isAbsolute(values["out-dir"]) ? values["out-dir"] : join(deps.cwd, values["out-dir"])) : join(deps.cwd, REPORT_DIR);
    const saved = await saveReport(score, outDir, { date, boost: values.boost, questions, effort }, redactor);
    deps.out(redactor.json({ tool: "report", ...saved }));
    return 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
