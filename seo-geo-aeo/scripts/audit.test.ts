import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { headingJoins, main, parseRobots, parseSitemap, runSeoAudit, summarise, visibleFaq, type AuditOutput } from "./audit.ts";
import { compilePattern, type SeoConfig } from "./lib/config.ts";
import { CHECKLIST } from "./lib/findings.ts";
import { scoreFindings } from "./score.ts";
import { serveFixture, type RunningFixture } from "./fixtures/serve.ts";
import { buildPress, buildSite } from "./fixtures/site.ts";

const KEY = "fixtureindexnowkey0123456789abcdef";
const ENV = { INDEXNOW_KEY: KEY };
const FORBIDDEN = ["cheapest in Indonesia", "/\\bnumber one\\b/i"].map((s) => ({ source: s, regex: compilePattern(s) }));

let press: RunningFixture;
let good: RunningFixture;
let bad: RunningFixture;
let goodOut: AuditOutput;
let badOut: AuditOutput;

function configFor(origin: string): SeoConfig {
  return {
    sites: [{ url: origin, indexNowKeyEnv: "INDEXNOW_KEY" }],
    languages: ["en", "id"],
    defaultLanguage: "en",
    keyUrls: ["/", "/rates", "/about", "/contact"],
    allowHosts: [press.host],
    place: "Depok",
    forbiddenPhrases: ["cheapest in Indonesia"],
  };
}

beforeAll(async () => {
  press = serveFixture(() => buildPress());
  good = serveFixture((origin) => buildSite({ origin, press: press.origin, key: KEY, variant: "good" }));
  bad = serveFixture((origin) => buildSite({ origin, press: press.origin, key: KEY, variant: "bad" }));
  goodOut = await runSeoAudit(good.origin, { config: configFor(good.origin), env: ENV, forbidden: FORBIDDEN });
  badOut = await runSeoAudit(bad.origin, { config: configFor(bad.origin), env: ENV, forbidden: FORBIDDEN });
});

afterAll(() => {
  press?.stop();
  good?.stop();
  bad?.stop();
});

describe("good fixture", () => {
  test("every automatic finding is PASS", () => {
    const notPass = goodOut.findings.filter((f) => f.status !== "PASS").map((f) => `${f.id} ${f.status}: ${f.evidence}`);
    expect(notPass).toEqual([]);
  });

  test("covers every auto item the audit can check from HTTP", () => {
    const ids = new Set(goodOut.findings.map((f) => f.id));
    const expected = [
      "F-02", "F-03", "F-04",
      "SEO-01", "SEO-02", "SEO-03", "SEO-04", "SEO-05", "SEO-06", "SEO-07", "SEO-08", "SEO-09", "SEO-11", "SEO-12", "SEO-13", "SEO-14", "SEO-15", "SEO-18",
      "AEO-03", "AEO-04", "AEO-05", "AEO-06", "AEO-07", "AEO-08", "AEO-09", "AEO-11",
      "GEO-01", "GEO-02", "GEO-03", "GEO-04", "GEO-05", "GEO-06", "GEO-07", "GEO-08", "GEO-09", "GEO-12",
    ];
    for (const id of expected) expect(ids.has(id)).toBe(true);
    for (const id of ids) expect(CHECKLIST.items.some((i) => i.id === id)).toBe(true);
  });

  test("scores 100 in SEO, AEO and GEO on the automatic items", () => {
    const r = scoreFindings({ findings: goodOut.findings });
    for (const p of ["SEO", "AEO", "GEO"] as const) expect(r.scores[p].score).toBe(100);
    expect(r.unverified).toEqual(["SEO-16", "SEO-17", "GEO-13"]);
  });

  test("the bad fixture scores lower in every pillar", () => {
    const r = scoreFindings({ findings: badOut.findings });
    for (const p of ["SEO", "AEO", "GEO"] as const) expect(r.scores[p].score!).toBeLessThan(100);
    expect(r.backlog[0].status).toBe("FAIL");
  });

  test("audits all 15 pages of the sitemap", () => {
    expect(goodOut.pages.filter((p) => p.indexable)).toHaveLength(15);
  });

  test("findings carry the fix method from the checklist", () => {
    const geo01 = goodOut.findings.find((f) => f.id === "GEO-01")!;
    expect(geo01.fix).toBe("code + human");
    expect(goodOut.findings.find((f) => f.id === "SEO-05")!.fix).toBe("code");
  });

  test("the IndexNow key never appears in the output", () => {
    const text = JSON.stringify(goodOut);
    expect(text).not.toContain(KEY);
    expect(goodOut.findings.find((f) => f.id === "SEO-15")!.evidence).toContain("[REDACTED]");
  });

  test("no evidence is mangled by redaction except the key file path", () => {
    const mangled = goodOut.findings.filter((f) => f.id !== "SEO-15" && f.evidence.includes("[REDACTED]"));
    expect(mangled).toEqual([]);
  });

  test("tests crawler user agents against the live site", () => {
    const uas = good.hits.filter((h) => h.startsWith("GET / ") && /GPTBot|ClaudeBot|PerplexityBot|OAI-SearchBot/.test(h));
    expect(uas.length).toBeGreaterThanOrEqual(4);
  });
});

