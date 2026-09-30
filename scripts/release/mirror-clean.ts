#!/usr/bin/env bun
// Builds the key-free mirror of this repo for github.com/Adefebrian/JAL-AIDEV.
//
// JAL-Group/JAL-AIDEV (the team repo) keeps its MCP keys hardcoded in
// .mcp.json on purpose. The personal mirror must never hold a key, in any
// file of any commit. This script clones the repo, collects every literal key
// that .mcp.json has ever held, rewrites the whole history of main and the
// tags so each key becomes its ${ENV_NAME} placeholder, and verifies that no
// key survives anywhere: files of every commit, commit messages, and
// annotated tag messages.
//
// The rewrite keeps authors, committers, dates, and messages, so it is
// deterministic: the same source commits always produce the same mirror
// SHAs, and every later release is a plain fast-forward push to the mirror.
//
// Usage:
//   bun scripts/release/mirror-clean.ts [--out <dir>] [--source <repo>]
// Then push from the printed directory:
//   git -C <dir> push <mirror-url> main --tags
//
// It never prints a key. Keys pass only through two files created mode 600
// in a private temporary directory; those are deleted on every exit. If the
// run fails or is interrupted (SIGINT, SIGTERM), the clone, which may still
// hold keys, is deleted too (only when this run created it).

import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, isAbsolute } from "node:path";

const DEFAULT_SOURCE = resolve(import.meta.dir, "..", "..");
const HEADER_ENV: Record<string, string> = {
  "koboyo-icons": "KOBOYO_API_KEY",
  originkit: "ORIGINKIT_API_KEY",
};
/** Only env vars with a secret-like name are treated as keys; Authorization headers always are. */
export const SECRET_ENV_NAME = /KEY|TOKEN|SECRET|PASSWORD/i;

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

// Every literal key .mcp.json has held in any commit, mapped to its placeholder.
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
        if (!SECRET_ENV_NAME.test(k)) continue;
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

/**
 * The filter-branch tree filter. NUL-separated paths (grep --null, xargs -0)
 * so a file name with spaces, quotes, or newlines is still rewritten.
 */
/**
 * The personal mirror carries one identity only: every author and committer
 * becomes Adefebrian, and message trailers that name anyone else (a
 * co-author, a tool) are dropped. Dates stay as they were, so the rewrite
 * stays deterministic.
 */
export const MIRROR_NAME = "Adefebrian";
export const MIRROR_EMAIL = "brian@jalgroup.id";
export const ENV_FILTER =
  'export GIT_AUTHOR_NAME="$JAL_NAME" GIT_AUTHOR_EMAIL="$JAL_EMAIL" GIT_COMMITTER_NAME="$JAL_NAME" GIT_COMMITTER_EMAIL="$JAL_EMAIL"';
/** Drops Co-Authored-By, Signed-off-by, and "Generated with ... Claude" lines, then trailing blank lines. */
export const MSG_FILTER = `perl -0pe 's/^(?:co-authored-by|signed-off-by):.*\\n?//gim; s/^.*generated with .*claude.*\\n?//gim; s/\\s+\\z/\\n/'`;

/** Identities or trailers in the mirror that still name anyone other than Adefebrian. */
export function foreignIdentities(identities: string, messages: string): string[] {
  const self = `${MIRROR_NAME} <${MIRROR_EMAIL}>`;
  const out = new Set<string>();
  for (const line of identities.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (line !== self) out.add(line);
  }
  for (const m of messages.match(/^(?:co-authored-by|signed-off-by):.*$/gim) ?? []) out.add(m.trim());
  for (const m of messages.match(/^.*generated with .*claude.*$/gim) ?? []) out.add(m.trim());
  return [...out];
}

export const TREE_FILTER = `grep -rlF --null -f "$JAL_LIST" . --exclude-dir=.git | xargs -0 -r perl "$JAL_PERL"`;

/** git grep exits 0 on a match, 1 on none, and above 1 on an error, which must fail the run. */
export function grepHit(exitCode: number, rev: string): boolean {
  if (exitCode > 1) throw new Error(`verification failed: git grep errored (exit ${exitCode}) on ${rev.slice(0, 12)}; do not push`);
  return exitCode === 0;
}

