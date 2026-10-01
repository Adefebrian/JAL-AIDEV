// watchScroll with fakes: the native path coalesces a burst of scroll
// events into one frame, the Lenis path rides the clock, and both clean up.
import { describe, expect, test } from "bun:test";
import { watchScroll, type FrameScheduler, type ScrollClock } from "./scroll";

function fakeTarget() {
  const listeners = new Map<string, Set<() => void>>();
  return {
    listeners,
    addEventListener: (t: string, cb: () => void) => void (listeners.get(t) ?? listeners.set(t, new Set()).get(t)!).add(cb),
    removeEventListener: (t: string, cb: () => void) => void listeners.get(t)?.delete(cb),
    fire: (t: string) => [...(listeners.get(t) ?? [])].forEach((cb) => cb()),
    count: (t: string) => listeners.get(t)?.size ?? 0,
  };
}

function fakeScheduler() {
  let next = 1;
  const queued = new Map<number, () => void>();
  const s: FrameScheduler & { flush: () => void; size: () => number } = {
    request: (cb) => {
      queued.set(next, cb);
      return next++;
    },
    cancel: (id) => void queued.delete(id),
    flush: () => {
      const cbs = [...queued.values()];
      queued.clear();
      cbs.forEach((cb) => cb());
    },
    size: () => queued.size,
  };
  return s;
}

describe("watchScroll", () => {
  test("native scroll: runs once now, then once per frame for a burst", () => {
    const scroller = fakeTarget();
    const win = fakeTarget();
    const sched = fakeScheduler();
    let calls = 0;
    const off = watchScroll(scroller as unknown as Element, () => calls++, null, sched, win as unknown as Window);
    expect(calls).toBe(1);
    scroller.fire("scroll");
    scroller.fire("scroll");
    scroller.fire("scroll");
    expect(sched.size()).toBe(1);
    sched.flush();
    expect(calls).toBe(2);
    win.fire("resize");
    sched.flush();
    expect(calls).toBe(3);
    off();
    expect(scroller.count("scroll")).toBe(0);
    expect(win.count("resize")).toBe(0);
  });

  test("no frame is left queued after unsubscribe, and nothing runs while idle", () => {
    const scroller = fakeTarget();
    const sched = fakeScheduler();
    const off = watchScroll(scroller as unknown as Element, () => {}, null, sched, fakeTarget() as unknown as Window);
    expect(sched.size()).toBe(0);
    scroller.fire("scroll");
    off();
    expect(sched.size()).toBe(0);
  });

  test("Lenis clock: subscribes through on('scroll'), never to native scroll, and unsubscribes", () => {
    const scroller = fakeTarget();
    let handler: (() => void) | null = null;
    let unsubscribed = false;
    const clock: ScrollClock = {
      on: (event, cb) => {
        expect(event).toBe("scroll");
        handler = cb;
        return () => {
          unsubscribed = true;
        };
      },
    };
    let calls = 0;
    const off = watchScroll(scroller as unknown as Element, () => calls++, clock, fakeScheduler(), fakeTarget() as unknown as Window);
    expect(scroller.count("scroll")).toBe(0);
    expect(calls).toBe(1);
    handler!();
    handler!();
    expect(calls).toBe(3);
    off();
    expect(unsubscribed).toBe(true);
  });
});
