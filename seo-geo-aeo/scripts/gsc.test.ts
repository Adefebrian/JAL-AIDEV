import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { capture, json, mockFetch, tempProject, type Call } from "./fixtures/testkit.ts";
import { INSPECT_URL, loadServiceAccount, main, signJwt, TOKEN_URL, WEBMASTERS_BASE } from "./gsc.ts";
import { Redactor } from "./lib/redact.ts";

const ACCESS = "ya29.test-access-token-abcdefghijklmnop";
let publicKey: CryptoKey;
let privatePem: string;
let saJson: string;
let saB64: string;
let project: { dir: string; cleanup: () => Promise<void> };

function b64(bytes: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
}

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  publicKey = pair.publicKey;
  const der = b64(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  privatePem = `-----BEGIN PRIVATE KEY-----\n${der.match(/.{1,64}/g)!.join("\n")}\n-----END PRIVATE KEY-----\n`;
  saJson = JSON.stringify({ type: "service_account", client_email: "seo-bot@jal-test.iam.gserviceaccount.com", private_key: privatePem, private_key_id: "pkid0123456789abcdef", token_uri: TOKEN_URL });
  saB64 = btoa(saJson);
});

beforeEach(async () => {
  project = await tempProject();
});
afterEach(async () => {
  await project.cleanup();
});

type Opts = { inspect?: (call: Call, n: number) => Response; performance?: (call: Call) => Response };

function gscMock(opts: Opts = {}) {
  let inspected = 0;
  const assertions: string[] = [];
  const mock = mockFetch((call) => {
    if (call.url === TOKEN_URL) {
      assertions.push(new URLSearchParams(call.body).get("assertion") ?? "");
      return json({ access_token: ACCESS, expires_in: 3600, token_type: "Bearer" });
    }
    if (call.headers.authorization !== `Bearer ${ACCESS}`) return json({ error: { code: 401 } }, 401);
    if (call.url === INSPECT_URL) {
      const n = ++inspected;
      if (opts.inspect) return opts.inspect(call, n);
      const body = JSON.parse(call.body);
      return json({ inspectionResult: { indexStatusResult: { verdict: n === 2 ? "NEUTRAL" : "PASS", coverageState: n === 2 ? "Discovered - currently not indexed" : "Submitted and indexed", lastCrawlTime: "2026-09-27T01:00:00Z", googleCanonical: body.inspectionUrl } } });
    }
    if (call.url.endsWith("/searchAnalytics/query")) {
      if (opts.performance) return opts.performance(call);
      return json({ rows: [{ keys: ["berapa harga padel depok", "https://padel.example/id/rates"], clicks: 4, impressions: 120, ctr: 0.03, position: 6.2 }, { keys: ["padel depok", "https://padel.example/"], clicks: 10, impressions: 90, ctr: 0.11, position: 3 }] });
    }
    if (call.url.includes("/sitemaps")) return call.method === "PUT" ? new Response(null, { status: 204 }) : json({ sitemap: [{ path: "https://padel.example/sitemap.xml", lastSubmitted: "2026-09-20" }] });
    return new Response("unexpected", { status: 599 });
  });
  return { ...mock, assertions };
}

describe("service account and JWT", () => {
  test("loads the service account from base64, raw JSON or a path", async () => {
    const r = new Redactor({});
    expect((await loadServiceAccount(saB64, project.dir, r)).client_email).toBe("seo-bot@jal-test.iam.gserviceaccount.com");
    expect((await loadServiceAccount(saJson, project.dir, r)).token_uri).toBe(TOKEN_URL);
    await writeFile(join(project.dir, "sa.json"), saJson);
    expect((await loadServiceAccount("sa.json", project.dir, r)).private_key).toBe(privatePem);
  });

  test("signs an RS256 JWT with WebCrypto that verifies against the public key", async () => {
    const sa = await loadServiceAccount(saB64, project.dir, new Redactor({}));
    const jwt = await signJwt(sa, "https://www.googleapis.com/auth/webmasters.readonly", 1790000000);
    const [h, c, s] = jwt.split(".");
    expect(JSON.parse(new TextDecoder().decode(fromB64url(h)))).toEqual({ alg: "RS256", typ: "JWT" });
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(c)));
    expect(claims).toEqual({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: TOKEN_URL, iat: 1790000000, exp: 1790003600 });
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, fromB64url(s), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
  });
});

