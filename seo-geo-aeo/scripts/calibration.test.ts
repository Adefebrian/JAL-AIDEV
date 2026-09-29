// Regressions from the first live calibration against padelparty.id
// (2026-09-29). Each fixture reproduces one false positive or false negative
// with small synthetic HTML; each negative case proves the check still fails a
// real gap. No test touches the network: the mini site runs on 127.0.0.1.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  faqParityOf, keyFactsBlock, markupFaq, pressSections, questionHeadings, runSeoAudit, sameSite, shownAmounts,
  tableHasEquivalent, visibleFaq, type AuditOutput,
} from "./audit.ts";
import type { SeoConfig } from "./lib/config.ts";
import { bodyHtml, decodeEntities, findElements, jsonLdBlocks, ldNodes, readableText, textKey } from "./lib/html.ts";
import { classifyPath } from "./lib/pages.ts";
import { serveFixture, type RunningFixture } from "./fixtures/serve.ts";
import { buildMiniPress, buildMiniSite } from "./fixtures/calibration/mini-site.ts";

const dir = join(import.meta.dir, "fixtures/calibration");
const load = async (name: string) => Bun.file(join(dir, name)).text();
const nodesOf = (html: string) => jsonLdBlocks(html).flatMap((b) => (b.data ? ldNodes(b.data) : []));

describe("entity decoding", () => {
  test("decodes numeric, hex and named references once", () => {
    expect(decodeEntities("What&#x27;s &amp; &#39;x&#39; &ndash; &rsquo; &eacute; &frac12;")).toBe("What's & 'x' \u2013 \u2019 \u00e9 \u00bd");
    expect(decodeEntities("&amp;#x27; &amp;lt;")).toBe("&#x27; &lt;");
    expect(decodeEntities("&notanentity; &#0; &#x110000;")).toBe("&notanentity; &#0; &#x110000;");
  });

  test("readableText joins inline tags and splits blocks", () => {
    expect(readableText("<p>See the <a href='/r'>rates page</a>.</p><p>Next</p>")).toBe("See the rates page. Next");
    expect(textKey("rates page .")).toBe("rates page.");
  });
});

