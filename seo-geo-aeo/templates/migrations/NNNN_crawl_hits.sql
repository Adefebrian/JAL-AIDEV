-- NNNN_crawl_hits.sql
-- Crawler log: one row per (day in the site timezone, bot token, bucketed path).
-- Written by apps/api/src/modules/crawl (upsert on each apps/web flush), read by
-- GET /admin/crawl/summary. Additive: it only creates a table. Rename NNNN to the
-- next free number in migrations/ (tools/migrate.ts orders files by name).

-- up
CREATE TABLE IF NOT EXISTS crawl_hits (
  day         DATE        NOT NULL,
  bot         TEXT        NOT NULL,
  path        TEXT        NOT NULL,
  hits        INTEGER     NOT NULL DEFAULT 0,
  last_status SMALLINT    NOT NULL,
  last_seen   TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (day, bot, path)
);

-- down
DROP TABLE IF EXISTS crawl_hits;
