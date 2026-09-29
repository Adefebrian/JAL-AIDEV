#!/usr/bin/env bun
// score.ts --audit a.json [--render r.json] [--density d.json] [--crawler c.json]
//          [--console g.json] [--human h.json] [--findings x.json ...]
//          [--previous prev.json|auto] [--site url] [--out file]
// Computes the SEO, AEO and GEO scores of instruction section 4.5 from the
// findings and the weights in checklist.json. Read-only (writes only --out).

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { parseArgs } from "node:util";
import { emitError, resolveDeps, today, type Deps } from "./lib/cli.ts";
import { CHECKLIST, isStatus, worst, type Checklist, type ChecklistItem, type Finding, type Status } from "./lib/findings.ts";
import { Redactor } from "./lib/redact.ts";

export const PILLARS = ["SEO", "AEO", "GEO"] as const;
export type PillarName = (typeof PILLARS)[number];
export const REPORT_DIR = ".jal/seo-geo-aeo";

export type Confirmation = { id: string; status: Status; confirmedBy?: string; date?: string; note?: string };

export type ItemState = "scored" | "na" | "unverified" | "not-measured";

export type ItemResult = {
  id: string;
  pillar: ChecklistItem["pillar"];
  title: string;
  weight: number;
  check: ChecklistItem["check"];
  fix: string[];
  humanOnly: boolean;
  state: ItemState;
  status: Status | null;
  value: number | null;
  evidence: string[];
  hints: string[];
  sources: string[];
};

export type PillarScore = {
  score: number | null;
  band: string | null;
  earned: number;
  possible: number;
  counted: number;
  previous: number | null;
  delta: number | null;
};

export type BacklogEntry = { id: string; pillar: string; status: Status; weight: number; impact: number; fix: string[]; hint?: string };

export type ScoreResult = {
  tool: "score";
  generatedAt: string;
  site?: string;
  scores: Record<PillarName, PillarScore>;
  items: ItemResult[];
  unverified: string[];
  notMeasured: string[];
  backlog: BacklogEntry[];
  itemDeltas: Array<{ id: string; from: Status | null; to: Status | null }>;
  ignored: string[];
  context: { crawler?: unknown; console?: unknown };
  previous?: { generatedAt?: string; path?: string };
};

export type ScoreInput = {
  findings: Finding[];
  confirmations?: Confirmation[];
  previous?: Partial<ScoreResult> | null;
  previousPath?: string;
  checklist?: Checklist;
  now?: Date;
  site?: string;
  context?: ScoreResult["context"];
};

export function statusValue(status: Status, checklist: Checklist = CHECKLIST): number | null {
  if (status === "N/A") return null;
  return checklist.statusValues[status];
}

export function band(score: number | null, checklist: Checklist = CHECKLIST): string | null {
  if (score === null) return null;
  const b = checklist.bands.find((x) => score >= x.min && score <= x.max);
  return b?.band ?? null;
}

function validConfirmation(c: Confirmation): boolean {
  return !!c && typeof c.id === "string" && isStatus(c.status) && !!(c.confirmedBy || c.date);
}

export function scoreFindings(input: ScoreInput): ScoreResult {
  const checklist = input.checklist ?? CHECKLIST;
  const known = new Set(checklist.items.map((i) => i.id));
  const ignored = [...new Set(input.findings.filter((f) => !known.has(f.id)).map((f) => f.id))];
  const confirmations = (input.confirmations ?? []).filter(validConfirmation);

  const items: ItemResult[] = checklist.items.map((item) => {
    const machine = input.findings.filter((f) => f.id === item.id && isStatus(f.status));
    const human = confirmations.filter((c) => c.id === item.id);
    const humanFindings = human.map((c) => ({ status: c.status, evidence: `confirmed by ${c.confirmedBy ?? "owner"}${c.date ? " on " + c.date : ""}${c.note ? ": " + c.note : ""}`, source: "human", hint: undefined as string | undefined }));
    // Human-only items count only when the owner confirms them; never guessed.
    const used = item.humanOnly ? humanFindings : [...machine.map((f) => ({ status: f.status, evidence: f.evidence, source: f.source, hint: f.hint })), ...humanFindings];
    const evidence = [...used.map((u) => u.evidence), ...(item.humanOnly ? machine.map((f) => `(not counted, needs owner confirmation) ${f.evidence}`) : [])];
    const base = { id: item.id, pillar: item.pillar, title: item.title, weight: item.weight, check: item.check, fix: item.fix, humanOnly: item.humanOnly };
    if (used.length === 0) {
      return { ...base, state: item.humanOnly ? "unverified" : "not-measured", status: null, value: null, evidence, hints: [], sources: [] };
    }
    const status = worst(used.map((u) => u.status));
    const value = statusValue(status, checklist);
    return {
      ...base,
      state: status === "N/A" ? "na" : "scored",
      status,
      value,
      evidence,
      hints: [...new Set(used.map((u) => u.hint).filter((h): h is string => !!h))],
      sources: [...new Set(used.map((u) => u.source))],
    };
  });

  const scores = {} as Record<PillarName, PillarScore>;
  for (const p of PILLARS) {
    const counted = items.filter((i) => (i.pillar === p || i.pillar === "F") && i.state === "scored");
    const possible = counted.reduce((n, i) => n + i.weight, 0);
    const earned = counted.reduce((n, i) => n + i.weight * (i.value ?? 0), 0);
    const score = possible > 0 ? Math.round((100 * earned) / possible) : null;
    const previous = typeof input.previous?.scores?.[p]?.score === "number" ? (input.previous!.scores![p].score as number) : null;
    scores[p] = { score, band: band(score, checklist), earned, possible, counted: counted.length, previous, delta: score !== null && previous !== null ? score - previous : null };
  }

  const backlog: BacklogEntry[] = items
    .filter((i) => i.state === "scored" && (i.status === "FAIL" || i.status === "WARN"))
    .map((i) => ({ id: i.id, pillar: i.pillar, status: i.status!, weight: i.weight, impact: i.weight * (1 - (i.value ?? 0)), fix: i.fix, hint: i.hints[0] }))
    .sort((a, b) => b.impact - a.impact || a.id.localeCompare(b.id));

  const prevItems = new Map((input.previous?.items ?? []).map((i) => [i.id, i.status ?? null]));
  const itemDeltas = input.previous
    ? items.filter((i) => prevItems.has(i.id) && prevItems.get(i.id) !== i.status).map((i) => ({ id: i.id, from: prevItems.get(i.id) ?? null, to: i.status }))
    : [];

  return {
    tool: "score",
    generatedAt: (input.now ?? new Date()).toISOString(),
    site: input.site,
    scores,
    items,
    unverified: items.filter((i) => i.state === "unverified").map((i) => i.id),
    notMeasured: items.filter((i) => i.state === "not-measured").map((i) => i.id),
    backlog,
    itemDeltas,
    ignored,
    context: input.context ?? {},
    ...(input.previous ? { previous: { generatedAt: input.previous.generatedAt, path: input.previousPath } } : {}),
  };
}