/** Counts keys found in text (commit messages, annotated tag messages). Never returns the key. */
export function countKeysIn(text: string, keys: Iterable<string>): number {
  let n = 0;
  for (const k of keys) if (text.includes(k)) n++;
  return n;
}

/** Writes a file that holds keys: created mode 600, never an existing file. */
export function writeSecretFile(path: string, content: string): void {
  writeFileSync(path, content, { mode: 0o600, flag: "wx" });
}

function inside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

export interface Cleanup {
  /** Key files gone; the clone stays (it is the result). */
  success(): void;
  /** Key files and, when this run created it, the clone gone. */
  failure(): void;
}

// On success only the key files go (plus the temp dir, unless the clone
// lives in it). On failure or a signal the clone goes too, since a clone
// whose rewrite did not finish still holds keys; an --out directory that
// that was not empty before the run is refused up front, never deleted.
export function makeCleanup(o: { work: string; out: string; createdOut: boolean; keyFiles: string[] }): Cleanup {
  let done = false;
  const rmKeys = () => {
    for (const f of o.keyFiles) rmSync(f, { force: true });
  };
  return {
    success() {
      if (done) return;
      done = true;
      rmKeys();
      if (!inside(o.work, o.out)) rmSync(o.work, { recursive: true, force: true });
    },
    failure() {
      if (done) return;
      done = true;
      rmKeys();
      if (o.createdOut) rmSync(o.out, { recursive: true, force: true });
      rmSync(o.work, { recursive: true, force: true });
    },
  };
}

export interface MirrorResult {
  out: string;
  main: string;
  keys: number;
  commits: number;
  tags: number;
}

