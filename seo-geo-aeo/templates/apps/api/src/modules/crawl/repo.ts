// Data access for the crawler log: this module's own crawl_hits table only
// (migrations/NNNN_crawl_hits.sql), through the injected DbPort. One
// parameterized upsert per batch, never string-built SQL.
import type { DbPort } from "./ports";

export interface CrawlRow {
  day: string; // YYYY-MM-DD in the site timezone
  bot: string;
  path: string;
  hits: number;
  lastStatus: number;
  lastSeen: string; // ISO timestamp
}

export interface CrawlRepo {
  upsert(rows: CrawlRow[]): Promise<void>;
  since(day: string, limit: number): Promise<CrawlRow[]>;
}

export const UPSERT_SQL = `INSERT INTO crawl_hits (day, bot, path, hits, last_status, last_seen)
SELECT * FROM unnest($1::date[], $2::text[], $3::text[], $4::int[], $5::smallint[], $6::timestamptz[])
ON CONFLICT (day, bot, path) DO UPDATE SET
  hits        = crawl_hits.hits + EXCLUDED.hits,
  last_status = EXCLUDED.last_status,
  last_seen   = GREATEST(crawl_hits.last_seen, EXCLUDED.last_seen)`;

export const SUMMARY_SQL = `SELECT to_char(day, 'YYYY-MM-DD') AS day, bot, path, hits, last_status, last_seen
FROM crawl_hits
WHERE day >= $1::date
ORDER BY day DESC, hits DESC, bot, path
LIMIT $2`;

interface SummaryRecord {
  day: string;
  bot: string;
  path: string;
  hits: number;
  last_status: number;
  last_seen: Date | string;
}

export function createCrawlRepo(db: DbPort): CrawlRepo {
  return {
    async upsert(rows) {
      if (rows.length === 0) return;
      await db.query(UPSERT_SQL, [
        rows.map((r) => r.day),
        rows.map((r) => r.bot),
        rows.map((r) => r.path),
        rows.map((r) => r.hits),
        rows.map((r) => r.lastStatus),
        rows.map((r) => r.lastSeen),
      ]);
    },
    async since(day, limit) {
      const records = await db.query<SummaryRecord>(SUMMARY_SQL, [day, limit]);
      return records.map((r) => ({
        day: r.day,
        bot: r.bot,
        path: r.path,
        hits: Number(r.hits),
        lastStatus: Number(r.last_status),
        lastSeen: r.last_seen instanceof Date ? r.last_seen.toISOString() : String(r.last_seen),
      }));
    },
  };
}
