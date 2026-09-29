// Exercises the crawl module in isolation via app.request, with a fake DbPort.
// No Postgres needed: the module only ever sees the port. Covers the ingest
// token check, the row cap, validation, the upsert parameters and the
// summary shape.
import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { bearerMatches, createCrawlModule } from "./index";
import type { DbPort } from "./ports";
import { SUMMARY_SQL, UPSERT_SQL } from "./repo";
import { MAX_ROWS } from "./service";

const INGEST = "ingest-token-for-tests";
const ADMIN = "admin-token-for-tests";

function fakeDb() {
  const calls: { sql: string; params: unknown[] }[] = [];
  const db: DbPort = {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      calls.push({ sql, params });
      if (sql === SUMMARY_SQL) {
        return [{ day: "2026-09-29", bot: "ClaudeBot", path: "/rates", hits: 3, last_status: 200, last_seen: new Date("2026-09-29T04:00:00Z") }] as T[];
      }
      return [];
    },
  };
  return { db, calls };
}

function build() {
  const { db, calls } = fakeDb();
  const app = new Hono().route(
    "/",
    createCrawlModule({
      db,
      ingestToken: () => INGEST,
      authorizeAdmin: (c) => bearerMatches(c.req.header("authorization"), ADMIN),
      now: () => new Date("2026-09-29T12:00:00Z"),
    }),
  );
  return { app, calls };
}

const row = { day: "2026-09-29", bot: "OAI-SearchBot", path: "/rates", hits: 2, lastStatus: 200, lastSeen: "2026-09-29T03:00:00.000Z" };
const post = (app: Hono, body: unknown, token = INGEST) =>
  app.request("/internal/crawl/hits", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

describe("crawl module", () => {
  test("ingest rejects a missing or wrong token", async () => {
    const { app, calls } = build();
    expect((await post(app, { rows: [row] }, "wrong")).status).toBe(401);
    expect((await app.request("/internal/crawl/hits", { method: "POST", body: "{}" })).status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  test("an unset ingest token rejects everything", () => {
    expect(bearerMatches("Bearer anything", undefined)).toBe(false);
    expect(bearerMatches("Bearer ", "")).toBe(false);
    expect(bearerMatches(`Bearer ${INGEST}`, INGEST)).toBe(true);
  });

  test("ingest upserts a valid batch with one parameterized query", async () => {
    const { app, calls } = build();
    const res = await post(app, { rows: [row, { ...row, bot: "GPTBot" }] });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ accepted: 2 });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toBe(UPSERT_SQL);
    expect(calls[0]!.params).toEqual([
      ["2026-09-29", "2026-09-29"],
      ["OAI-SearchBot", "GPTBot"],
      ["/rates", "/rates"],
      [2, 2],
      [200, 200],
      [row.lastSeen, row.lastSeen],
    ]);
  });

  test("ingest caps the batch size and validates every row", async () => {
    const { app, calls } = build();
    expect((await post(app, { rows: Array.from({ length: MAX_ROWS + 1 }, () => row) })).status).toBe(400);
    expect((await post(app, { rows: [{ ...row, day: "yesterday" }] })).status).toBe(400);
    expect((await post(app, { rows: [{ ...row, bot: "Robert'); DROP TABLE" }] })).status).toBe(400);
    expect((await post(app, { rows: [{ ...row, hits: 0 }] })).status).toBe(400);
    expect((await post(app, { nope: true })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  test("the summary needs admin auth and is noindex, no-store", async () => {
    const { app } = build();
    const res = await app.request("/admin/crawl/summary?days=14");
    expect(res.status).toBe(401);
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
  });

  test("the summary returns rows per day, bot and page", async () => {
    const { app, calls } = build();
    const res = await app.request("/admin/crawl/summary?days=7", { headers: { authorization: `Bearer ${ADMIN}` } });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      since: "2026-09-23",
      days: 7,
      rows: [{ day: "2026-09-29", bot: "ClaudeBot", path: "/rates", hits: 3, lastStatus: 200, lastSeen: "2026-09-29T04:00:00.000Z" }],
    });
    expect(calls[0]!.params).toEqual(["2026-09-23", 5000]);
  });

  test("days is clamped to 1..90", async () => {
    const { app } = build();
    const res = await app.request("/admin/crawl/summary?days=9999", { headers: { authorization: `Bearer ${ADMIN}` } });
    expect(((await res.json()) as { days: number }).days).toBe(90);
  });
});
