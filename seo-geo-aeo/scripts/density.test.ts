import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { densityFindings, main, measureDensity, pagesFromSeoJson } from "./density.ts";
import { capture, mockFetch, tempProject } from "./fixtures/testkit.ts";

const PAGE = `<html><head><title>Rates 2026</title><script>var x = 12345;</script></head><body>
<p>We have 4 courts and 12 coaches.</p>
<p>A court costs Rp 150.000 per hour, <a href="https://news.example/a">Kabar reported</a>.</p>
<p><a href="https://padel.example/rates">Rates</a></p>
<blockquote>&quot;The courts were full by seven.&quot;</blockquote>
<style>.a{width:100px}</style>
</body></html>`;

describe("measureDensity (section 12.5 core)", () => {
  test("counts words, numbers, outbound citations and quotes of the rendered body", () => {
    const d = measureDensity(PAGE, "padel.example", "/rates");
    // words: We have 4 courts and 12 coaches. | A court costs Rp 150.000 per hour, Kabar reported. | Rates | "The courts were full by seven."
    expect(d.words).toBe(7 + 9 + 1 + 6);
    // numbers: 4, 12, Rp 150.000 (one match); script and head are not rendered text
    expect(d.numbers).toBe(3);
    expect(d.per100).toBe(13);
    expect(d.outboundUrls).toEqual(["https://news.example/a"]);
    expect(d.quotes).toBe(1);
  });

  test("GEO-06 warns below 5 numbers per 100 words on money pages only", () => {
    const low = { page: "/rates", words: 200, numbers: 6, per100: 3, outbound: 0, outboundUrls: [], quotes: 0 };
    const high = { ...low, page: "/id/harga", numbers: 20, per100: 10 };
    const other = { ...low, page: "/about" };
    expect(densityFindings([low, other])[0].status).toBe("WARN");
    expect(densityFindings([high], { languages: ["en", "id"], defaultLanguage: "en" })[0].status).toBe("PASS");
    expect(densityFindings([other])[0].status).toBe("N/A");
  });

  test("reads pages from a build-time seo.json", () => {
    expect(pagesFromSeoJson({ pages: [{ path: "/rates", body: "<p>1</p>" }] })).toEqual([{ page: "/rates", html: "<p>1</p>" }]);
    expect(pagesFromSeoJson({ "/": { html: "<p>a</p>" }, site: "https://x" })).toEqual([{ page: "/", html: "<p>a</p>" }]);
  });
});

describe("density.ts CLI", () => {
  let project: { dir: string; cleanup: () => Promise<void> };
  beforeEach(async () => {
    project = await tempProject();
  });
  afterEach(async () => {
    await project.cleanup();
  });

  test("measures a configured URL through the allowlist with mocked fetch", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(PAGE, { headers: { "content-type": "text/html" } }));
    const c = capture({ fetchImpl, cwd: project.dir, env: {} });
    expect(await main(["https://padel.example/rates"], c.deps)).toBe(0);
    expect(calls).toHaveLength(1);
    const out = JSON.parse(c.out());
    expect(out.pages[0].per100).toBe(13);
    expect(out.findings[0]).toMatchObject({ id: "GEO-06", status: "PASS" });
  });

  test("refuses a URL outside the config", async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(PAGE));
    const c = capture({ fetchImpl, cwd: project.dir, env: {} });
    expect(await main(["https://elsewhere.example/rates"], c.deps)).toBe(1);
    expect(c.err()).toContain("refused");
    expect(calls).toHaveLength(0);
  });

  test("measures a seo.json file without any network", async () => {
    await writeFile(join(project.dir, "seo.json"), JSON.stringify({ site: "https://padel.example", pages: [{ path: "/rates", body: PAGE }] }));
    const c = capture({ cwd: project.dir, env: {} });
    expect(await main(["seo.json"], c.deps)).toBe(0);
    expect(JSON.parse(c.out()).pages[0].outbound).toBe(1);
  });
});
