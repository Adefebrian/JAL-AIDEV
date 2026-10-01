#!/usr/bin/env bun
// video check: the Remotion rules for a JAL project, read from its
// package.json files. Run from the client root:
//
//   bun <jal-aidev>/scripts/video/check.ts [root] [--team N] [--external-client]
//
// The package lists and the video workspace path come from
// hooks/remotion-rules.mjs, the same module the write guard uses.
//
// Errors (exit 1):
//   - remotion and every @remotion/* package must share one exact version
//     (Remotion's own rule; a ^ or ~ range can split them).
//   - Outside a video workspace (packages/video or packages/video-<name>),
//     only the browser-safe Remotion packages; Studio, the bundler, and the
//     render paths stay in the video workspace. No render script there either.
//   - The deprecated @remotion/media-parser and @remotion/webcodecs, anywhere.
//   - No Vite, Next.js, or webpack in a website app.
// Needs Brian's confirmation (exit 0, listed under "confirm"):
//   - Server and cloud rendering in the video workspace: @remotion/renderer,
//     lambda, lambda-client, cloudrun, vercel, serverless. The default MP4
//     path is the in-browser renderer.
//   - Studio installed: its Render button and `remotionb render` drive
//     Chrome Headless Shell; previewing is fine, rendering there needs a yes.
// License stop (exit 3): Remotion's Free License covers JAL at 3 people on
//   internal projects. At 4 or more people (--team N, or "team" in
//   .jal/video.json) or with an external client (--external-client, or
//   "externalClient": true), a project that uses Remotion stops for Brian.
// Usage error (exit 2): a bad flag, such as --team with no number.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { REMOTION_SERVER_RENDER, isRemotionPackage, isVideoWorkspaceManifest, remotionPackageReason, renderScriptReason } from "../../hooks/remotion-rules.mjs";

export const FREE_LICENSE_MAX = 3;
const WEBSITE_BANNED = ["vite", "next", "webpack"];
export const LICENSE_STOP =
  "Remotion's free license ends at 4 people on a project, and contractors count from Remotion 5.0. An external client who receives the source counts too. A Company License would be required (Creators $25 per seat per month, or Automators $0.01 per render with a $100 monthly minimum). Confirm with Brian before continuing. https://remotion.dev/license";
export const USAGE = "usage: bun scripts/video/check.ts [root] [--team <people>] [--external-client]";
export const EXIT = { ok: 0, errors: 1, usage: 2, licenseStop: 3 } as const;

export interface Manifest {
  /** Path relative to the root, e.g. "packages/video/package.json". */
  path: string;
  json: { name?: string; scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; optionalDependencies?: Record<string, string> };
}

export interface CheckReport {
  errors: string[];
  confirm: string[];
  warnings: string[];
  remotionVersion: string | null;
  /** The license stop text when the project uses Remotion with 4+ people or an external client. */
  stop: string | null;
}

export interface LicenseContext {
  team?: number;
  externalClient?: boolean;
}

const isWebsiteApp = (path: string) => /^apps\/[^/]+\/package\.json$/.test(path.replace(/\\/g, "/"));

function deps(m: Manifest): [string, string][] {
  return [...Object.entries(m.json.dependencies ?? {}), ...Object.entries(m.json.devDependencies ?? {}), ...Object.entries(m.json.optionalDependencies ?? {})];
}