export function buildMirror(opts: { source?: string; out?: string } = {}): MirrorResult {
  const source = opts.source ? resolve(opts.source) : DEFAULT_SOURCE;
  // A non-empty --out is refused before anything runs, so the failure path
  // below never deletes a directory this run did not fill.
  if (opts.out && existsSync(resolve(opts.out)) && readdirSync(resolve(opts.out)).length > 0) {
    throw new Error(`--out ${resolve(opts.out)} exists and is not empty; pass a new directory`);
  }
  const work = mkdtempSync(join(tmpdir(), "jal-mirror-"));
  const out = opts.out ? resolve(opts.out) : join(work, "mirror");
  const createdOut = true;
  const mapFile = join(work, "map.tsv");
  const listFile = join(work, "list.txt");
  const perlFile = join(work, "replace.pl");
  const cleanup = makeCleanup({ work, out, createdOut, keyFiles: [mapFile, listFile] });

  const onExit = () => cleanup.failure();
  const onSignal = (sig: "SIGINT" | "SIGTERM") => () => {
    cleanup.failure();
    process.exit(sig === "SIGINT" ? 130 : 143);
  };
  const onInt = onSignal("SIGINT");
  const onTerm = onSignal("SIGTERM");
  // An exit that skips the finally below (process.exit elsewhere) is a failure.
  process.on("exit", onExit);
  process.on("SIGINT", onInt);
  process.on("SIGTERM", onTerm);
  const disarm = () => {
    process.removeListener("exit", onExit);
    process.removeListener("SIGINT", onInt);
    process.removeListener("SIGTERM", onTerm);
  };

  let ok = false;
  try {
    git(work, ["clone", "--quiet", "--no-local", "--no-hardlinks", source, out]);
    // Only main (the branch the team repo ships) and the tags go to the mirror.
    git(out, ["checkout", "--quiet", "-B", "main", "origin/main"]);
    const tags = git(out, ["tag"]).split("\n").filter(Boolean);

    const revs = git(out, ["rev-list", "main", ...tags.map((t) => `refs/tags/${t}`), "--", ".mcp.json"]).split("\n").filter(Boolean);
    const versions = revs.map((r) => git(out, ["show", `${r}:.mcp.json`], { allowFail: true })).filter(Boolean);
    const secrets = collectSecrets(versions);
    if (secrets.size === 0) throw new Error("no literal keys found in any .mcp.json; refusing to guess");

    writeSecretFile(mapFile, [...secrets].map(([k, v]) => `${k}\t${v}`).join("\n") + "\n");
    writeSecretFile(listFile, [...secrets.keys()].join("\n") + "\n");
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
        "filter-branch", "--force",
        "--env-filter", ENV_FILTER,
        "--msg-filter", MSG_FILTER,
        "--tree-filter", TREE_FILTER,
        "--tag-name-filter", "cat",
        "--", "main", ...tags.map((t) => `refs/tags/${t}`),
      ],
      {
        env: {
          FILTER_BRANCH_SQUELCH_WARNING: "1",
          JAL_MAP: mapFile, JAL_LIST: listFile, JAL_PERL: perlFile,
          JAL_NAME: MIRROR_NAME, JAL_EMAIL: MIRROR_EMAIL,
        },
      },
    );

    // filter-branch keeps each annotated tag's tagger; re-create every tag as
    // Adefebrian with its original message and date, so the result is the
    // same on every run.
    for (const tag of tags) {
      const type = git(out, ["cat-file", "-t", `refs/tags/${tag}`]).trim();
      if (type !== "tag") continue;
      const target = git(out, ["rev-parse", `refs/tags/${tag}^{}`]).trim();
      const date = git(out, ["for-each-ref", `refs/tags/${tag}`, "--format=%(taggerdate:raw)"]).trim();
      const message = git(out, ["for-each-ref", `refs/tags/${tag}`, "--format=%(contents)"]);
      const msgFile = join(work, `tag-${tag.replace(/[^A-Za-z0-9._-]/g, "_")}.txt`);
      writeFileSync(msgFile, message);
      git(out, ["tag", "-f", "-a", tag, target, "-F", msgFile], {
        env: { GIT_COMMITTER_NAME: MIRROR_NAME, GIT_COMMITTER_EMAIL: MIRROR_EMAIL, GIT_COMMITTER_DATE: date },
      });
    }

    // Drop everything that could still hold an old object.
    git(out, ["remote", "remove", "origin"], { allowFail: true });
    for (const ref of git(out, ["for-each-ref", "--format=%(refname)", "refs/original/", "refs/heads/"]).split("\n").filter(Boolean)) {
      if (ref !== "refs/heads/main") git(out, ["update-ref", "-d", ref]);
    }
    git(out, ["reflog", "expire", "--expire=now", "--all"]);
    git(out, ["gc", "--quiet", "--prune=now", "--aggressive"]);

    // Verify: no key in any file of any commit, in any commit message, or in
    // any annotated tag message.
    const all = git(out, ["rev-list", "--all"]).split("\n").filter(Boolean);
    let hits = 0;
    for (const rev of all) {
      const r = Bun.spawnSync(["git", "grep", "-q", "-F", "-f", listFile, rev], { cwd: out, stdout: "ignore", stderr: "pipe" });
      if (grepHit(r.exitCode ?? 2, rev)) hits++;
    }
    hits += countKeysIn(git(out, ["log", "--all", "--format=%B"]), secrets.keys());
    hits += countKeysIn(git(out, ["for-each-ref", "refs/tags", "--format=%(contents)"]), secrets.keys());
    if (hits > 0) throw new Error(`verification failed: ${hits} commits or messages still hold a key; do not push`);
    const foreign = foreignIdentities(
      git(out, ["log", "--all", "--format=%an <%ae>%n%cn <%ce>"]) +
        "\n" +
        git(out, ["for-each-ref", "refs/tags", "--format=%(taggername) %(taggeremail)"]),
      git(out, ["log", "--all", "--format=%B"]) + "\n" + git(out, ["for-each-ref", "refs/tags", "--format=%(contents)"]),
    );
    if (foreign.length > 0) throw new Error(`verification failed: ${foreign.length} other identities or trailers remain; do not push`);

    const result = { out, main: git(out, ["rev-parse", "main"]).trim(), keys: secrets.size, commits: all.length, tags: tags.length };
    ok = true;
    return result;
  } finally {
    disarm();
    if (ok) cleanup.success();
    else cleanup.failure();
  }
}

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

if (import.meta.main) {
  try {
    const r = buildMirror({ out: argValue("--out"), source: argValue("--source") });
    console.log(`mirror ready: ${r.out}`);
    console.log(`keys replaced: ${r.keys} (as \${ENV} placeholders), commits checked: ${r.commits}, tags: ${r.tags}`);
    console.log(`main: ${r.main}`);
  } catch (e: any) {
    console.error(`mirror-clean: ${e?.message ?? e}`);
    process.exit(1);
  }
}
