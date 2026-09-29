// docs-site/src/content.test.ts
//
// This project renders the whole page as static HTML strings (see
// render.ts), there is no <App /> component to mount, so this is a content
// test instead of an App.test.tsx. It asserts against the exact same
// renderPage() output build.ts writes to dist/index.html, so a passing test
// here is a real guarantee about what ships.
//
// Where the plugin sources sit next to this site (the repo checkout), the
// agent list, command list, plugin version, and UI check rule names are
// also cross-checked against them, so the site cannot silently drift from
// agents/*.md, commands/*.md, .claude-plugin/plugin.json, or the audit.
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  AGENTS,
  COMMANDS,
  COMMAND_MAP,
  HERO,
  JEV,
  JEV_CATALOG,
  NAV,
  PLUGIN_VERSION,
  SECTION_MARKERS,
  STUDY_CASES,
  UI_RULES,
} from "./content";
import { renderPage } from "./render";

// Built from a code point rather than a literal character, so this
// constant's own definition never trips the "no em dash in any source
// file" scan a few tests below.
const EMDASH = String.fromCharCode(0x2014);

const REPO_ROOT = join(import.meta.dir, "..", "..");

const REQUIRED_STUDY_CASE_TITLES = [
  "Build a SaaS dashboard from zero",
  "Add a Rust gRPC image-processing sidecar",
  "Ship a feature safely as a small team",
];

