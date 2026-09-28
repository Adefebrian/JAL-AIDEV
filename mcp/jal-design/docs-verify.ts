// Mechanical evidence check for jal-docs. Every documentation claim cites
// evidence in the source repo (a path, optionally a snippet that must appear
// there). This verifies the citations exist before JEV (docs.claim) judges
// whether the evidence actually supports the claim. It also scans the draft
// text for secret-shaped values so no credential ever reaches the docs.
// Zero dependencies.

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { redact } from "./jev";

export type Evidence = { path: string; contains?: string };
export type Claim = { id: string; text: string; evidence: Evidence[] };
export type ClaimResult = {
  id: string;
  status: "VERIFIED" | "MISSING_EVIDENCE" | "NO_EVIDENCE";
  problems: string[];
};
export type DocsVerifyReport = {
  status: "PASS" | "FAIL";
  verified: number;
  failed: number;
  claims: ClaimResult[];
  secrets: { location: string; kinds: number }[];
};

const MAX_FILE_BYTES = 2_000_000;

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function insideRepo(repo: string, p: string): string | null {
  if (isAbsolute(p) || p.split(/[\\/]/).includes("..")) return null;
  const full = resolve(repo, p);
  if (!existsSync(full)) return full; // reported as missing, not as escape
  const real = realpathSync(full);
  const rel = relative(realpathSync(repo), real);
  return rel.startsWith("..") || isAbsolute(rel) ? null : real;
}

export function verifyClaims(repoPath: string, claims: Claim[], draftTexts: Record<string, string> = {}): DocsVerifyReport {
  if (!existsSync(repoPath) || !statSync(repoPath).isDirectory()) {
    throw new Error(`repo path not found: ${repoPath}`);
  }
  const cache = new Map<string, string | null>();
  const read = (full: string): string | null => {
    if (cache.has(full)) return cache.get(full)!;
    let text: string | null = null;
    try {
      const st = statSync(full);
      text = st.isFile() && st.size <= MAX_FILE_BYTES ? readFileSync(full, "utf8") : st.isDirectory() ? "" : null;
    } catch {
      text = null;
    }
    cache.set(full, text);
    return text;
  };

  const results: ClaimResult[] = claims.map((claim) => {
    const problems: string[] = [];
    if (!claim.evidence || claim.evidence.length === 0) {
      return { id: claim.id, status: "NO_EVIDENCE", problems: ["claim cites no evidence"] };
    }
    for (const ev of claim.evidence) {
      const full = insideRepo(repoPath, ev.path);
      if (!full) {
        problems.push(`${ev.path}: path escapes the repo`);
        continue;
      }
      if (!existsSync(full)) {
        problems.push(`${ev.path}: not found`);
        continue;
      }
      if (ev.contains) {
        const text = read(full);
        if (text === null) problems.push(`${ev.path}: unreadable`);
        else if (text === "") problems.push(`${ev.path}: is a directory, cannot contain a snippet`);
        else if (!normalize(text).includes(normalize(ev.contains))) problems.push(`${ev.path}: does not contain "${ev.contains.slice(0, 80)}"`);
      }
    }
    return { id: claim.id, status: problems.length ? "MISSING_EVIDENCE" : "VERIFIED", problems };
  });

  const secrets: { location: string; kinds: number }[] = [];
  const scan = (location: string, text: string) => {
    const counter = { count: 0 };
    redact(text, counter);
    if (counter.count > 0) secrets.push({ location, kinds: counter.count });
  };
  for (const c of claims) scan(`claim ${c.id}`, c.text);
  for (const [name, text] of Object.entries(draftTexts)) scan(name, text);

  const failed = results.filter((r) => r.status !== "VERIFIED").length;
  return {
    status: failed === 0 && secrets.length === 0 ? "PASS" : "FAIL",
    verified: results.length - failed,
    failed,
    claims: results,
    secrets,
  };
}
