#!/usr/bin/env bun
// Builds the key-free mirror of this repo for github.com/Adefebrian/JAL-AIDEV.
//
// JAL-Group/JAL-AIDEV (the team repo) keeps its MCP keys hardcoded in
// .mcp.json on purpose. The personal mirror must never hold a key, in any
// file of any commit. This script clones the repo, collects every literal key
// that .mcp.json has ever held, rewrites the whole history of main and the
// tags so each key becomes its ${ENV_NAME} placeholder, and verifies that no
// key survives anywhere.
//
// The rewrite keeps authors, committers, dates, and messages, so it is
// deterministic: the same source commits always produce the same mirror
// SHAs, and every later release is a plain fast-forward push to the mirror.
//
// Usage:
//   bun scripts/release/mirror-clean.ts [--out <dir>]
// Then push from the printed directory:
//   git -C <dir> push <mirror-url> main --tags
//
// It never prints a key. Keys only pass through a mode-600 file inside the
// temporary directory, which is deleted on exit.

import { mkdtempSync, writeFileSync, rmSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SOURCE = resolve(import.meta.dir, "..", "..");
const HEADER_ENV: Record<string, string> = {
  "koboyo-icons": "KOBOYO_API_KEY",
  originkit: "ORIGINKIT_API_KEY",
};

function git(cwd: string, args: string[], opts: { env?: Record<string, string>; allowFail?: boolean } = {}): string {
  const r = Bun.spawnSync(["git", ...args], { cwd, env: { ...process.env, ...opts.env }, stdout: "pipe", stderr: "pipe" });
  if (r.exitCode !== 0 && !opts.allowFail) {
    throw new Error(`git ${args[0]} failed: ${r.stderr.toString().split("\n").slice(-3).join(" ").trim()}`);
  }
  return r.stdout.toString();
}

function envNameFor(server: string): string {
  return HEADER_ENV[server] ?? server.toUpperCase().replace(/[^A-Z0-9]+/g, "_") + "_API_KEY";
}

// Every literal value .mcp.json has held in any commit, mapped to its placeholder.
export function collectSecrets(mcpJsonVersions: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const text of mcpJsonVersions) {
    let servers: Record<string, any>;
    try {
      servers = JSON.parse(text).mcpServers ?? {};
    } catch {
      continue;
    }
    for (const [name, cfg] of Object.entries(servers)) {
      for (const [k, v] of Object.entries(cfg.env ?? {})) {
        if (typeof v === "string" && v.length >= 12 && !v.includes("${")) map.set(v, `\${${k}}`);
      }
      const auth = cfg.headers?.Authorization;
      if (typeof auth === "string" && !auth.includes("${")) {
        const token = auth.replace(/^Bearer\s+/i, "");
        if (token.length >= 12) map.set(token, `\${${envNameFor(name)}}`);
      }
    }
  }
  return map;
}

function main() {
  const outArg = process.argv.indexOf("--out");
  const work = mkdtempSync(join(tmpdir(), "jal-mirror-"));
  const out = outArg > -1 ? resolve(process.argv[outArg + 1]) : join(work, "mirror");
  const mapFile = join(work, "map.tsv");
  const listFile = join(work, "list.txt");
  const perlFile = join(work, "replace.pl");
  const cleanup = () => {
    for (const f of [mapFile, listFile]) if (existsSync(f)) rmSync(f);
  };
  process.on("exit", cleanup);

  try {
    git(work, ["clone", "--quiet", "--no-local", "--no-hardlinks", SOURCE, out]);
    // Only main (the branch the team repo ships) and the tags go to the mirror.
    git(out, ["checkout", "--quiet", "-B", "main", "origin/main"]);
    const tags = git(out, ["tag"]).split("\n").filter(Boolean);

    const revs = git(out, ["rev-list", "main", ...tags.map((t) => `refs/tags/${t}`), "--", ".mcp.json"]).split("\n").filter(Boolean);
    const versions = revs.map((r) => git(out, ["show", `${r}:.mcp.json`], { allowFail: true })).filter(Boolean);
    const secrets = collectSecrets(versions);
    if (secrets.size === 0) throw new Error("no literal keys found in any .mcp.json; refusing to guess");

    writeFileSync(mapFile, [...secrets].map(([k, v]) => `${k}\t${v}`).join("\n") + "\n");
    writeFileSync(listFile, [...secrets.keys()].join("\n") + "\n");
    chmodSync(mapFile, 0o600);
    chmodSync(listFile, 0o600);
    writeFileSync(
      perlFile,
      `my %m; open(my $f, '<', $ENV{JAL_MAP}) or die; while (<$f>) { chomp; my ($k,$v) = split /\\t/, $_, 2; $m{$k} = $v; } close $f;
my $re = join('|', map { quotemeta } sort { length($b) <=> length($a) } keys %m);
for my $p (@ARGV) { local $/; open(my $h, '<', $p) or next; my $t = <$h>; close $h; my $n = $t; $n =~ s/($re)/$m{$1}/g; if ($n ne $t) { open(my $w, '>', $p) or die; print $w $n; close $w; } }
`,
    );

    // Rewrite main and every tag. grep -rlF finds only files that hold a key.
    git(
      out,
      [
        "filter-branch",
        "--force",
        "--tree-filter",
        `grep -rlF -f "$JAL_LIST" . --exclude-dir=.git | xargs -r perl "$JAL_PERL"`,
        "--tag-name-filter",
        "cat",
        "--",
        "main",
        ...tags.map((t) => `refs/tags/${t}`),
      ],
      { env: { FILTER_BRANCH_SQUELCH_WARNING: "1", JAL_MAP: mapFile, JAL_LIST: listFile, JAL_PERL: perlFile } },
    );

    // Drop everything that could still hold an old object.
    git(out, ["remote", "remove", "origin"], { allowFail: true });
    for (const ref of git(out, ["for-each-ref", "--format=%(refname)", "refs/original/", "refs/heads/"]).split("\n").filter(Boolean)) {
      if (ref !== "refs/heads/main") git(out, ["update-ref", "-d", ref]);
    }
    git(out, ["reflog", "expire", "--expire=now", "--all"]);
    git(out, ["gc", "--quiet", "--prune=now", "--aggressive"]);

    // Verify: no key in any file of any commit, and none in any message.
    const all = git(out, ["rev-list", "--all"]).split("\n").filter(Boolean);
    let hits = 0;
    for (const rev of all) {
      const r = Bun.spawnSync(["git", "grep", "-l", "-F", "-f", listFile, rev], { cwd: out, stdout: "pipe" });
      if (r.stdout.toString().trim()) hits++;
    }
    const msg = Bun.spawnSync(["git", "log", "--all", "--format=%B"], { cwd: out, stdout: "pipe" }).stdout.toString();
    for (const k of secrets.keys()) if (msg.includes(k)) hits++;
    if (hits > 0) throw new Error(`verification failed: ${hits} commits still hold a key; do not push`);

    console.log(`mirror ready: ${out}`);
    console.log(`keys replaced: ${secrets.size} (as \${ENV} placeholders), commits checked: ${all.length}, tags: ${tags.length}`);
    console.log(`main: ${git(out, ["rev-parse", "main"]).trim()}`);
  } finally {
    cleanup();
  }
}

if (import.meta.main) main();