describe("FAQ parity scoped to the FAQ section (F-03, AEO-05)", () => {
  test("a fact list and topic headings outside the FAQ are not shown questions", async () => {
    const html = await load("faq-scoped.html");
    const qs = visibleFaq(bodyHtml(html)).map((x) => x.q);
    expect(qs).toEqual(["What's the cheapest time to play?", "Can I rent a racket?"]);
  });

  test("markup matches the rendered FAQ once entities decode and inline links join", async () => {
    const html = await load("faq-scoped.html");
    const r = faqParityOf("/", bodyHtml(html), nodesOf(html));
    expect(r.problems).toEqual([]);
    expect(r.markup).toHaveLength(2);
  });

  test("a markup question the page does not show still fails", async () => {
    const html = await load("faq-scoped.html");
    const extra = [...nodesOf(html), { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Do you sell shoes?", acceptedAnswer: { "@type": "Answer", text: "No." } }] }];
    expect(faqParityOf("/", bodyHtml(html), extra).problems).toEqual(['/ markup question not shown: "Do you sell shoes?"']);
  });

  test("a question the FAQ section shows without markup still fails", async () => {
    const html = (await load("faq-scoped.html")).replace("</section>\n<nav>", "<h3>Is there parking?</h3><p>Yes, free parking for 40 cars.</p></section>\n<nav>");
    expect(faqParityOf("/", bodyHtml(html), nodesOf(html)).problems).toEqual(['/ shown question missing from markup: "Is there parking?"']);
  });

  test("a different answer still fails, and a double-encoded page text is not decoded twice", () => {
    const body = "<section><h2>FAQ</h2><h3>Rock &amp;amp; roll night?</h3><p>Fridays.</p></section>";
    const nodes = [{ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Rock & roll night?", acceptedAnswer: { "@type": "Answer", text: "Saturdays." } }] }];
    const problems = faqParityOf("/", body, nodes).problems;
    expect(problems).toContain('/ markup question not shown: "Rock & roll night?"');
    expect(problems).toContain('/ shown question missing from markup: "Rock &amp; roll night?"');
    const same = [{ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Rock &amp; roll night?", acceptedAnswer: { "@type": "Answer", text: "Saturdays." } }] }];
    expect(markupFaq(same)[0].q).toBe("Rock & roll night?");
    const wrong = [{ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "When is open play?", acceptedAnswer: { "@type": "Answer", text: "Saturdays." } }] }];
    expect(faqParityOf("/", "<section><h2>FAQ</h2><h3>When is open play?</h3><p>Fridays.</p></section>", wrong).problems).toEqual(['/ answer differs from markup for "When is open play?"']);
  });

  test("a dt without a dd does not swallow the next pair", () => {
    const qa = visibleFaq("<dl><dt>Hours</dt><dt>Can I park?</dt><dd>Yes.</dd></dl>");
    expect(qa).toEqual([{ q: "Can I park?", a: "Yes." }]);
  });

  test("question headings outside an FAQ section match markup but are not required in it", () => {
    const body = "<h2>How much is a court?</h2><p>Rp 125.000 an hour.</p><h2>Our story</h2><p>Opened in 2026.</p>";
    expect(questionHeadings(body)).toEqual([{ q: "How much is a court?", a: "Rp 125.000 an hour." }]);
    expect(faqParityOf("/", body, [{ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "How much is a court?", acceptedAnswer: { "@type": "Answer", text: "Rp 125.000 an hour." } }] }]).problems).toEqual([]);
  });
});

describe("key facts headings (AEO-06)", () => {
  test("In short and Ringkasnya title a key facts block", async () => {
    const html = await load("rates-table.html");
    expect(keyFactsBlock(bodyHtml(html))).toMatchObject({ found: true, early: true });
    expect(keyFactsBlock("<h1>X</h1><h2>In short</h2><ul><li>6 courts</li><li>Rp 125.000</li></ul><p>" + "word ".repeat(200) + "</p>").found).toBe(true);
    expect(keyFactsBlock("<h1>X</h1><h2>Our story</h2><p>6 courts, Rp 125.000.</p>").found).toBe(false);
  });
});

describe("table sentence equivalents (AEO-09)", () => {
  test("a list of sentences that restates every value counts; a vague paragraph does not", async () => {
    const body = bodyHtml(await load("rates-table.html"));
    const tables = findElements(body, "table");
    expect(tables).toHaveLength(2);
    expect(tableHasEquivalent(body, tables[0])).toBe(true);
    expect(tableHasEquivalent(body, tables[1])).toBe(false);
  });

  test("a paragraph that restates the values counts; one that drops them does not", () => {
    const table = "<table><tr><td>Day</td><td>Rp 150.000</td></tr><tr><td>Night</td><td>Rp 250.000</td></tr></table>";
    const good = `${table}<p>Day play costs Rp 150.000 an hour and night play costs Rp 250.000 an hour.</p>`;
    const vague = `${table}<p>Day play is cheaper than night play, so book early in the day to save money.</p>`;
    expect(tableHasEquivalent(good, findElements(good, "table")[0])).toBe(true);
    expect(tableHasEquivalent(vague, findElements(vague, "table")[0])).toBe(false);
  });
});

describe("amounts, own hosts and press sections", () => {
  test("shownAmounts reads grouped, decimal and word-scaled amounts", () => {
    const a = shownAmounts("Rp 1.575.000, Rp 175.000, 175,000, Rp 1.1 million, 1,8 juta, 125k, 5 km");
    for (const v of [1575000, 175000, 1100000, 1800000, 125000]) expect(a.has(v)).toBe(true);
    expect(a.has(5000)).toBe(false);
  });

  test("the site's own subdomains are not third-party", () => {
    expect(sameSite("app.padelparty.id", "padelparty.id")).toBe(true);
    expect(sameSite("padelparty.id", "www.padelparty.id")).toBe(true);
    expect(sameSite("courtside.id", "padelparty.id")).toBe(false);
    expect(sameSite("notpadelparty.id", "padelparty.id")).toBe(false);
    expect(sameSite("127.0.0.1:5001", "127.0.0.1:5000")).toBe(false);
  });

  test("pressSections finds the press record by its heading", () => {
    const s = pressSections("<section><h2>In the press</h2><ul><li><a href='https://news.example/a'>A</a></li></ul></section><section><h2>Book</h2><p><a href='https://booking.example/'>b</a></p></section>");
    expect(s).toHaveLength(1);
    expect(s[0]).toContain("news.example");
    expect(s[0]).not.toContain("booking.example");
  });

  test("a slug ending in academy is a programme", () => {
    const opts = { languages: ["en", "id"], defaultLanguage: "en" };
    expect(classifyPath("/youth-academy", opts)).toBe("programme");
    expect(classifyPath("/id/youth-academy", opts)).toBe("programme");
    expect(classifyPath("/youth-academy/register", opts)).toBe("other");
    expect(classifyPath("/padel-depok", opts)).toBe("other");
  });
});

describe("mini site: click depth, shared offers, press record", () => {
  let press: RunningFixture;
  let good: RunningFixture;
  let bad: RunningFixture;
  let goodOut: AuditOutput;
  let badOut: AuditOutput;
  const config = (origin: string): SeoConfig => ({
    sites: [{ url: origin }],
    languages: ["en", "id"],
    defaultLanguage: "en",
    keyUrls: ["/"],
    allowHosts: [press.host],
  });
  const f = (out: AuditOutput, id: string) => out.findings.find((x) => x.id === id)!;

  beforeAll(async () => {
    press = serveFixture(() => buildMiniPress());
    good = serveFixture((origin) => buildMiniSite({ origin, press: press.origin, variant: "good" }));
    bad = serveFixture((origin) => buildMiniSite({ origin, press: press.origin, variant: "bad" }));
    goodOut = await runSeoAudit(good.origin, { config: config(good.origin), env: {} });
    badOut = await runSeoAudit(bad.origin, { config: config(bad.origin), env: {} });
  });

  afterAll(() => {
    press?.stop();
    good?.stop();
    bad?.stop();
  });

  test("language switch and footer anchors put every page within 2 clicks", () => {
    expect(f(goodOut, "SEO-14").status).toBe("PASS");
  });

  test("without them the pages are reported as unreachable, not as deep", () => {
    const e = f(badOut, "SEO-14");
    expect(e.status).toBe("FAIL");
    expect(e.evidence).toContain("that no anchor path from home reaches");
    expect(e.evidence).toContain("/id/about");
    expect(e.evidence).toMatch(/\d+ pages serve no footer/);
  });

  test("a venue node repeated by @id is checked on its own page, not on every page", () => {
    expect(f(goodOut, "F-03").evidence).not.toContain("Offer price");
    expect(f(goodOut, "F-03").status).toBe("PASS");
    const bad03 = f(badOut, "F-03");
    expect(bad03.status).toBe("FAIL");
    expect(bad03.evidence).toContain("/ does not show the Offer price 175000");
    expect(bad03.evidence).not.toContain("/about");
  });

  test("GEO-12 reads the press record, not the app or booking links", () => {
    const e = f(goodOut, "GEO-12");
    expect(e.status).toBe("PASS");
    expect(e.evidence).toBe("1 press links fetched and live");
  });

  test("the programme slug and the In short block count", () => {
    expect(goodOut.pages.find((p) => p.url.endsWith("/youth-academy"))!.kind).toBe("programme");
    const aeo06 = f(goodOut, "AEO-06").evidence;
    expect(aeo06).toContain("/about has no key facts block");
    expect(aeo06).not.toContain("/youth-academy");
  });
});
