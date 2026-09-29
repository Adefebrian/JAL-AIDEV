// Finding shape shared by audit, render, density and score, and the
// machine-readable checklist (scripts/checklist.json).

import checklistJson from "../checklist.json" with { type: "json" };

export type Status = "PASS" | "WARN" | "FAIL" | "N/A";
export const STATUSES: Status[] = ["PASS", "WARN", "FAIL", "N/A"];

export type Finding = {
  id: string;
  status: Status;
  evidence: string;
  /** Fix method from the checklist: code, owner, human (joined with " + "). */
  fix: string;
  /** What to change, in one sentence. */
  hint?: string;
  source: string;
  url?: string;
};

export type Pillar = "F" | "SEO" | "AEO" | "GEO";
export type CheckMethod = "auto" | "evidence" | "human" | "console" | "crawler";

export type ChecklistItem = {
  id: string;
  pillar: Pillar;
  weight: number;
  check: CheckMethod;
  checkText: string;
  fix: string[];
  humanOnly: boolean;
  sources: string[];
  title: string;
};

export type Checklist = {
  version: string;
  statusValues: Record<"PASS" | "WARN" | "FAIL", number>;
  bands: Array<{ min: number; max: number; band: string }>;
  items: ChecklistItem[];
};

export const CHECKLIST = checklistJson as unknown as Checklist;
const BY_ID = new Map(CHECKLIST.items.map((i) => [i.id, i]));

export function checklistItem(id: string): ChecklistItem | undefined {
  return BY_ID.get(id);
}

export function fixMethod(id: string): string {
  return BY_ID.get(id)?.fix.join(" + ") ?? "code";
}

export function finding(id: string, status: Status, evidence: string, hint: string | undefined, source: string, url?: string): Finding {
  const f: Finding = { id, status, evidence, fix: fixMethod(id), source };
  if (hint && status !== "PASS" && status !== "N/A") f.hint = hint;
  if (url) f.url = url;
  return f;
}

const RANK: Record<Status, number> = { FAIL: 0, WARN: 1, PASS: 2, "N/A": 3 };

/** Worst of several statuses: FAIL beats WARN beats PASS; N/A only when all are N/A. */
export function worst(statuses: Status[]): Status {
  if (statuses.length === 0) return "N/A";
  return statuses.reduce((a, b) => (RANK[b] < RANK[a] ? b : a));
}

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}
