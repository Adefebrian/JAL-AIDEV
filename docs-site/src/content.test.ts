// docs-site/src/content.test.ts
//
// This project renders the whole page as static HTML strings (see
// render.ts), there is no <App /> component to mount, so this is the
// "content test" alternative called out in the task brief instead of an
// App.test.tsx. It asserts against the exact same renderPage() output
// build.ts writes to dist/index.html, so a passing test here is a real
// guarantee about what ships, not a guarantee about a parallel copy of
// the copy.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { AGENTS, COMMANDS, SECTION_MARKERS, STUDY_CASES } from "./content";
import { renderPage } from "./render";

// Built from a code point rather than a literal character, so this
// constant's own definition never trips the "no em dash in any source
// file" scan a few tests below.
const EMDASH = String.fromCharCode(0x2014);

const REQUIRED_STUDY_CASE_TITLES = [
  "Build a SaaS dashboard from zero",
  "Add a Rust gRPC image-processing sidecar",
  "Ship a feature safely as a small team",
];

describe("docs site content", () => {
  const html = renderPage();

  test("contains all 7 required section markers", () => {
    for (const marker of Object.values(SECTION_MARKERS)) {
      expect(html).toContain(marker);
    }
    expect(Object.keys(SECTION_MARKERS)).toHaveLength(7);
  });

  test("contains the 3 required study case titles", () => {
    for (const title of REQUIRED_STUDY_CASE_TITLES) {
      expect(html).toContain(title);
    }
  });

  test("study cases data has at least 3 entries, matching the required titles", () => {
    expect(STUDY_CASES.length).toBeGreaterThanOrEqual(3);
    const titles = STUDY_CASES.map((c) => c.title);
    for (const required of REQUIRED_STUDY_CASE_TITLES) {
      expect(titles).toContain(required);
    }
  });

  test("install section covers marketplace add, plugin install, and the settings.json snippet", () => {
    expect(html).toContain("/plugin marketplace add JAL-Group/JAL-AIDEV");
    expect(html).toContain("/plugin install jal-aidev");
    expect(html).toContain("enabledPlugins");
    expect(html).toContain("jal-aidev@jal-aidev-marketplace");
  });

  test("renders all 14 agents, principal above lead above the 12 specialists", () => {
    expect(AGENTS).toHaveLength(14);
    expect(AGENTS.filter((a) => a.tier === "head")).toHaveLength(1);
    expect(AGENTS.filter((a) => a.tier === "lead")).toHaveLength(1);
    expect(AGENTS.filter((a) => a.tier === "specialist")).toHaveLength(12);
    for (const agent of AGENTS) {
      expect(html).toContain(agent.slug);
    }
  });

  test("renders all 15 commands (3 from v0.1.0, 12 from v0.2.0) with an example each", () => {
    expect(COMMANDS).toHaveLength(15);
    expect(COMMANDS.filter((c) => c.version === "v0.1.0")).toHaveLength(3);
    expect(COMMANDS.filter((c) => c.version === "v0.2.0")).toHaveLength(12);
    for (const command of COMMANDS) {
      expect(html).toContain(command.name);
      expect(html).toContain(command.example);
    }
  });

  test("covers the FAQ topics: bun on PATH, private repo auth, boundary-check failures", () => {
    expect(html.toLowerCase()).toContain("bun --version");
    expect(html.toLowerCase()).toContain("private");
    expect(html).toContain("check:boundaries");
  });

  test("never renders an em dash", () => {
    expect(html).not.toContain(EMDASH);
  });

  test("never mentions condom, in case a spaghetti/protection metaphor gets out of hand", () => {
    expect(html.toLowerCase()).not.toContain("condom");
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