export function checkManifests(manifests: Manifest[], license: number | LicenseContext = {}): CheckReport {
  const { team, externalClient = false } = typeof license === "number" ? { team: license } : license;
  const errors: string[] = [];
  const confirm: string[] = [];
  const warnings: string[] = [];
  const versions = new Map<string, string[]>();

  for (const m of manifests) {
    const inVideo = isVideoWorkspaceManifest(m.path);
    if (!inVideo) {
      for (const [key, script] of Object.entries(m.json.scripts ?? {})) {
        const reason = renderScriptReason(script);
        if (reason) errors.push(`${m.path}: scripts.${key}: ${reason}`);
      }
    }
    for (const [name, range] of deps(m)) {
      if (isRemotionPackage(name)) {
        if (!/^\d+\.\d+\.\d+$/.test(range)) errors.push(`${m.path}: ${name} is "${range}"; Remotion packages must be pinned to one exact version (no ^ or ~)`);
        const list = versions.get(range) ?? [];
        list.push(`${name} (${m.path})`);
        versions.set(range, list);
        const reason = remotionPackageReason(name, inVideo);
        if (reason) errors.push(`${m.path}: ${reason}`);
        if (name === "@remotion/cli" && inVideo) {
          confirm.push(`${m.path}: Studio is installed (@remotion/cli). Previewing is fine; its Render button and \`remotionb render\` use Chrome Headless Shell and need Brian's yes`);
        }
        if (REMOTION_SERVER_RENDER.includes(name) && inVideo) {
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
  const overTeam = team !== undefined && team > FREE_LICENSE_MAX;
  let stop: string | null = null;
  if (versions.size > 0 && (overTeam || externalClient)) {
    const why = [overTeam ? `the team is ${team} people (the Free License covers up to ${FREE_LICENSE_MAX})` : "", externalClient ? "an external client is on the project" : ""].filter(Boolean).join(" and ");
    warnings.push(`License stop: ${why}. A Company License is required before using Remotion (https://remotion.dev/license)`);
    stop = LICENSE_STOP;
  }
  return { errors, confirm, warnings, remotionVersion: new Set(exact).size === 1 ? exact[0] : null, stop };
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

/** Team size and external client from .jal/video.json ({ "team": 3, "externalClient": false }). */
export function readLicense(root: string): LicenseContext {
  const cfg = join(root, ".jal", "video.json");
  if (!existsSync(cfg)) return {};
  const json = JSON.parse(readFileSync(cfg, "utf8")) as { team?: unknown; externalClient?: unknown };
  return { team: typeof json.team === "number" ? json.team : undefined, externalClient: json.externalClient === true };
}

export function readTeam(root: string, flag?: string): number | undefined {
  if (flag !== undefined) return Number(flag);
  return readLicense(root).team;
}

export class UsageError extends Error {}

export interface CliArgs {
  root?: string;
  team?: number;
  externalClient: boolean;
}

/** Parses the command line. Throws UsageError on anything it does not understand. */
export function parseArgs(args: string[]): CliArgs {
  const out: CliArgs = { externalClient: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--team") {
      const v = args[i + 1];
      if (v === undefined || v.startsWith("-")) throw new UsageError("--team needs a number of people, for example --team 3");
      if (!/^\d+$/.test(v)) throw new UsageError(`--team needs a whole number of people, not "${v}"`);
      out.team = Number(v);
      i++;
    } else if (a === "--external-client") {
      out.externalClient = true;
    } else if (a.startsWith("-")) {
      throw new UsageError(`unknown flag "${a}" (write --team 4, not --team=4)`);
    } else if (out.root === undefined) {
      out.root = a;
    } else {
      throw new UsageError(`one root only, got "${out.root}" and "${a}"`);
    }
  }
  return out;
}

/** The whole CLI as a function: the exit code and what to print. */
export function runCli(args: string[], cwd = process.cwd()): { code: number; stdout: string; stderr: string } {
  let parsed: CliArgs;
  try {
    parsed = parseArgs(args);
  } catch (e) {
    if (e instanceof UsageError) return { code: EXIT.usage, stdout: "", stderr: `${e.message}\n${USAGE}` };
    throw e;
  }
  const root = parsed.root ?? cwd;
  const fromFile = readLicense(root);
  const report = checkManifests(findManifests(root), {
    team: parsed.team ?? fromFile.team,
    externalClient: parsed.externalClient || fromFile.externalClient === true,
  });
  const stdout = JSON.stringify(report, null, 2);
  if (report.stop) return { code: EXIT.licenseStop, stdout, stderr: `STOP: ${report.stop}` };
  return { code: report.errors.length ? EXIT.errors : EXIT.ok, stdout, stderr: "" };
}

if (import.meta.main) {
  const { code, stdout, stderr } = runCli(process.argv.slice(2));
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  process.exit(code);
}
