// apps/web/src/admin/CrawlerLog.tsx - the admin crawler view (GEO-10, GEO-11).
//
// Which crawler read which page, and when: per bot first, then every
// (day, bot, page) row. White-first on JAL Core tokens, records as rows, no
// shadow, no gradient, no side line, no emoji. Every control is 44px
// (--control-h via ui.css). Data comes from apps/api
// `GET /admin/crawl/summary?days=N` through the `load` prop, so this view has
// no fetch logic of its own and renders the same in a test.
import { useMemo, useState } from "react";

export interface CrawlRow {
  day: string;
  bot: string;
  path: string;
  hits: number;
  lastStatus: number;
  lastSeen: string;
}

export interface CrawlSummary {
  since: string;
  days: number;
  rows: CrawlRow[];
}

export interface CrawlerLogProps {
  load: (days: number, token: string) => Promise<CrawlSummary>;
  /** Rows to show before the first load (tests, server-provided data). */
  initial?: CrawlSummary;
}

const RANGES = [7, 14, 28] as const;
const AI_BOTS = new Set(["OAI-SearchBot", "ChatGPT-User", "GPTBot", "Claude-SearchBot", "Claude-User", "ClaudeBot", "PerplexityBot", "Perplexity-User"]);

type State = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: CrawlSummary };

export function summarizeByBot(rows: CrawlRow[]) {
  const map = new Map<string, { bot: string; hits: number; pages: Set<string>; lastSeen: string }>();
  for (const r of rows) {
    const s = map.get(r.bot) ?? { bot: r.bot, hits: 0, pages: new Set<string>(), lastSeen: "" };
    s.hits += r.hits;
    s.pages.add(r.path);
    if (r.lastSeen > s.lastSeen) s.lastSeen = r.lastSeen;
    map.set(r.bot, s);
  }
  return [...map.values()].sort((a, b) => b.hits - a.hits).map((s) => ({ ...s, pages: s.pages.size }));
}

function shortTime(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}

export function CrawlerLog({ load, initial }: CrawlerLogProps) {
  const [days, setDays] = useState<number>(initial?.days ?? 14);
  const [bot, setBot] = useState("all");
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>(initial ? { kind: "ready", data: initial } : { kind: "idle" });

  async function refresh(nextDays = days) {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", data: await load(nextDays, token) });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Could not load the crawler log." });
    }
  }

  const rows = state.kind === "ready" ? state.data.rows : [];
  const bots = useMemo(() => summarizeByBot(rows), [rows]);
  const visible = bot === "all" ? rows : rows.filter((r) => r.bot === bot);

  return (
    <div className="crawl">
      <header className="crawl-head">
        <h1>Crawler log</h1>
        <p>Which crawler read which page, per day in the site timezone. User agents are claimed, not verified.</p>
      </header>

      <form
        className="crawl-controls"
        onSubmit={(e) => {
          e.preventDefault();
          void refresh();
        }}
      >
        <div className="field">
          <label htmlFor="crawl-token">Admin token</label>
          <input id="crawl-token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="crawl-bot">Crawler</label>
          <select id="crawl-bot" value={bot} onChange={(e) => setBot(e.target.value)}>
            <option value="all">All crawlers</option>
            {bots.map((b) => (
              <option key={b.bot} value={b.bot}>
                {b.bot}
              </option>
            ))}
          </select>
        </div>
        <div className="crawl-range" role="group" aria-label="Range">
          {RANGES.map((n) => (
            <button
              key={n}
              type="button"
              className="btn btn-secondary"
              aria-pressed={days === n}
              onClick={() => {
                setDays(n);
                void refresh(n);
              }}
            >
              {`${n} days`}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-primary" aria-busy={state.kind === "loading"}>
          Load
        </button>
      </form>

      {state.kind === "error" ? (
        <p className="crawl-notice" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.kind === "idle" ? <p className="crawl-empty">Enter the admin token and load the log.</p> : null}
      {state.kind === "ready" && rows.length === 0 ? <p className="crawl-empty">No crawler hits in this range yet.</p> : null}

      {rows.length > 0 ? (
        <>
          <section id="bots" aria-labelledby="crawl-bots-h">
            <h2 id="crawl-bots-h">By crawler</h2>
            <div className="crawl-table-wrap">
              <table className="crawl-table">
                <thead>
                  <tr>
                    <th scope="col">Crawler</th>
                    <th scope="col">Hits</th>
                    <th scope="col">Pages</th>
                    <th scope="col">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((b) => (
                    <tr key={b.bot}>
                      <th scope="row">
                        {b.bot}
                        {AI_BOTS.has(b.bot) ? <span className="crawl-tag">{" AI"}</span> : null}
                      </th>
                      <td>{b.hits}</td>
                      <td>{b.pages}</td>
                      <td>{shortTime(b.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section id="pages" aria-labelledby="crawl-pages-h">
            <h2 id="crawl-pages-h">By page and day</h2>
            <div className="crawl-table-wrap">
              <table className="crawl-table">
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Crawler</th>
                    <th scope="col">Page</th>
                    <th scope="col">Hits</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={`${r.day}|${r.bot}|${r.path}`}>
                      <td>{r.day}</td>
                      <td>{r.bot}</td>
                      <td className="crawl-path">{r.path}</td>
                      <td>{r.hits}</td>
                      <td>{r.lastStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
