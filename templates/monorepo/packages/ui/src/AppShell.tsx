// JAL Core app-shell. Every screen renders inside it, so mobile is always a
// real app-shell and never a shrunk desktop page:
//   below 640px   pinned header, content, bottom tab bar of 3 to 5
//                 destinations (icon over label, 44px+ targets)
//   640px and up  the same destinations move into the header row as top nav
//
// Two scroll modes, picked with the `scroll` prop:
//   "document"   (default) the document scrolls. The header row is
//                position: sticky at top 0; below 640px the tab bar is
//                position: fixed at bottom 0 with safe-area padding, and the
//                shell reserves the bar height (--shell-nav-h) as bottom
//                padding so no content hides under it. Use it for marketing,
//                landing, and immersive pages: GSAP ScrollTrigger, Lenis,
//                ScrollTrigger pins, iOS address-bar collapse, scroll
//                restoration, and anchor links all assume document scroll and
//                work here with zero wiring.
//   "contained"  a grid sized to the viewport; the document never scrolls and
//                main.shell-main is the scroller (marked data-jal-scroller).
//                Use it for dense product screens (tables, editors, split
//                panes) that want a fixed frame. Motion code on a contained
//                shell must target that scroller: call
//                ScrollTrigger.defaults({ scroller: getScroller() }) once
//                before creating any trigger, and pass the same element as
//                the IntersectionObserver root, or every reveal stays hidden.
//
// Styles live in ui.css (.shell*, keyed on data-scroll). Icons come from
// koboyo through <Icon>; a destination may be label-only.
import type { ReactNode } from "react";

export type AppShellScroll = "document" | "contained";

export interface AppShellDestination {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface AppShellProps {
  title: string;
  destinations: AppShellDestination[];
  current: string;
  actions?: ReactNode;
  /** Who scrolls: the document (default) or the shell's main region. */
  scroll?: AppShellScroll;
  children: ReactNode;
}

export function AppShell({ title, destinations, current, actions, scroll = "document", children }: AppShellProps) {
  const contained = scroll === "contained";
  return (
    <div className="shell" data-scroll={scroll}>
      <header className="shell-header">
        <p className="shell-title">{title}</p>
      </header>
      <div className="shell-actions">{actions}</div>
      <main className="shell-main" data-jal-scroller={contained ? "" : undefined}>
        {children}
      </main>
      <nav className="shell-nav" aria-label="Primary">
        {destinations.map((d) => (
          <a
            key={d.id}
            href={d.href}
            className="shell-nav-item"
            aria-current={d.id === current ? "page" : undefined}
          >
            {d.icon ? <span className="shell-nav-icon">{d.icon}</span> : null}
            <span className="shell-nav-label">{d.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

/**
 * The element that scrolls `el`, for ScrollTrigger's `scroller` and an
 * IntersectionObserver `root`. Walks up from `el` (inclusive) and returns
 * the first element that is a declared scroller (a contained shell's main, which
 * counts even before its content overflows) or that has overflow-y auto or
 * scroll and scrollHeight > clientHeight. A horizontal carousel (overflow-x
 * auto or scroll) with under 2px of vertical spill is skipped. Falls back to window, which is the
 * answer for a document-mode shell. Without `el` it returns the page's
 * declared scroller, else window. Browser only: call it in an effect.
 *
 * On a contained shell, call once after mount (inside useGSAP or
 * useLayoutEffect, never at module top level) before creating any trigger:
 *   ScrollTrigger.defaults({ scroller: getScroller() });
 *   new IntersectionObserver(cb, { root: scrollerRoot(getScroller()) });
 */
export function getScroller(el?: Element | null): Element | Window {
  if (!el) {
    const declared = document.querySelector("[data-jal-scroller]");
    return declared ?? window;
  }
  for (let node: Element | null = el; node; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) break;
    if (node.hasAttribute("data-jal-scroller")) return node;
    const { overflowX, overflowY } = getComputedStyle(node);
    const spill = node.scrollHeight - node.clientHeight;
    // A horizontal carousel (overflow-x auto or scroll) computes overflow-y to
    // auto too, and often spills a pixel of rounding vertically. That is not a
    // vertical scroller; skip it unless it truly overflows by 2px or more.
    if ((overflowX === "auto" || overflowX === "scroll") && spill < 2) continue;
    if ((overflowY === "auto" || overflowY === "scroll") && spill > 0) return node;
  }
  return window;
}

/** IntersectionObserver wants null for the viewport, not window. */
export function scrollerRoot(scroller: Element | Window): Element | null {
  return scroller instanceof Element ? scroller : null;
}
