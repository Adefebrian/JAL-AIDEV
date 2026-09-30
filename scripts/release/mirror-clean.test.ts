import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildMirror, collectSecrets, countKeysIn, grepHit, makeCleanup, TREE_FILTER, writeSecretFile } from "./mirror-clean";

describe("collectSecrets", () => {
  test("maps env values and bearer tokens to placeholders, across versions", () => {
    const v1 = JSON.stringify({ mcpServers: { "jal-design": { env: { JEV_API_KEY: "old-key-aaaaaaaaaaaa" } } } });
    const v2 = JSON.stringify({
      mcpServers: {
        "jal-design": { env: { JEV_API_KEY: "new-key-bbbbbbbbbbbb" } },
        originkit: { headers: { Authorization: "Bearer tok-cccccccccccc" } },
        "koboyo-icons": { headers: { Authorization: "Bearer tok-dddddddddddd" } },
        other: { headers: { Authorization: "Bearer ${ALREADY_SET}" } },
      },
    });
    const m = collectSecrets([v1, v2, "not json"]);
    expect(m.get("old-key-aaaaaaaaaaaa")).toBe("${JEV_API_KEY}");
    expect(m.get("new-key-bbbbbbbbbbbb")).toBe("${JEV_API_KEY}");
    expect(m.get("tok-cccccccccccc")).toBe("${ORIGINKIT_API_KEY}");
    expect(m.get("tok-dddddddddddd")).toBe("${KOBOYO_API_KEY}");
    expect(m.size).toBe(4);
  });

  test("ignores placeholders and short values", () => {
    const v = JSON.stringify({ mcpServers: { a: { env: { X_KEY: "${X_KEY}", Y_TOKEN: "short" } } } });
    expect(collectSecrets([v]).size).toBe(0);
  });

  test("only env names that look secret are keys; an Authorization header always is", () => {
    const v = JSON.stringify({
      mcpServers: {
        a: {
          env: {
            JEV_BASE_URL: "https://jev.example.test/api",
            LOG_LEVEL_DEFAULT: "informational-verbose",
            GH_TOKEN: "ghp-test-eeeeeeeeeeee",
            DB_PASSWORD: "pw-test-ffffffffffff",
            CLIENT_SECRET: "cs-test-gggggggggggg",
          },
          headers: { Authorization: "Bearer hdr-test-hhhhhhhhhhhh" },
        },
      },
    });
    const m = collectSecrets([v]);
    expect([...m.values()].sort()).toEqual(["${A_API_KEY}", "${CLIENT_SECRET}", "${DB_PASSWORD}", "${GH_TOKEN}"]);
    expect(m.has("https://jev.example.test/api")).toBe(false);
    expect(m.has("informational-verbose")).toBe(false);
  });
});

describe("helpers", () => {
  test("the tree filter passes NUL-separated paths from grep to xargs", () => {
    expect(TREE_FILTER).toContain("grep -rlF --null");
    expect(TREE_FILTER).toContain("xargs -0");
  });

  test("git grep exit codes: 0 is a hit, 1 is none, above 1 fails the run", () => {
    expect(grepHit(0, "abc")).toBe(true);
    expect(grepHit(1, "abc")).toBe(false);
    expect(() => grepHit(2, "abcdef0123456789")).toThrow("git grep errored (exit 2)");
    expect(() => grepHit(128, "abc")).toThrow("verification failed");
  });

  test("countKeysIn counts without echoing a key", () => {
    expect(countKeysIn("tag v1\n\nships key-test-zzzzzzzzzzzz by mistake", ["key-test-zzzzzzzzzzzz", "other-key-yyyyyyyyyy"])).toBe(1);
    expect(countKeysIn("clean", ["key-test-zzzzzzzzzzzz"])).toBe(0);
  });
});

