// Business logic for the crawler log: validate an ingest batch from
// apps/web, upsert it, and summarize a range for the admin view.
// Framework-agnostic: nothing here touches Hono.
import type { CrawlRepo, CrawlRow } from "./repo";

export const MAX_ROWS = 1_000;
export const MAX_DAYS = 90;
export const SUMMARY_LIMIT = 5_000;

export type Validation = { ok: true; rows: CrawlRow[] } | { ok: false; error: string };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOT_RE = /^[A-Za-z0-9-]{2,64}$/;

function validRow(r: unknown): r is CrawlRow {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.day === "string" &&
    DAY_RE.test(x.day) &&
    typeof x.bot === "string" &&
    BOT_RE.test(x.bot) &&
    typeof x.path === "string" &&
    x.path.length > 0 &&
    x.path.length <= 512 &&
    (x.path.startsWith("/") || x.path.startsWith("(")) &&
    Number.isInteger(x.hits) &&
    (x.hits as number) > 0 &&
    (x.hits as number) <= 1_000_000 &&
    Number.isInteger(x.lastStatus) &&
    (x.lastStatus as number) >= 100 &&
    (x.lastStatus as number) <= 599 &&
    typeof x.lastSeen === "string" &&
    !Number.isNaN(Date.parse(x.lastSeen))
  );
}

export interface CrawlService {
  validate(body: unknown): Validation;
  ingest(rows: CrawlRow[]): Promise<void>;
  summary(days: number): Promise<{ since: string; days: number; rows: CrawlRow[] }>;
}

export interface CrawlServiceDeps {
  repo: CrawlRepo;
  now?: () => Date;
}

export function createCrawlService({ repo, now = () => new Date() }: CrawlServiceDeps): CrawlService {
  return {
    validate(body) {
      const rows = (body as { rows?: unknown } | null)?.rows;
      if (!Array.isArray(rows)) return { ok: false, error: "rows must be an array" };
      if (rows.length > MAX_ROWS) return { ok: false, error: `at most ${MAX_ROWS} rows per batch` };
      const bad = rows.findIndex((r) => !validRow(r));
      if (bad !== -1) return { ok: false, error: `row ${bad} is invalid` };
      return { ok: true, rows: rows as CrawlRow[] };
    },
    async ingest(rows) {
      await repo.upsert(rows);
    },
    async summary(days) {
      const d = Math.min(Math.max(Math.trunc(days) || 14, 1), MAX_DAYS);
      const since = new Date(now().getTime() - (d - 1) * 86_400_000).toISOString().slice(0, 10);
      return { since, days: d, rows: await repo.since(since, SUMMARY_LIMIT) };
    },
  };
}
