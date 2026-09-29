// apps/web/src/admin/index.tsx - the admin entrypoint (built separately, so
// the public bundle never carries it). Served at /admin/crawl as a noindex
// shell (dist/admin.html). Reads apps/api GET /admin/crawl/summary through
// the typed Hono client; the token stays in memory, never in storage or a URL.
import { createRoot } from "react-dom/client";
import { AppShell } from "@__APP_NAME__/ui";
import { api } from "../client";
import { CrawlerLog, type CrawlSummary } from "./CrawlerLog";
import "./admin.css";

async function load(days: number, token: string): Promise<CrawlSummary> {
  const res = await api.admin.crawl.summary.$get({ query: { days: String(days) } }, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const status: number = res.status;
    throw new Error(status === 401 ? "The admin token was not accepted." : `The crawler log answered ${status}.`);
  }
  return (await res.json()) as CrawlSummary;
}

const root = document.getElementById("root");
if (!root) throw new Error("#root element not found");

createRoot(root).render(
  <AppShell
    title="Admin"
    destinations={[
      { id: "bots", label: "Crawlers", href: "#bots" },
      { id: "pages", label: "Pages", href: "#pages" },
      { id: "site", label: "Site", href: "/" },
    ]}
    current="bots"
  >
    <CrawlerLog load={load} />
  </AppShell>,
);
