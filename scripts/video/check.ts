#!/usr/bin/env bun
// video check: the Remotion rules for a JAL project, read from its
// package.json files. Run from the client root:
//
//   bun <jal-aidev>/scripts/video/check.ts [root] [--team N]
//
// Errors (exit 1):
//   - remotion and every @remotion/* package must share one exact version
//     (Remotion's own rule; a ^ or ~ range can split them).
//   - Remotion's bundler and Studio (@remotion/bundler, @remotion/cli,
//     @remotion/studio) only inside the dedicated video workspace
//     (packages/video), never in a website app: websites build with Bun.build.
//   - No Vite, Next.js, or webpack in a website app.
// Needs Brian's confirmation (exit 0, listed under "confirm"):
//   - Server and cloud rendering: @remotion/renderer as a direct dependency
//     (CLI and Chrome Headless Shell), @remotion/lambda, @remotion/cloudrun,
//     @remotion/vercel. The default MP4 path is the in-browser renderer.
//   - Studio installed: its Render button and `remotionb render` drive
//     Chrome Headless Shell; previewing is fine, rendering there needs a yes.
// License (warn): Remotion's Free License covers JAL at 3 people. At 4
//   or more (--team N, or "team" in .jal/video.json), a Company License is
//   required: https://remotion.dev/license
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const FREE_LICENSE_MAX = 3;
const SERVER_RENDER = ["@remotion/renderer", "@remotion/lambda", "@remotion/cloudrun", "@remotion/vercel"];
const STUDIO_ONLY = ["@remotion/bundler", "@remotion/cli", "@remotion/studio"];
const WEBSITE_BANNED = ["vite", "next", "webpack"];

export interface Manifest {
  /** Path relative to the root, e.g. "packages/video/package.json". */
  path: string;
  json: { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; optionalDependencies?: Record<string, string> };
}

export interface CheckReport {
  errors: string[];
  confirm: string[];
  warnings: string[];
  remotionVersion: string | null;
}

const isRemotion = (name: string) => name === "remotion" || name.startsWith("@remotion/");
const isVideoWorkspace = (path: string) => /(^|\/)packages\/video\/package\.json$/.test(path);
const isWebsiteApp = (path: string) => /(^|\/)apps\/[^/]+\/package\.json$/.test(path);

function deps(m: Manifest): [string, string][] {
  return [...Object.entries(m.json.dependencies ?? {}), ...Object.entries(m.json.devDependencies ?? {}), ...Object.entries(m.json.optionalDependencies ?? {})];
}

export function checkManifests(manifests: Manifest[], team?: number): CheckReport {
  const errors: string[] = [];
  const confirm: string[] = [];
  const warnings: string[] = [];
  const versions = new Map<string, string[]>();

  for (const m of manifests) {
    for (const [name, range] of deps(m)) {
      if (isRemotion(name)) {
        if (!/^\d+\.\d+\.\d+$/.test(range)) errors.push(`${m.path}: ${name} is "${range}"; Remotion packages must be pinned to one exact version (no ^ or ~)`);
        const list = versions.get(range) ?? [];
        list.push(`${name} (${m.path})`);
        versions.set(range, list);
        if (STUDIO_ONLY.includes(name) && !isVideoWorkspace(m.path)) {
          errors.push(`${m.path}: ${name} belongs in the video workspace (packages/video) only; websites build with Bun.build`);
        }
        if (name === "@remotion/cli" && isVideoWorkspace(m.path)) {
          confirm.push(`${m.path}: Studio is installed (@remotion/cli). Previewing is fine; its Render button and \`remotionb render\` use Chrome Headless Shell and need Brian's yes`);
        }
        if (SERVER_RENDER.includes(name)) {
          confirm.push(`${m.path}: ${name} is a server or cloud render path; it needs Brian's confirmation (the default is the in-browser renderer)`);
        }
      }
      if (isWebsiteApp(m.path) && (WEBSITE_BANNED.includes(name) || name.startsWith("@vitejs/"))) {
        errors.push(`${m.path}: ${name} is not allowed in a website app; JAL websites bundle with Bun.build`);
      }
    }
  }

  const found = [...versions.keys()];
  const exact = found.filter((v) => /^\d+\.\d+\.\d+$/.test(v));
  if (new Set(exact).size > 1) {
    errors.push(`Remotion packages disagree on the version: ${found.map((v) => `${v} in ${versions.get(v)!.join(", ")}`).join("; ")}`);
  }
  if (team !== undefined && team > FREE_LICENSE_MAX && versions.size > 0) {
    warnings.push(`The team is ${team} people: Remotion's Free License covers up to ${FREE_LICENSE_MAX}. A Company License is required before using Remotion (https://remotion.dev/license)`);
  }
  return { errors, confirm, warnings, remotionVersion: new Set(exact).size === 1 ? exact[0] : null };
}

/** Every package.json under root, skipping node_modules and dot directories. */
export function findManifests(root: string): Manifest[] {
  const out: Manifest[] = [];
  const walk = (dir: string, depth: number) => {
    if (depth > 4) return;
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".") || entry === "dist") continue;
      const full = join(dir, entry);
      if (entry === "package.json") {
        out.push({ path: relative(root, full), json: JSON.parse(readFileSync(full, "utf8")) });
      } else if (statSync(full).isDirectory()) {
        walk(full, depth + 1);
      }
    }
  };
  walk(root, 0);
  return out;
}

export function readTeam(root: string, flag?: string): number | undefined {
  if (flag !== undefined) return Number(flag);
  const cfg = join(root, ".jal", "video.json");
  if (!existsSync(cfg)) return undefined;
  const team = (JSON.parse(readFileSync(cfg, "utf8")) as { team?: number }).team;
  return typeof team === "number" ? team : undefined;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const teamAt = args.indexOf("--team");
  const teamFlag = teamAt === -1 ? undefined : args[teamAt + 1];
  const root = args.find((a, i) => !a.startsWith("--") && i !== teamAt + 1) ?? process.cwd();
  const report = checkManifests(findManifests(root), readTeam(root, teamFlag));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.errors.length ? 1 : 0);
}