// The real slash commands, read from the plugin's commands/ folder so the page cannot drift.
const CURRENT_COMMANDS = readdirSync(join(import.meta.dir, "..", "..", "commands"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => "/" + f.replace(/\.md$/, ""));

// Commands that no longer exist as slash commands in v0.4.0. They may
// appear on the page only inside the old command, new command map.
const RETIRED_COMMANDS = [
  "/jal-scaffold",
  "/jal-orchestrate",
  "/jal-module",
  "/jal-service",
  "/jal-migrate",
  "/jal-adr",
  "/jal-immersive",
  "/jal-debug",
  "/jal-review",
  "/jal-audit",
  "/jal-pentest",
  "/jal-pr",
  "/jal-release",
  "/jal-deploy",
];

describe("docs site content", () => {
  const html = renderPage();

  test("contains every section marker", () => {
    expect(Object.keys(SECTION_MARKERS).length).toBeGreaterThanOrEqual(12);
    for (const marker of Object.values(SECTION_MARKERS)) {
      expect(html).toContain(marker);
    }
  });

  test("contains the required study case titles, and every study case uses a current command", () => {
    for (const title of REQUIRED_STUDY_CASE_TITLES) {
      expect(html).toContain(title);
    }
    for (const studyCase of STUDY_CASES) {
      for (const step of studyCase.steps) {
        const first = step.command.split(" ")[0];
        expect(CURRENT_COMMANDS).toContain(first);
      }
    }
  });

  test("install section covers marketplace add, the full-name install, update, and the settings.json snippet", () => {
    expect(html).toContain("claude plugin marketplace add JAL-Group/JAL-AIDEV");
    expect(html).toContain("claude plugin install jal-aidev@jal-aidev-marketplace");
    expect(html).toContain("claude plugin update jal-aidev@jal-aidev-marketplace");
    expect(html).toContain("enabledPlugins");
  });

  test("renders all 17 agents: one head, one lead, one judge, 14 specialists", () => {
    expect(AGENTS).toHaveLength(17);
    expect(AGENTS.filter((a) => a.tier === "head")).toHaveLength(1);
    expect(AGENTS.filter((a) => a.tier === "lead")).toHaveLength(1);
    expect(AGENTS.filter((a) => a.tier === "judge")).toHaveLength(1);
    expect(AGENTS.filter((a) => a.tier === "specialist")).toHaveLength(14);
    for (const agent of AGENTS) {
      expect(html).toContain(agent.slug);
      expect(agent.jev.length).toBeGreaterThan(0);
    }
  });

  test("renders exactly the real commands at the plugin version, each with its examples", () => {
    expect([...COMMANDS.map((c) => c.name)].sort()).toEqual([...CURRENT_COMMANDS].sort());
    for (const command of COMMANDS) {
      expect(command.version).toBe(PLUGIN_VERSION);
      expect(html).toContain(command.name);
      expect(command.examples.length).toBeGreaterThan(0);
      for (const example of command.examples) {
        expect(example.startsWith(command.name)).toBe(true);
        expect(html).toContain(example.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      }
    }
  });

  test("the old command, new command map maps every retired command to a current one", () => {
    const mapped = COMMAND_MAP.flatMap((entry) => entry.old.map((old) => old.split(" ")[0]));
    for (const retired of RETIRED_COMMANDS) {
      expect(mapped).toContain(retired);
    }
    for (const entry of COMMAND_MAP) {
      expect(CURRENT_COMMANDS).toContain(entry.now);
    }
  });

  test("the JEV catalog areas add up to the real catalog size", () => {
    const catalog = readFileSync(join(import.meta.dir, "..", "..", "skills", "jal-jev", "references", "catalog.md"), "utf8");
    const real = [...catalog.matchAll(/^### `[a-z]+\.[a-z_]+`/gm)].length;
    expect(JEV_CATALOG.reduce((sum, entry) => sum + entry.count, 0)).toBe(real);
    expect(html).toContain(`${real} decisions in total`);
  });

  test("the hero stats and the catalog title match the catalog and the rule list", () => {
    const catalog = readFileSync(join(import.meta.dir, "..", "..", "skills", "jal-jev", "references", "catalog.md"), "utf8");
    const jevCount = [...catalog.matchAll(/^### `[a-z]+\.[a-z_]+`/gm)].length;
    const stat = (label: string) => HERO.stats.find((s) => s.label === label)?.value;
    expect(stat("JEV decisions")).toBe(String(jevCount));
    expect(stat("UI check rules")).toBe(String(UI_RULES.length));
    expect(stat("specialist agents")).toBe(String(AGENTS.length));
    expect(stat("commands")).toBe(String(COMMANDS.length));
    expect(JEV.catalogTitle).toBe(`The ${jevCount} catalog decisions`);
    expect(SECTION_MARKERS.uiCheck as string).toBe(`The ${UI_RULES.length}-rule UI check`);
  });

  test("the UI check lists exactly 22 rules", () => {
    expect(UI_RULES).toHaveLength(22);
    expect(new Set(UI_RULES.map((r) => r.rule)).size).toBe(22);
    for (const rule of UI_RULES) expect(html).toContain(rule.rule);
  });

  test("the bottom tab bar has 3 to 5 destinations", () => {
    expect(NAV.length).toBeGreaterThanOrEqual(3);
    expect(NAV.length).toBeLessThanOrEqual(5);
  });

  test("covers the FAQ topics: bun on PATH, private repo auth, boundary-check failures", () => {
    expect(html.toLowerCase()).toContain("bun --version");
    expect(html.toLowerCase()).toContain("private");
    expect(html).toContain("check:boundaries");
  });

  test("never renders an em dash", () => {
    expect(html).not.toContain(EMDASH);
  });

  test("never renders an emoji", () => {
    expect(/\p{Extended_Pictographic}/u.test(html)).toBe(false);
  });

  test("never mentions condom, in case a spaghetti/protection metaphor gets out of hand", () => {
    expect(html.toLowerCase()).not.toContain("condom");
  });
});

describe("site facts match the plugin sources", () => {
  const agentsDir = join(REPO_ROOT, "agents");
  const commandsDir = join(REPO_ROOT, "commands");
  const pluginJson = join(REPO_ROOT, ".claude-plugin", "plugin.json");
  const auditTs = join(REPO_ROOT, "mcp", "jal-design", "audit.ts");

  test.if(existsSync(agentsDir))("every agents/*.md is on the page and nothing else", () => {
    const slugs = readdirSync(agentsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .sort();
    expect(AGENTS.map((a) => a.slug).sort()).toEqual(slugs);
  });

  test.if(existsSync(commandsDir))("every commands/*.md is on the page and nothing else", () => {
    const names = readdirSync(commandsDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => `/${f.replace(/\.md$/, "")}`)
      .sort();
    expect(COMMANDS.map((c) => c.name).sort()).toEqual(names);
  });

  test.if(existsSync(pluginJson))("the site version matches .claude-plugin/plugin.json", () => {
    const version = JSON.parse(readFileSync(pluginJson, "utf-8")).version as string;
    expect(PLUGIN_VERSION).toBe(`v${version}`);
  });

  test.if(existsSync(auditTs))("every rule the UI audit can report is listed", () => {
    const source = readFileSync(auditTs, "utf-8");
    const found = new Set<string>();
    for (const m of source.matchAll(/pushV\("([a-z-]+)"/g)) found.add(m[1]);
    for (const m of source.matchAll(/rule: "([a-z-]+)"/g)) found.add(m[1]);
    expect(UI_RULES.map((r) => r.rule).sort()).toEqual([...found].sort());
  });
});

describe("no em dash anywhere in docs-site source", () => {
  const srcRoot = join(import.meta.dir, ".."); // docs-site/
  const skipDirs = new Set(["node_modules", "dist", ".turbo"]);
  const textExtensions = [".ts", ".tsx", ".css", ".html", ".json", ".md"];

  function collectFiles(dir: string): string[] {
    const found: string[] = [];
    for (const entry of readdirSync(dir)) {
      if (skipDirs.has(entry)) continue;
      const full = join(dir, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        found.push(...collectFiles(full));
      } else if (textExtensions.some((ext) => entry.endsWith(ext))) {
        found.push(full);
      }
    }
    return found;
  }

  test("no source file under docs-site/ contains an em dash", () => {
    const offenders: string[] = [];
    for (const file of collectFiles(srcRoot)) {
      const contents = readFileSync(file, "utf-8");
      if (contents.includes(EMDASH)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
