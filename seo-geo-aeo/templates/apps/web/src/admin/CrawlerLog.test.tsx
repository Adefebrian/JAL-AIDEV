// apps/web/src/admin/CrawlerLog.test.tsx - the admin crawler view in happy-dom.
import { describe, expect, test } from "bun:test";
import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { CrawlerLog, summarizeByBot, type CrawlSummary } from "./CrawlerLog";

// Tell React this environment drives act() itself (happy-dom, not a browser).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const data: CrawlSummary = {
  since: "2026-09-16",
  days: 14,
  rows: [
    { day: "2026-09-29", bot: "ClaudeBot", path: "/rates", hits: 3, lastStatus: 200, lastSeen: "2026-09-29T04:00:00.000Z" },
    { day: "2026-09-28", bot: "ClaudeBot", path: "/", hits: 2, lastStatus: 200, lastSeen: "2026-09-28T04:00:00.000Z" },
    { day: "2026-09-29", bot: "bingbot", path: "/", hits: 9, lastStatus: 200, lastSeen: "2026-09-29T05:00:00.000Z" },
  ],
};

async function mount(el: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(el));
  return {
    container,
    done: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe("<CrawlerLog />", () => {
  test("summarizes hits and pages per crawler", () => {
    expect(summarizeByBot(data.rows).map((b) => [b.bot, b.hits, b.pages])).toEqual([
      ["bingbot", 9, 1],
      ["ClaudeBot", 5, 2],
    ]);
  });

  test("renders records as rows, per crawler and per page and day", async () => {
    const { container, done } = await mount(<CrawlerLog load={async () => data} initial={data} />);
    expect(container.querySelectorAll("#bots tbody tr")).toHaveLength(2);
    expect(container.querySelectorAll("#pages tbody tr")).toHaveLength(3);
    await done();
  });

  test("controls are real form controls with labels", async () => {
    const { container, done } = await mount(<CrawlerLog load={async () => data} initial={data} />);
    expect(container.querySelector('label[for="crawl-token"]')).toBeTruthy();
    expect(container.querySelector('input#crawl-token[type="password"]')).toBeTruthy();
    expect(container.querySelector("select#crawl-bot")).toBeTruthy();
    expect(container.querySelectorAll(".crawl-range .btn")).toHaveLength(3);
    await done();
  });

  test("shows an error state when the load fails", async () => {
    const { container, done } = await mount(
      <CrawlerLog
        load={async () => {
          throw new Error("The admin token was not accepted.");
        }}
      />,
    );
    const form = container.querySelector("form")!;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("The admin token was not accepted.");
    await done();
  });

  test("never renders a U+2014 dash", async () => {
    const { container, done } = await mount(<CrawlerLog load={async () => data} initial={data} />);
    expect(container.textContent ?? "").not.toContain(String.fromCharCode(0x2014));
    await done();
  });
});
