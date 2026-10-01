// One scroll source for scrub mode, on the page's one clock.
//
// With the motion module (packages/motion), pass its Lenis instance
// (`useLenis()`) as `clock`: Lenis fires "scroll" from inside gsap.ticker,
// so the scrub updates in the same frame as every ScrollTrigger and no
// second loop starts. Without it (no module, reduced motion, touch-first,
// where useLenis() is null) this listens to native scroll on the scroller
// getScroller() returned after mount, coalesced to one rAF per burst.
// Nothing runs between scroll events: there is never an idle rAF loop.

/** The part of Lenis this needs: `on` returns its own unsubscribe. */
export interface ScrollClock {
  on(event: "scroll", callback: () => void): () => void;
}

export interface FrameScheduler {
  request: (cb: () => void) => number;
  cancel: (id: number) => void;
}

const browserScheduler: FrameScheduler = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
};

/**
 * Calls `onChange` now, then on every scroll of `scroller` (or tick of the
 * clock) and on resize. Returns the unsubscribe.
 */
export function watchScroll(
  scroller: Element | Window,
  onChange: () => void,
  clock?: ScrollClock | null,
  scheduler: FrameScheduler = browserScheduler,
  win: Pick<Window, "addEventListener" | "removeEventListener"> = window,
): () => void {
  let pending: number | null = null;
  const flush = () => {
    pending = null;
    onChange();
  };
  const schedule = () => {
    if (pending === null) pending = scheduler.request(flush);
  };
  win.addEventListener("resize", schedule, { passive: true });
  let off: () => void;
  if (clock) {
    off = clock.on("scroll", onChange);
  } else {
    scroller.addEventListener("scroll", schedule, { passive: true });
    off = () => scroller.removeEventListener("scroll", schedule);
  }
  onChange();
  return () => {
    off();
    win.removeEventListener("resize", schedule);
    if (pending !== null) scheduler.cancel(pending);
    pending = null;
  };
}
