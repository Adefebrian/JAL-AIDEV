---
name: jal-qa-automation
description: bun test patterns, happy-dom global registrator for component tests, Hono API E2E via app.request, puppeteer-core browser smoke tests, JUnit/TAP reporting and pass/fail summary format. Use when writing tests, running QA, or setting up CI test reporting for a JAL project. Playwright is banned.
---

# JAL QA Automation

Detail layer for the JAL test stack. Runner is `bun test`, nothing else. Playwright is explicitly banned, too heavy for a resource-light server-optimized stack; use `puppeteer-core` against system Chromium instead. Defers to `jal-standards` for the approved runtime.

## bun test patterns

Standard unit/logic test, colocated with source (`src/utils/price.test.ts`):

```ts
import { describe, expect, test } from "bun:test";
import { formatPrice } from "./price";

describe("formatPrice", () => {
  test("formats integer rupiah with thousands separator", () => {
    expect(formatPrice(1500000)).toBe("Rp 1.500.000");
  });

  test("rejects negative amounts", () => {
    expect(() => formatPrice(-1)).toThrow();
  });
});
```

Run: `bun test` (root, uses workspace glob), `bun test apps/api` (scoped), `bun test --watch` during dev.

## happy-dom for component tests

Bun has no built-in DOM. Register `happy-dom` globally once per test run so React components render in a fake DOM under `bun test`.

`bunfig.toml`:

```toml
[test]
preload = ["./test/happydom.ts"]
```

`test/happydom.ts`:

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

Component test (`packages/ui/BentoCard.test.tsx`):

```tsx
import { describe, expect, test } from "bun:test";
import { render } from "@testing-library/react";
import { BentoCard } from "./BentoCard";

describe("BentoCard", () => {
  test("renders title", () => {
    const { getByText } = render(<BentoCard title="Revenue" />);
    expect(getByText("Revenue")).toBeTruthy();
  });
});
```

Install: `bun add -d @happy-dom/global-registrator @testing-library/react`.

## API E2E against Hono: fetch / app.request

No live server needed for API tests. Hono's app instance exposes `.request()`, call it directly:

```ts
import { describe, expect, test } from "bun:test";
import app from "../src/index";

describe("GET /api/health", () => {
  test("returns 200 and ok status", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

describe("POST /api/leads", () => {
  test("rejects missing email", async () => {
    const res = await app.request("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });
    expect(res.status).toBe(400);
  });
});
```

For a fuller integration test against a real bound port (e.g. to test Redis rate limiting under real socket behavior), start the server with `Bun.serve({ fetch: app.fetch, port: 0 })` and hit it with plain `fetch(\`http://localhost:\${server.port}/...\`)`, then `server.stop()` in the test's cleanup.

## puppeteer-core + system Chromium smoke pattern

For actual browser smoke tests (does the built SPA render, does a click navigate), use `puppeteer-core` pointed at the OS's installed Chromium/Chrome, never the bundled full Puppeteer download (too heavy, violates resource-light mandate).

```ts
import { describe, expect, test, afterAll, beforeAll } from "bun:test";
import puppeteer, { type Browser } from "puppeteer-core";

let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
});

afterAll(async () => {
  await browser.close();
});

describe("smoke: home page", () => {
  test("renders hero heading", async () => {
    const page = await browser.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });
    const heading = await page.$eval("h1", (el) => el.textContent);
    expect(heading).toContain("Welcome");
    await page.close();
  });
});
```

`CHROME_PATH` must be set per environment (local dev, CI runner, Docker image) since there is no bundled browser download. In the Docker image, install `chromium` via the OS package manager in the same layer.

## JUnit/TAP reporting and pass/fail summary

CI and the review gate (`/jal-check`) both need a single machine-parseable result and a single human-readable line.

Generate JUnit XML from `bun test`:

```bash
bun test --reporter=junit --reporter-outfile=./test-results.xml
```

Generate TAP for tools that expect it:

```bash
bun test --reporter=tap
```

Concrete pass/fail summary format (what the review gate (`/jal-check`) and CI print at the end, one line, always this shape):

```
QA GATE: PASS  |  42 passed, 0 failed, 0 skipped  |  unit+api+smoke  |  1.8s
QA GATE: FAIL  |  39 passed, 3 failed, 0 skipped  |  unit+api+smoke  |  2.1s
  FAIL apps/api/src/routes/leads.test.ts > POST /api/leads > rejects missing email
  FAIL packages/ui/BentoCard.test.tsx > renders title
  FAIL smoke/home.test.ts > smoke: home page > renders hero heading
```

Rules for the summary line:
- Always starts with `QA GATE: PASS` or `QA GATE: FAIL`, nothing in between.
- Counts come straight from `bun test`'s own summary, never hand-tallied.
- On FAIL, list every failing test's full descriptive path (file > describe > test) so the routing agent (`jal-lead`) knows exactly which owning agent to send it back to (frontend test failure to `jal-frontend`, API test failure to `jal-backend`, smoke failure to whichever agent owns the broken route).
- Suite tag (`unit+api+smoke`) reflects which test tiers actually ran, not which exist.