describe("gsc.ts inspect", () => {
  test("inspects the key URLs with a bearer token and lists the not-indexed ones", async () => {
    const { fetchImpl, calls, assertions } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["inspect"], c.deps)).toBe(0);
    expect(calls[0].url).toBe(TOKEN_URL);
    expect(assertions[0].split(".")).toHaveLength(3);
    const inspects = calls.filter((x) => x.url === INSPECT_URL).map((x) => JSON.parse(x.body));
    expect(inspects.map((b) => b.inspectionUrl)).toEqual(["https://padel.example/", "https://padel.example/rates", "https://padel.example/about", "https://padel.example/contact"]);
    expect(inspects[0]).toEqual({ inspectionUrl: "https://padel.example/", siteUrl: "sc-domain:padel.example", languageCode: "en" });
    const out = JSON.parse(c.out());
    expect(out.results[1].coverageState).toBe("Discovered - currently not indexed");
    expect(out.requestIndexing).toEqual(["https://padel.example/rates"]);
  });

  test("is quota-aware: paces by QPM and caps at QPD", async () => {
    const { fetchImpl, calls } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["inspect", "--qpm", "2", "--qpd", "3"], c.deps)).toBe(2);
    expect(calls.filter((x) => x.url === INSPECT_URL)).toHaveLength(3);
    expect(c.sleeps).toEqual([30000, 30000]);
    const out = JSON.parse(c.out());
    expect(out.status).toBe("partial-quota");
    expect(out.deferred).toEqual(["https://padel.example/contact"]);
  });

  test("a persistent 429 stops the run and defers the rest after backoff", async () => {
    const { fetchImpl } = gscMock({ inspect: (_c, n) => (n === 1 ? json({ inspectionResult: { indexStatusResult: { verdict: "PASS" } } }) : json({ error: { code: 429, status: "RESOURCE_EXHAUSTED" } }, 429)) });
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["inspect"], c.deps)).toBe(2);
    const out = JSON.parse(c.out());
    expect(out.status).toBe("quota-exceeded");
    expect(out.results).toHaveLength(1);
    expect(out.deferred).toHaveLength(3);
    expect(c.sleeps.filter((ms) => ms !== Math.ceil(60000 / 600))).toEqual([500, 1000, 2000]);
  });

  test("the private key, the JWT and the access token never appear in output or errors", async () => {
    const { fetchImpl } = gscMock({ inspect: (call) => new Response(`denied for ${call.headers.authorization}`, { status: 403 }) });
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["inspect"], c.deps)).toBe(1);
    const all = c.all();
    expect(all).toContain("403");
    expect(all).not.toContain(ACCESS);
    expect(all).not.toContain(saB64);
    expect(all).not.toContain("MII");
  });

  test("refuses inspection URLs outside the property", async () => {
    const { fetchImpl, calls } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["inspect", "--urls", "https://evil.example/"], c.deps)).toBe(1);
    expect(calls).toHaveLength(0);
  });
});

describe("gsc.ts sitemap", () => {
  test("submit is a dry run unless --send", async () => {
    const { fetchImpl, calls } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["sitemap", "submit", "--sitemap", "https://padel.example/sitemap.xml"], c.deps)).toBe(0);
    expect(calls).toHaveLength(0);
    expect(JSON.parse(c.out()).mode).toBe("dry-run");
  });

  test("submit with --send uses the write scope and PUTs the sitemap", async () => {
    const { fetchImpl, calls, assertions } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["sitemap", "submit", "--sitemap", "https://padel.example/sitemap.xml", "--send"], c.deps)).toBe(0);
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(assertions[0].split(".")[1])));
    expect(claims.scope).toBe("https://www.googleapis.com/auth/webmasters");
    const put = calls.find((x) => x.method === "PUT")!;
    expect(put.url).toBe(`${WEBMASTERS_BASE}/sites/${encodeURIComponent("sc-domain:padel.example")}/sitemaps/${encodeURIComponent("https://padel.example/sitemap.xml")}`);
  });

  test("list reads the submitted sitemaps", async () => {
    const { fetchImpl } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["sitemap", "list"], c.deps)).toBe(0);
    expect(JSON.parse(c.out()).sitemaps).toHaveLength(1);
  });
});

describe("gsc.ts performance", () => {
  test("queries the last 28 days and lists question-shaped queries", async () => {
    const { fetchImpl, calls } = gscMock();
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["performance"], c.deps)).toBe(0);
    const body = JSON.parse(calls.find((x) => x.url.endsWith("/searchAnalytics/query"))!.body);
    expect(body).toEqual({ startDate: "2026-09-01", endDate: "2026-09-29", dimensions: ["query", "page"], rowLimit: 1000 });
    expect(JSON.parse(c.out()).questionQueries).toEqual(["berapa harga padel depok"]);
  });

  test("reports an exhausted load quota instead of crashing", async () => {
    const { fetchImpl } = gscMock({ performance: () => json({ error: { code: 429 } }, 429) });
    const c = capture({ fetchImpl, cwd: project.dir, env: { GSC_SERVICE_ACCOUNT_JSON: saB64 } });
    expect(await main(["performance"], c.deps)).toBe(2);
    expect(JSON.parse(c.out()).status).toBe("quota-exceeded");
  });
});