describe("bad fixture", () => {
  const expectFail = (id: string, evidence: RegExp) => {
    const f = badOut.findings.filter((x) => x.id === id);
    expect(f.length).toBeGreaterThan(0);
    const failing = f.filter((x) => x.status === "FAIL");
    expect(failing.length).toBeGreaterThan(0);
    expect(failing.map((x) => x.evidence).join(" ")).toMatch(evidence);
  };

  test("short title fails SEO-05", () => expectFail("SEO-05", /\/about title "About" is 5 characters/));
  test("missing canonical fails SEO-04", () => expectFail("SEO-04", /\/rates has no canonical/));
  test("invalid JSON-LD fails SEO-07", () => expectFail("SEO-07", /\/programme JSON-LD block 1 is invalid JSON/));
  test("FAQ markup without a visible FAQ fails AEO-05", () => expectFail("AEO-05", /\/contact has FAQPage markup .* but no visible FAQ/));
  test("missing hreflang pair fails F-04", () => expectFail("F-04", /missing hreflang pair: \/id\/rates does not link back to \/rates/));
  test("missing hreflang pair fails SEO-02 in the sitemap", () => expectFail("SEO-02", /missing hreflang pair/));
  test("missing key file fails SEO-15", () => expectFail("SEO-15", /key file .* returns 404/));
  test("invalid robots directive fails SEO-01", () => expectFail("SEO-01", /Content-Signal: search=yes.* is not a standard robots directive/));

  test("the FAQ markup defect also fails the parity item F-03", () => expectFail("F-03", /no visible FAQ/));

  test("the defects stay isolated: unrelated items still pass", () => {
    const s = summarise(badOut.findings);
    for (const id of ["GEO-01", "GEO-02", "GEO-03", "GEO-05", "SEO-08", "SEO-12", "SEO-13"]) expect(s[id]).toBe("PASS");
  });

  test("the key stays redacted even when the key file is missing", () => {
    expect(JSON.stringify(badOut)).not.toContain(KEY);
  });
});

describe("allowlist and CLI", () => {
  test("refuses a site that is not in the config", async () => {
    const config = configFor(good.origin);
    await expect(runSeoAudit("https://not-in-config.example", { config, env: ENV })).rejects.toThrow(/refused/);
  });

  test("never fetches a host outside the allowlist", async () => {
    const config = { ...configFor(good.origin), allowHosts: [] };
    const seen: string[] = [];
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      seen.push(new URL(String(input)).host);
      return fetch(input, init);
    }) as typeof fetch;
    const out = await runSeoAudit(good.origin, { config, env: ENV, fetchImpl });
    expect(seen.every((h) => h === good.host)).toBe(true);
    const geo12 = out.findings.find((f) => f.id === "GEO-12")!;
    expect(geo12.status).toBe("WARN");
    expect(geo12.evidence).toContain("not in allowHosts");
  });

  test("main reads the config from the project and prints redacted JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jal-seo-audit-"));
    try {
      await mkdir(join(dir, ".jal"), { recursive: true });
      await writeFile(join(dir, ".jal/seo-geo-aeo.json"), JSON.stringify(configFor(good.origin)));
      let out = "";
      let err = "";
      const code = await main([good.origin, "--pages", "/guide"], { cwd: dir, env: ENV, out: (s) => (out += s), err: (s) => (err += s) });
      expect(err).toBe("");
      expect(code).toBe(0);
      expect(out).not.toContain(KEY);
      const parsed = JSON.parse(out) as AuditOutput;
      expect(parsed.tool).toBe("audit");
      expect(parsed.findings.length).toBeGreaterThan(30);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("main exits 1 with a clear error when the config is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "jal-seo-audit-"));
    try {
      let err = "";
      const code = await main([good.origin], { cwd: dir, env: ENV, out: () => {}, err: (s) => (err += s) });
      expect(code).toBe(1);
      expect(err).toContain("missing");
      expect(err).toContain(".jal/seo-geo-aeo.json");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("parsers", () => {
  test("parseRobots groups agents and flags non-standard directives", () => {
    const r = parseRobots("User-agent: *\nDisallow: /admin\n\nUser-agent: GPTBot\nUser-agent: ClaudeBot\nAllow: /\nContent-Signal: ai-train=no\nSitemap: https://x.test/sitemap.xml\n");
    expect(r.groups).toHaveLength(2);
    expect(r.groups[1].agents).toEqual(["GPTBot", "ClaudeBot"]);
    expect(r.invalid.map((i) => i.line)).toEqual([7]);
    expect(r.sitemaps).toEqual(["https://x.test/sitemap.xml"]);
  });

  test("parseSitemap reads loc, lastmod and xhtml alternates", () => {
    const s = parseSitemap('<urlset><url><loc>https://x.test/</loc><lastmod>2026-09-01</lastmod><xhtml:link rel="alternate" hreflang="id" href="https://x.test/id"/></url></urlset>');
    expect(s.entries).toEqual([{ loc: "https://x.test/", lastmod: "2026-09-01", alternates: [{ hreflang: "id", href: "https://x.test/id" }] }]);
  });

  test("headingJoins finds textContent joins across split spans", () => {
    expect(headingJoins("<span>Play</span><span>Padel</span>")).toEqual(["PlayPadel"]);
    expect(headingJoins("<span>Play</span> <span>Padel</span>")).toEqual([]);
    expect(headingJoins("Play <em>padel</em> today")).toEqual([]);
  });

  test("visibleFaq reads details and dl pairs", () => {
    const qa = visibleFaq("<details><summary>Q one?</summary><p>A one.</p></details><dl><dt>Q two?</dt><dd>A two.</dd></dl>");
    expect(qa).toEqual([{ q: "Q one?", a: "A one." }, { q: "Q two?", a: "A two." }]);
  });
});
