// Browser smoke test: the built site in a real browser, via puppeteer-core
// against the OS's Chrome or Chromium (never the bundled download). Skipped
// when no browser is found, so `bun test` still passes in a bare container.
//
// Replaces the scaffold's version when the search layer is installed. It
// proves hard law 2 end to end: the text a crawler reads with JavaScript OFF
// (the prerendered body) is the text a person sees after hydration, with no
// hydration error; and the scaffold's App still renders at /app.
import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { Browser } from "puppeteer-core";

function findChromePath(): string | undefined {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const candidates = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

const chromePath = findChromePath();

describe.skipIf(!chromePath)("smoke: built site renders", () => {
  let browser: Browser;
  let server: ReturnType<typeof Bun.serve>;
  const url = (p: string) => `http://localhost:${server.port}${p}`;

  beforeAll(async () => {
    GlobalRegistrator.unregister();
    if (!existsSync(new URL("../dist/seo.json", import.meta.url))) await import("../build");
    const puppeteer = (await import("puppeteer-core")).default;
    browser = await puppeteer.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox", "--disable-gpu"] });
    const { default: app } = await import("../server");
    server = Bun.serve({ fetch: app.fetch, port: 0 });
  });

  afterAll(async () => {
    await browser?.close();
    server?.stop();
    GlobalRegistrator.register();
  });

  async function rootText(path: string, javaScript: boolean): Promise<{ text: string; errors: string[] }> {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.setJavaScriptEnabled(javaScript);
    await page.goto(url(path), { waitUntil: "networkidle0" });
    const text = await page.$eval("#root", (el) => (el as HTMLElement).innerText);
    await page.close();
    return { text, errors };
  }

  test("the crawler text (JS off) equals the hydrated text, with no hydration error", async () => {
    for (const path of ["/", "/rates"]) {
      const bot = await rootText(path, false);
      const person = await rootText(path, true);
      expect(bot.text.length).toBeGreaterThan(100);
      expect(person.text).toBe(bot.text);
      expect(person.errors.filter((e) => /hydrat|did not match|Minified React error/i.test(e))).toEqual([]);
    }
  }, 30_000);

  test("the scaffold App still renders at /app", async () => {
    const page = await browser.newPage();
    await page.goto(url("/app"), { waitUntil: "networkidle0" });
    expect(await page.$eval("h1", (el) => el.textContent)).toContain("Welcome to");
    await page.close();
  }, 30_000);
});