/** Findings from any tool output: { findings: [...] } or a bare array. */
export function extractFindings(data: unknown): Finding[] {
  const list = Array.isArray(data) ? data : Array.isArray((data as any)?.findings) ? (data as any).findings : [];
  return list.filter((f: any) => f && typeof f.id === "string" && isStatus(f.status)).map((f: any) => ({ fix: "", evidence: "", source: "input", ...f }));
}

export function extractConfirmations(data: unknown): Confirmation[] {
  const list = Array.isArray(data) ? data : Array.isArray((data as any)?.confirmations) ? (data as any).confirmations : [];
  return list.filter(validConfirmation);
}

/** The newest audit-YYYY-MM-DD.json in dir dated before `before` (YYYY-MM-DD). */
export async function findPreviousReport(dir: string, before: string): Promise<string | null> {
  if (!existsSync(dir)) return null;
  const names = (await readdir(dir)).filter((n) => /^audit-\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(6, 16) < before).sort();
  return names.length ? join(dir, names[names.length - 1]) : null;
}

async function readJson(cwd: string, file: string): Promise<unknown> {
  const path = isAbsolute(file) ? file : join(cwd, file);
  if (!existsSync(path)) throw new Error(`not found: ${file}`);
  return JSON.parse(await readFile(path, "utf8"));
}

export async function main(argv: string[], d: Deps = {}): Promise<number> {
  const deps = resolveDeps(d);
  const redactor = new Redactor(deps.env);
  try {
    const { values } = parseArgs({
      args: argv,
      options: {
        audit: { type: "string", multiple: true },
        render: { type: "string", multiple: true },
        density: { type: "string", multiple: true },
        crawler: { type: "string" },
        console: { type: "string", multiple: true },
        human: { type: "string" },
        findings: { type: "string", multiple: true },
        previous: { type: "string" },
        site: { type: "string" },
        out: { type: "string" },
      },
      allowPositionals: false,
    });
    const findings: Finding[] = [];
    let site = values.site;
    for (const key of ["audit", "render", "density", "findings"] as const) {
      for (const file of values[key] ?? []) {
        const data = await readJson(deps.cwd, file);
        findings.push(...extractFindings(data));
        if (!site && key === "audit" && typeof (data as any)?.origin === "string") site = (data as any).origin;
      }
    }
    const context: ScoreResult["context"] = {};
    if (values.crawler) {
      const data = await readJson(deps.cwd, values.crawler);
      findings.push(...extractFindings(data));
      context.crawler = (data as any)?.coverage ?? (data as any)?.summary ?? null;
    }
    const consoles: unknown[] = [];
    for (const file of values.console ?? []) {
      const data = await readJson(deps.cwd, file);
      findings.push(...extractFindings(data));
      consoles.push(data);
    }
    if (consoles.length) context.console = consoles;
    const confirmations = values.human ? extractConfirmations(await readJson(deps.cwd, values.human)) : [];
    let previous: Partial<ScoreResult> | null = null;
    let previousPath: string | undefined;
    if (values.previous) {
      previousPath = values.previous === "auto" ? (await findPreviousReport(join(deps.cwd, REPORT_DIR), today(deps.now()))) ?? undefined : values.previous;
      if (previousPath) previous = (await readJson(deps.cwd, previousPath)) as Partial<ScoreResult>;
    }
    const result = scoreFindings({ findings, confirmations, previous, previousPath, now: deps.now(), site, context });
    const json = redactor.json(result);
    if (values.out) await writeFile(isAbsolute(values.out) ? values.out : join(deps.cwd, values.out), json + "\n");
    deps.out(json);
    return 0;
  } catch (err) {
    emitError(deps, redactor, err);
    return 1;
  }
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
