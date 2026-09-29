// apps/web/server/lib/crawlers.ts - the crawler log's counter in the web
// process (standard.md GEO-10, integrate.md "the crawler log placement").
//
// Counts crawler hits in memory per (day in the site timezone, bot, bucketed
// path). Every 60 seconds, and on SIGTERM, the batch is POSTed to
// apps/api `POST /internal/crawl/hits` with `Authorization: Bearer
// $CRAWL_INGEST_TOKEN` and a short timeout. A failed flush keeps the counts
// for the next flush (no retry storm) and never blocks or fails a request.
// No ingest URL or token configured: counts stay in memory, capped.
import { bucketPath, dayIn, identifyBot } from "./crawlerIdentity";

export interface CrawlRow {
  day: string;
  bot: string;
  path: string;
  hits: number;
  lastStatus: number;
  lastSeen: string; // ISO timestamp
}

export interface CrawlerLogOptions {
  timezone: string;
  /** Live pages and discovery files, logged by path; the rest is bucketed. */
  knownPaths: ReadonlySet<string>;
  /** e.g. http://api:3001/internal/crawl/hits */
  ingestUrl?: string;
  ingestToken?: string;
  fetchImpl?: typeof fetch;
  flushMs?: number;
  timeoutMs?: number;
  /** Distinct (day, bot, path) keys kept in memory at most. */
  maxKeys?: number;
  now?: () => Date;
  log?: (msg: string) => void;
}

export const FLUSH_MS = 60_000;
export const MAX_ROWS_PER_POST = 1_000;

export function createCrawlerLog(opts: CrawlerLogOptions) {
  const counts = new Map<string, CrawlRow>();
  const now = opts.now ?? (() => new Date());
  const log = opts.log ?? console.warn;
  const maxKeys = opts.maxKeys ?? 20_000;
  let dropped = 0;
  let flushing: Promise<unknown> | null = null;

  function add(row: CrawlRow) {
    const key = `${row.day}\u0000${row.bot}\u0000${row.path}`;
    const prev = counts.get(key);
    if (prev) {
      prev.hits += row.hits;
      if (row.lastSeen >= prev.lastSeen) {
        prev.lastSeen = row.lastSeen;
        prev.lastStatus = row.lastStatus;
      }
      return;
    }
    if (counts.size >= maxKeys) {
      dropped += 1;
      return;
    }
    counts.set(key, { ...row });
  }

  /** Called after every response. Cheap, synchronous, never throws. */
  function record(userAgent: string | undefined | null, path: string, status: number): void {
    try {
      const bot = identifyBot(userAgent);
      if (!bot) return;
      const at = now();
      add({ day: dayIn(at, opts.timezone), bot, path: bucketPath(path, opts.knownPaths), hits: 1, lastStatus: status, lastSeen: at.toISOString() });
    } catch {
      // Logging must never break a response.
    }
  }

  function pending(): CrawlRow[] {
    return [...counts.values()].map((r) => ({ ...r }));
  }

  async function doFlush(): Promise<{ sent: number; kept: number }> {
    if (counts.size === 0) return { sent: 0, kept: 0 };
    if (!opts.ingestUrl || !opts.ingestToken) return { sent: 0, kept: counts.size };
    const batch = pending();
    counts.clear();
    const fetchImpl = opts.fetchImpl ?? fetch;
    let sent = 0;
    for (let i = 0; i < batch.length; i += MAX_ROWS_PER_POST) {
      const rows = batch.slice(i, i + MAX_ROWS_PER_POST);
      try {
        const res = await fetchImpl(opts.ingestUrl, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${opts.ingestToken}` },
          body: JSON.stringify({ rows }),
          signal: AbortSignal.timeout(opts.timeoutMs ?? 5_000),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        sent += rows.length;
      } catch (err) {
        // Keep the counts for the next flush; say why without echoing the token.
        for (const r of rows) add(r);
        log(`crawlers: flush kept ${rows.length} row(s) (${err instanceof Error ? err.message : "error"})`);
      }
    }
    if (dropped > 0) {
      log(`crawlers: ${dropped} hit(s) dropped at the ${maxKeys}-key cap`);
      dropped = 0;
    }
    return { sent, kept: counts.size };
  }

  /** One flush at a time; a second call waits for the running one. */
  function flush(): Promise<{ sent: number; kept: number }> {
    const run = (flushing ?? Promise.resolve()).then(doFlush);
    flushing = run.finally(() => {
      if (flushing === run) flushing = null;
    });
    return run;
  }

  /** Starts the periodic flush; returns a stop function. unref'd, so it never holds the process. */
  function start(): () => void {
    const timer = setInterval(() => void flush().catch(() => undefined), opts.flushMs ?? FLUSH_MS);
    (timer as { unref?: () => void }).unref?.();
    return () => clearInterval(timer);
  }

  /** A SIGTERM handler: flush what is counted, then exit. Bounded by the POST timeout. */
  function onSigterm(exit: (code: number) => void = (code) => process.exit(code)) {
    return async () => {
      try {
        await flush();
      } finally {
        exit(0);
      }
    };
  }

  return { record, pending, flush, start, onSigterm };
}

export type CrawlerLog = ReturnType<typeof createCrawlerLog>;
