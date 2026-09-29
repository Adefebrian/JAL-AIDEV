import { describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { baseConfig, tempProject } from "../fixtures/testkit.ts";
import { compilePattern, ConfigError, findSite, loadConfig, loadForbidden, matchForbidden, siteHosts, validateConfig } from "./config.ts";
import { classifyPath, langOfPath, stripLang } from "./pages.ts";

describe("config", () => {
  test("loads and validates .jal/seo-geo-aeo.json from the project cwd", async () => {
    const p = await tempProject();
    try {
      const { config, path } = await loadConfig(p.dir);
      expect(path).toBe(join(p.dir, ".jal/seo-geo-aeo.json"));
      expect(config.sites[0].url).toBe("https://padel.example");
    } finally {
      await p.cleanup();
    }
  });

  test("a missing config names the file and section 7.4", async () => {
    const p = await tempProject();
    try {
      await expect(loadConfig(join(p.dir, "nowhere"))).rejects.toThrow(/missing .*seo-geo-aeo\.json[\s\S]*7\.4/);
    } finally {
      await p.cleanup();
    }
  });

  test("invalid JSON is reported", async () => {
    const p = await tempProject();
    try {
      await writeFile(join(p.dir, ".jal/seo-geo-aeo.json"), "{ nope");
      await expect(loadConfig(p.dir)).rejects.toThrow(/not valid JSON/);
    } finally {
      await p.cleanup();
    }
  });

  test("lists every problem at once", () => {
    try {
      validateConfig({ sites: [{ url: "not a url", indexNowKeyEnv: "lowercase" }], languages: ["en"], defaultLanguage: "id", keyUrls: ["rates"] });
      throw new Error("expected a ConfigError");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const problems = (err as ConfigError).problems.join("\n");
      expect(problems).toContain("sites[0].url");
      expect(problems).toContain("indexNowKeyEnv");
      expect(problems).toContain("defaultLanguage must be one of languages");
      expect(problems).toContain("keyUrls");
    }
  });

  test("refuses secrets written into the config", () => {
    expect(() => validateConfig({ ...baseConfig(), sites: [{ url: "https://padel.example", apiKey: "x" }] })).toThrow(/secrets live only in env/);
  });

  test("findSite refuses a host that is not configured", () => {
    const c = baseConfig();
    expect(findSite(c, "https://padel.example/rates").url).toBe("https://padel.example");
    expect(() => findSite(c, "https://other.example")).toThrow(/refused/);
  });

  test("siteHosts adds the www twin of each site", () => {
    expect(siteHosts(baseConfig()).sort()).toEqual(["padel.example", "www.padel.example"]);
  });

  test("forbidden phrases come from the config and the project's forbidden-claims file", async () => {
    const p = await tempProject();
    try {
      await writeFile(join(p.dir, ".jal/forbidden-claims.json"), JSON.stringify(["/\\bnumber one\\b/i", { pattern: "only club" }]));
      const patterns = await loadForbidden(baseConfig({ forbiddenPhrases: ["cheapest in Indonesia"] }), p.dir);
      expect(patterns.map((x) => x.source)).toEqual(["cheapest in Indonesia", "/\\bnumber one\\b/i", "only club"]);
      expect(matchForbidden("We are Number One and the Cheapest in Indonesia", patterns).map((h) => h.match)).toEqual(["Cheapest in Indonesia", "Number One"]);
    } finally {
      await p.cleanup();
    }
  });

  test("compilePattern treats plain text as a literal", () => {
    expect(compilePattern("a.b").test("axb")).toBe(false);
    expect(compilePattern("/a.b/").test("axb")).toBe(true);
  });
});

describe("pages", () => {
  const opts = { languages: ["en", "id"], defaultLanguage: "en" };
  test("language is a URL", () => {
    expect(langOfPath("/id/rates", opts.languages, opts.defaultLanguage)).toBe("id");
    expect(langOfPath("/rates", opts.languages, opts.defaultLanguage)).toBe("en");
    expect(stripLang("/id", opts.languages, opts.defaultLanguage)).toBe("/");
  });

  test("classifies page kinds in both languages", () => {
    expect(classifyPath("/", opts)).toBe("home");
    expect(classifyPath("/id/harga", opts)).toBe("money");
    expect(classifyPath("/about", opts)).toBe("about");
    expect(classifyPath("/id/akademi", opts)).toBe("programme");
    expect(classifyPath("/guide/beginners", opts)).toBe("guide");
    expect(classifyPath("/id/kebijakan-privasi", opts)).toBe("privacy");
    expect(classifyPath("/blog/x", opts)).toBe("other");
    expect(classifyPath("/leaderboard", { ...opts, overrides: { "/leaderboard": "money" } })).toBe("money");
  });
});
