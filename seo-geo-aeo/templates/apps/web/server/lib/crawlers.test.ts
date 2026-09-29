// apps/web/server/lib/crawlers.test.ts - the in-memory counter, the flush to
// apps/api, the kept counts on failure, the SIGTERM flush. Mocked fetch only.
import { describe, expect, mock, test } from "bun:test";
import { createCrawlerLog } from "./crawlers";

const BOT = "Mozilla/5.0 (compatible; OAI-SearchBot/1.0)";
const PERSON = "Mozilla/5.0 (Macintosh) Safari/605.1.15";
const at = new Date("2026-09-29T03:00:00Z");

function setup(fetchImpl?: typeof fetch, ingest = true) {
  return createCrawlerLog({
    timezone: "Asia/Jakarta",
    knownPaths: new Set(["/", "/rates"]),
    ingestUrl: ingest ? "http://api.test/internal/crawl/hits" : undefined,
    ingestToken: ingest ? "test-ingest-token" : undefined,
    fetchImpl,
    now: () => at,
    log: () => {},
  });
}

describe("crawler log", () => {
  test("counts crawlers only, per day, bot and bucketed path", () => {
    const log = setup();
    log.record(BOT, "/rates", 200);
    log.record(BOT, "/rates", 200);
    log.record(BOT, "/wp-admin", 404);
    log.record(PERSON, "/rates", 200);
    const rows = log.pending().sort((a, b) => a.path.localeCompare(b.path));
    expect(rows).toEqual([
      { day: "2026-09-29", bot: "OAI-SearchBot", path: "(other)", hits: 1, lastStatus: 404, lastSeen: at.toISOString() },
      { day: "2026-09-29", bot: "OAI-SearchBot", path: "/rates", hits: 2, lastStatus: 200, lastSeen: at.toISOString() },
    ]);
  });

  test("flush posts the batch with the bearer token and clears it", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = mock(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init! });
      return new Response(JSON.stringify({ accepted: 1 }), { status: 202 });
    }) as unknown as typeof fetch;
    const log = setup(fetchImpl);
    log.record(BOT, "/", 200);
    expect(await log.flush()).toEqual({ sent: 1, kept: 0 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("http://api.test/internal/crawl/hits");
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe("Bearer test-ingest-token");
    expect(JSON.parse(String(calls[0]!.init.body)).rows[0].path).toBe("/");
    expect(calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
    expect(log.pending()).toEqual([]);
  });

  test("a failed flush keeps the counts for the next one", async () => {
    let fail = true;
    const fetchImpl = (async () => (fail ? new Response("", { status: 503 }) : new Response("", { status: 202 }))) as unknown as typeof fetch;
    const log = setup(fetchImpl);
    log.record(BOT, "/", 200);
    expect(await log.flush()).toEqual({ sent: 0, kept: 1 });
    log.record(BOT, "/", 200);
    expect(log.pending()[0]!.hits).toBe(2);
    fail = false;
    expect(await log.flush()).toEqual({ sent: 1, kept: 0 });
  });

  test("a network error never throws out of flush", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("connection refused");
    }) as unknown as typeof fetch;
    const log = setup(fetchImpl);
    log.record(BOT, "/", 200);
    expect(await log.flush()).toEqual({ sent: 0, kept: 1 });
  });

  test("without an ingest URL and token the counts stay in memory", async () => {
    const fetchImpl = mock(async () => new Response("")) as unknown as typeof fetch;
    const log = setup(fetchImpl, false);
    log.record(BOT, "/", 200);
    expect(await log.flush()).toEqual({ sent: 0, kept: 1 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test("the SIGTERM handler flushes, then exits 0", async () => {
    const fetchImpl = (async () => new Response("", { status: 202 })) as unknown as typeof fetch;
    const log = setup(fetchImpl);
    log.record(BOT, "/", 200);
    const exits: number[] = [];
    await log.onSigterm((code) => exits.push(code))();
    expect(exits).toEqual([0]);
    expect(log.pending()).toEqual([]);
  });

  test("start() flushes on its interval and returns a stop function", async () => {
    let posts = 0;
    const fetchImpl = (async () => {
      posts += 1;
      return new Response("", { status: 202 });
    }) as unknown as typeof fetch;
    const log = createCrawlerLog({
      timezone: "UTC",
      knownPaths: new Set(["/"]),
      ingestUrl: "http://api.test/internal/crawl/hits",
      ingestToken: "t",
      fetchImpl,
      flushMs: 10,
      log: () => {},
    });
    log.record(BOT, "/", 200);
    const stop = log.start();
    await new Promise((r) => setTimeout(r, 40));
    stop();
    expect(posts).toBe(1);
  });
});
