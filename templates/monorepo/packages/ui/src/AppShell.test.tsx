import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, type ReactElement } from "react";
import { AppShell, getScroller, scrollerRoot, type AppShellScroll } from "./AppShell";
import { clientRenderer, staticRenderer } from "./frames/test-render";

const destinations = [
  { id: "home", label: "Home", href: "/" },
  { id: "work", label: "Work", href: "/work" },
  { id: "about", label: "About", href: "/about" },
];

function shell(scroll?: AppShellScroll): ReactElement {
  return (
    <AppShell title="Demo" destinations={destinations} current="home" scroll={scroll}>
      <section id="content">Content</section>
    </AppShell>
  );
}

describe.skipIf(staticRenderer === null)("AppShell markup", () => {
  test("defaults to document scroll", () => {
    const html = staticRenderer!.renderToStaticMarkup(shell());
    expect(html).toContain('data-scroll="document"');
    expect(html).not.toContain("data-jal-scroller");
  });

  test("document mode renders header, main, and a labelled nav", () => {
    const html = staticRenderer!.renderToStaticMarkup(shell("document"));
    expect(html).toContain('<header class="shell-header">');
    expect(html).toContain('<main class="shell-main">');
    expect(html).toContain('<nav class="shell-nav" aria-label="Primary">');
    expect(html).toContain('aria-current="page"');
  });

  test("contained mode marks main as the declared scroller", () => {
    const html = staticRenderer!.renderToStaticMarkup(shell("contained"));
    expect(html).toContain('data-scroll="contained"');
    expect(html).toContain('<main class="shell-main" data-jal-scroller="">');
    expect(html).toContain('aria-label="Primary"');
  });
});

describe("AppShell CSS", () => {
  const css = readFileSync(join(import.meta.dir, "ui.css"), "utf8");

  test("document mode pins the header sticky and the tab bar fixed, reserving its height", () => {
    expect(css).toMatch(/\.shell-header,\s*\.shell-actions\s*\{[^}]*position: sticky;[^}]*top: 0;/);
    expect(css).toMatch(/\.shell-nav\s*\{[^}]*position: fixed;[^}]*bottom: 0;[^}]*padding-bottom: env\(safe-area-inset-bottom\);/);
    expect(css).toMatch(/\.shell\s*\{[^}]*--shell-nav-h:[^}]*padding-bottom: calc\(var\(--shell-nav-h\) \+ env\(safe-area-inset-bottom\)\);/);
  });

  test("contained mode keeps the viewport grid with an inner scroller", () => {
    expect(css).toMatch(/\.shell\[data-scroll="contained"\]\s*\{[^}]*height: 100dvh;/);
    expect(css).toMatch(/\.shell\[data-scroll="contained"\] > \.shell-main\s*\{[^}]*overflow-y: auto;/);
  });

  test("the shell block has no gradient, shadow, or glow", () => {
    const start = css.indexOf("/* App-shell");
    const block = css.slice(start, css.indexOf("/* =====", start));
    expect(block).not.toMatch(/gradient|box-shadow|text-shadow|drop-shadow|glow/);
  });
});

// Live DOM path. Runs when happy-dom is registered (bun test from the
// template root preloads it); skips under a bare packages/ui run.
describe.skipIf(clientRenderer === null)("getScroller in a DOM", () => {
  async function mount(scroll?: AppShellScroll) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = clientRenderer!.createRoot(container);
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      root.render(shell(scroll));
    });
    const cleanup = () => {
      act(() => root.unmount());
      container.remove();
    };
    return { container, cleanup };
  }

  test("document mode (the default) resolves to window", async () => {
    const { container, cleanup } = await mount();
    try {
      const content = container.querySelector("#content")!;
      expect(container.querySelector(".shell")!.getAttribute("data-scroll")).toBe("document");
      expect(container.querySelector("nav")!.getAttribute("aria-label")).toBe("Primary");
      expect(getScroller(content)).toBe(window);
      expect(getScroller()).toBe(window);
      expect(scrollerRoot(getScroller(content))).toBeNull();
    } finally {
      cleanup();
    }
  });

  test("contained mode resolves to the shell main, even before it overflows", async () => {
    const { container, cleanup } = await mount("contained");
    try {
      const main = container.querySelector("main.shell-main")!;
      const content = container.querySelector("#content")!;
      expect(getScroller(content)).toBe(main);
      expect(getScroller()).toBe(main);
      expect(scrollerRoot(getScroller(content))).toBe(main);
    } finally {
      cleanup();
    }
  });

  test("an overflowing overflow-y auto ancestor counts as the scroller", () => {
    const box = document.createElement("div");
    box.style.overflowY = "auto";
    Object.defineProperty(box, "scrollHeight", { value: 800 });
    Object.defineProperty(box, "clientHeight", { value: 200 });
    const child = document.createElement("p");
    box.appendChild(child);
    document.body.appendChild(box);
    try {
      expect(getScroller(child)).toBe(box);
    } finally {
      box.remove();
    }
  });
});