let tmp: string;
beforeEach(() => {
  tmp = realpathSync(mkdtempSync(join(tmpdir(), "mirror-test-")));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe("key files and cleanup", () => {
  test("key files are created mode 600 and never overwrite an existing file", () => {
    const f = join(tmp, "list.txt");
    writeSecretFile(f, "k\n");
    expect(statSync(f).mode & 0o777).toBe(0o600);
    expect(() => writeSecretFile(f, "again\n")).toThrow();
  });

  test("failure removes the key files, the clone, and the temp dir; success keeps only the clone", () => {
    const make = (name: string) => {
      const work = join(tmp, `${name}-work`);
      const out = join(tmp, `${name}-out`);
      mkdirSync(work);
      mkdirSync(join(out, ".git"), { recursive: true });
      const keys = [join(work, "map.tsv"), join(work, "list.txt")];
      for (const k of keys) writeFileSync(k, "secret");
      return { work, out, keys };
    };
    const a = make("fail");
    makeCleanup({ work: a.work, out: a.out, createdOut: true, keyFiles: a.keys }).failure();
    expect(existsSync(a.out)).toBe(false);
    expect(existsSync(a.work)).toBe(false);

    const b = make("ok");
    makeCleanup({ work: b.work, out: b.out, createdOut: true, keyFiles: b.keys }).success();
    expect(existsSync(b.out)).toBe(true);
    expect(existsSync(b.work)).toBe(false);

    // The default clone lives inside the temp dir: success keeps it, drops the keys.
    const work = join(tmp, "inner-work");
    const out = join(work, "mirror");
    mkdirSync(out, { recursive: true });
    const keys = [join(work, "map.tsv")];
    writeFileSync(keys[0], "secret");
    makeCleanup({ work, out, createdOut: true, keyFiles: keys }).success();
    expect(existsSync(out)).toBe(true);
    expect(existsSync(keys[0])).toBe(false);
  });
});

// A throwaway source repo with a fake key in .mcp.json and in a file whose
// name has spaces, plus annotated tags.
const KEY = "sk-test-0123456789abcdef";
const BASE_URL = "https://jev.example.test/api";
function sh(cwd: string, args: string[]) {
  const r = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, GIT_AUTHOR_NAME: "T", GIT_AUTHOR_EMAIL: "t@example.test", GIT_COMMITTER_NAME: "T", GIT_COMMITTER_EMAIL: "t@example.test", GIT_AUTHOR_DATE: "2026-09-29T10:00:00Z", GIT_COMMITTER_DATE: "2026-09-29T10:00:00Z" },
  });
  if (r.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.toString();
}
function sourceRepo(tagMessage = "release v1"): string {
  const src = join(tmp, "src");
  mkdirSync(join(src, "docs"), { recursive: true });
  sh(src, ["init", "--quiet", "-b", "main"]);
  sh(src, ["config", "commit.gpgsign", "false"]);
  sh(src, ["config", "tag.gpgsign", "false"]);
  writeFileSync(join(src, ".mcp.json"), JSON.stringify({ mcpServers: { "jal-design": { env: { JEV_API_KEY: KEY, JEV_BASE_URL: BASE_URL } } } }, null, 2));
  writeFileSync(join(src, "docs", "setup notes.md"), `key: ${KEY}\nbase: ${BASE_URL}\n`);
  sh(src, ["add", "-A"]);
  sh(src, ["commit", "--quiet", "-m", "first"]);
  sh(src, ["tag", "-a", "v1", "-m", tagMessage]);
  writeFileSync(join(src, "README.md"), "hello\n");
  sh(src, ["add", "-A"]);
  sh(src, ["commit", "--quiet", "-m", "second"]);
  return src;
}

describe("buildMirror", () => {
  test(
    "rewrites the key everywhere (spaced file names included), keeps non-secret env values, and is deterministic",
    () => {
      const src = sourceRepo();
      const signals = [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM"), process.listenerCount("exit")];
      const a = buildMirror({ source: src, out: join(tmp, "mirror-a") });
      const b = buildMirror({ source: src, out: join(tmp, "mirror-b") });
      expect([process.listenerCount("SIGINT"), process.listenerCount("SIGTERM"), process.listenerCount("exit")]).toEqual(signals);
      expect(a.main).toBe(b.main);
      expect(a.keys).toBe(1);
      const notes = readFileSync(join(a.out, "docs", "setup notes.md"), "utf8");
      expect(notes).toContain("${JEV_API_KEY}");
      expect(notes).toContain(BASE_URL);
      expect(notes).not.toContain(KEY);
      expect(readFileSync(join(a.out, ".mcp.json"), "utf8")).toContain(BASE_URL);
      for (const rev of sh(a.out, ["rev-list", "--all"]).split("\n").filter(Boolean)) {
        const r = Bun.spawnSync(["git", "grep", "-q", "-F", KEY, rev], { cwd: a.out });
        expect(r.exitCode).toBe(1);
      }
      expect(sh(a.out, ["cat-file", "-t", "v1"]).trim()).toBe("tag");
    },
    60000,
  );

  test(
    "a key in an annotated tag message fails verification and the clone is deleted",
    () => {
      const src = sourceRepo(`release v1 with ${KEY}`);
      const out = join(tmp, "mirror-bad");
      expect(() => buildMirror({ source: src, out })).toThrow("verification failed");
      expect(existsSync(out)).toBe(false);
    },
    60000,
  );

  test("a non-empty --out is refused and left untouched", () => {
    const out = join(tmp, "taken");
    mkdirSync(out);
    writeFileSync(join(out, "keep.txt"), "mine");
    expect(() => buildMirror({ source: tmp, out })).toThrow("exists and is not empty");
    expect(readFileSync(join(out, "keep.txt"), "utf8")).toBe("mine");
  });
});

describe("single identity", () => {
  test("foreignIdentities flags other people and co-author trailers only", async () => {
    const { foreignIdentities, MIRROR_NAME, MIRROR_EMAIL } = await import("./mirror-clean");
    const self = `${MIRROR_NAME} <${MIRROR_EMAIL}>`;
    expect(foreignIdentities(`${self}\n${self}`, "feat: x\n\nbody")).toEqual([]);
    expect(foreignIdentities(`${self}\nSomeone <a@b.c>`, "")).toEqual(["Someone <a@b.c>"]);
    expect(foreignIdentities(self, "fix\n\nCo-Authored-By: Claude <noreply@anthropic.com>")).toHaveLength(1);
  });
});
