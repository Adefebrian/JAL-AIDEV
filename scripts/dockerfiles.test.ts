// The deps stage of every template Dockerfile must copy every workspace
// manifest, so adding packages/video (or scene, motion, facts) never breaks
// `bun install --frozen-lockfile` in the image. This runs each Dockerfile's
// own manifests step with sh on a temp workspace, then the deps stage's
// install, with no network (the workspace has no outside dependencies).
import { describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PLUGIN = join(import.meta.dir, "..");
const DOCKERFILES = ["templates/monorepo/infra/Dockerfile.web", "templates/monorepo/infra/Dockerfile.api", "seo-geo-aeo/templates/infra/Dockerfile.web"];

/** The shell of the manifests stage's RUN step, with /manifests pointed at `out`. */
function manifestsStep(dockerfile: string, out: string): string {
  const text = readFileSync(join(PLUGIN, dockerfile), "utf8");
  const stage = text.slice(text.indexOf("AS manifests"), text.indexOf("\nFROM ", text.indexOf("AS manifests")));
  const run = stage.slice(stage.indexOf("\nRUN ") + 5);
  return run.replace(/\\\n/g, "\n").replaceAll("/manifests", out).trim();
}

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), "docker-deps-"));
  const write = (path: string, json: object) => {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(json, null, 2));
  };
  write("package.json", { name: "app", private: true, workspaces: ["apps/*", "packages/*"] });
  for (const name of ["apps/web", "apps/api", "packages/ui", "packages/config", "packages/video", "packages/scene", "packages/facts"]) {
    write(`${name}/package.json`, { name: `@app/${name.split("/")[1]}`, version: "0.1.0", private: true });
  }
  // Files that must not reach the deps stage.
  write("packages/video/src/fixtures/package.json", { name: "fixture" });
  writeFileSync(join(root, "packages/video/src/index.ts"), "export {};\n");
  const r = Bun.spawnSync(["bun", "install"], { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (r.exitCode !== 0) throw new Error(r.stderr.toString());
  return root;
}

const install = (cwd: string) => Bun.spawnSync(["bun", "install", "--frozen-lockfile"], { cwd, stdout: "pipe", stderr: "pipe" });

describe("Dockerfile deps stage", () => {
  const ctx = workspace();

  for (const dockerfile of DOCKERFILES) {
    test(`${dockerfile}: copies every workspace manifest and the frozen install passes`, () => {
      const text = readFileSync(join(PLUGIN, dockerfile), "utf8");
      const deps = text.slice(text.indexOf("AS deps"), text.indexOf("RUN bun install --frozen-lockfile"));
      expect(deps).toContain("COPY --from=manifests /manifests/ ./");
      expect(deps).not.toMatch(/COPY (apps|packages)\//);

      // Stage manifests: COPY apps and packages, then the RUN step.
      const stage = mkdtempSync(join(tmpdir(), "docker-manifests-"));
      cpSync(join(ctx, "apps"), join(stage, "src", "apps"), { recursive: true });
      cpSync(join(ctx, "packages"), join(stage, "src", "packages"), { recursive: true });
      const out = join(stage, "manifests");
      const run = Bun.spawnSync(["sh", "-c", manifestsStep(dockerfile, out)], { cwd: join(stage, "src"), stdout: "pipe", stderr: "pipe" });
      expect(run.exitCode).toBe(0);
      expect(existsSync(join(out, "packages/video/package.json"))).toBe(true);
      expect(existsSync(join(out, "packages/video/src"))).toBe(false);

      // Stage deps: the root manifest and lockfile, then the manifests.
      const repo = join(stage, "repo");
      mkdirSync(repo);
      cpSync(join(ctx, "package.json"), join(repo, "package.json"));
      cpSync(join(ctx, "bun.lock"), join(repo, "bun.lock"));
      cpSync(out, repo, { recursive: true });
      const r = install(repo);
      expect([r.exitCode, r.stderr.toString()]).toEqual([0, expect.any(String)]);
    });
  }

  test("control: the old fixed list of four manifests fails the frozen install", () => {
    const repo = mkdtempSync(join(tmpdir(), "docker-old-"));
    cpSync(join(ctx, "package.json"), join(repo, "package.json"));
    cpSync(join(ctx, "bun.lock"), join(repo, "bun.lock"));
    for (const name of ["apps/web", "apps/api", "packages/ui", "packages/config"]) {
      mkdirSync(join(repo, name), { recursive: true });
      cpSync(join(ctx, name, "package.json"), join(repo, name, "package.json"));
    }
    const r = install(repo);
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr.toString()).toContain("lockfile had changes");
  });
});
