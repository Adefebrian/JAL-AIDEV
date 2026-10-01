// RemotionSection on React 19 (createRoot and act) in happy-dom, with a
// fake @remotion/player, a fake IntersectionObserver, and a fake
// matchMedia. It needs the workspace installed (react, react-dom,
// happy-dom, the ui package) and skips with a note when it is not. No JSX
// here: every import is dynamic, after the fakes are registered.
import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";

const installed = (() => {
  try {
    for (const m of ["react", "react-dom/client", "@happy-dom/global-registrator", "@__APP_NAME__/ui"]) Bun.resolveSync(m, import.meta.dir);
    return true;
  } catch {
    return false;
  }
})();
if (!installed) console.warn("RemotionSection.test: workspace not installed, component tests skipped (run inside packages/video after bun install)");

type Log = { play: number; pause: number; seeks: number[] };
const log: Log = { play: 0, pause: 0, seeks: [] };
const players: { props: Record<string, any>; emit: (e: string, d?: unknown) => void }[] = [];

describe.skipIf(!installed)("RemotionSection", () => {
  let React: typeof import("react");
  let act: typeof import("react").act;
  let createRoot: typeof import("react-dom/client").createRoot;
  let RemotionSection: typeof import("./RemotionSection").RemotionSection;
  let reduce = false;
  let observers: { cb: IntersectionObserverCallback; opts?: IntersectionObserverInit; el?: Element }[] = [];

  beforeAll(async () => {
    const { GlobalRegistrator } = await import("@happy-dom/global-registrator");
    if (typeof document === "undefined") GlobalRegistrator.register();
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    React = await import("react");
    act = React.act;
    // The fake Player: the PlayerRef methods the frame uses, recorded.
    mock.module("@remotion/player", () => {
      const h = React.createElement;
      function Player(props: Record<string, any>) {
        const listeners = React.useRef(new Map<string, Set<(e: unknown) => void>>());
        const self = React.useRef<{ props: Record<string, any>; playing: boolean; emit: (e: string, d?: unknown) => void } | null>(null);
        if (!self.current) {
          self.current = { props, playing: false, emit: (e, d) => listeners.current.get(e)?.forEach((cb) => cb({ detail: d })) };
          players.push(self.current);
        }
        self.current.props = props;
        React.useImperativeHandle(props.ref, () => ({
          play: () => {
            log.play++;
            self.current!.playing = true;
            self.current!.emit("play");
          },
          pause: () => {
            log.pause++;
            self.current!.playing = false;
            self.current!.emit("pause");
          },
          isPlaying: () => self.current!.playing,
          seekTo: (f: number) => void log.seeks.push(f),
          getCurrentFrame: () => 0,
          addEventListener: (e: string, cb: (x: unknown) => void) => void (listeners.current.get(e) ?? listeners.current.set(e, new Set()).get(e)!).add(cb),
          removeEventListener: (e: string, cb: (x: unknown) => void) => void listeners.current.get(e)?.delete(cb),
        }));
        return h("div", { "data-fake": "player" });
      }
      function Thumbnail(props: Record<string, any>) {
        return h("div", { "data-fake": "thumbnail", "data-frame": String(props.frameToDisplay) });
      }
      return { Player, Thumbnail };
    });
    ({ createRoot } = await import("react-dom/client"));
    ({ RemotionSection } = await import("./RemotionSection"));
  });

  beforeEach(() => {
    observers = [];
    players.length = 0;
    Object.assign(log, { play: 0, pause: 0, seeks: [] });
    reduce = false;
    (globalThis as any).IntersectionObserver = class {
      cb: IntersectionObserverCallback;
      opts?: IntersectionObserverInit;
      constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
        this.cb = cb;
        this.opts = opts;
        observers.push(this as never);
      }
      observe(el: Element) {
        (this as any).el = el;
      }
      disconnect() {}
      unobserve() {}
    };
    window.matchMedia = ((q: string) => ({
      matches: q.includes("reduce") ? reduce : false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as never;
  });

  afterAll(() => {
    mock.restore();
  });

  const component = () => null;
  const entry = {
    id: "fake-video",
    title: "Fake",
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 180, // 6 s: past 5 s, so autoplay must offer a pause control
    posterFrame: 150,
    load: async () => ({ component, defaultProps: { a: 1 } }),
    schema: async () => ({ safeParse: (v: unknown) => ({ success: true, data: v }) }) as never,
  };

  async function mount(props: Record<string, unknown> = {}) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(React.createElement(RemotionSection as any, { video: entry, label: "Fake video", ...props }));
    });
    const figure = () => host.querySelector("figure")!;
    return {
      host,
      figure,
      stage: () => figure().getAttribute("data-video-stage"),
      unmount: async () => {
        await act(async () => root.unmount());
        host.remove();
      },
    };
  }

  // Fire both observers (near and on screen) for the frame.
  async function intersect(on: boolean, which: "near" | "view" | "both" = "both") {
    await act(async () => {
      for (const o of observers) {
        const isNear = o.opts?.rootMargin !== undefined;
        if (which === "both" || (which === "near") === isNear) o.cb([{ isIntersecting: on, target: o.el } as never], o as never);
      }
      await new Promise((r) => setTimeout(r, 0));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }

  test("server-safe poster first: the ratio box and the poster image, no video code", async () => {
    const m = await mount({ poster: "/media/fake.webp" });
    expect(m.stage()).toBe("poster");
    expect(m.host.querySelector(".kit-media-frame")!.getAttribute("style")).toContain("--kit-ratio: 1920 / 1080");
    expect(m.host.querySelector("img")!.getAttribute("src")).toBe("/media/fake.webp");
    expect(m.host.querySelector("[data-fake]")).toBeNull();
    const section = m.host.querySelector("section")!;
    expect(section.getAttribute("data-kit-composition")).toBe("media");
    expect(section.getAttribute("data-variant")).toBe("video-autoplay");
    expect(m.host.querySelector("[data-jal-canvas][role=img]")!.getAttribute("aria-label")).toBe("Fake video");
    expect(m.host.querySelector(".video-stage")!.getAttribute("aria-hidden")).toBe("true");
    await m.unmount();
  });

  test("near loads a thumbnail at the poster frame; on screen switches to the Player and plays", async () => {
    const m = await mount();
    await intersect(true, "near");
    expect(m.stage()).toBe("thumbnail");
    expect(m.host.querySelector('[data-fake="thumbnail"]')!.getAttribute("data-frame")).toBe("150");
    await intersect(true, "view");
    expect(m.stage()).toBe("player");
    expect(log.play).toBe(1);
    const p = players[players.length - 1].props;
    expect(p).toMatchObject({ initiallyMuted: true, autoPlay: false, controls: false, loop: false, numberOfSharedAudioTags: 0, acknowledgeRemotionLicense: true });
    expect(m.host.querySelector("button")!.textContent).toBe("Pause");
    await m.unmount();
  });

  test("pauses offscreen and resumes on screen; the viewer's pause holds", async () => {
    const m = await mount();
    await intersect(true);
    expect(log.play).toBe(1);
    await intersect(false, "view");
    expect(log.pause).toBe(1);
    await intersect(true, "view");
    expect(log.play).toBe(2);
    await act(async () => (m.host.querySelector("button") as HTMLButtonElement).click());
    expect(log.pause).toBe(2);
    await intersect(false, "view");
    await intersect(true, "view");
    expect(log.play).toBe(2);
    await m.unmount();
  });

  test("a short autoplay (5 s or less) gets no controls; a longer one always a pause control", async () => {
    const short = await mount({ video: { ...entry, durationInFrames: 120 } });
    await intersect(true);
    expect(short.host.querySelector("button")).toBeNull();
    await short.unmount();
    const long = await mount({ controls: "none" });
    await intersect(true);
    expect(long.host.querySelector("button")!.getAttribute("aria-label")).toBe("Pause Fake video");
    await long.unmount();
  });

  test("a hidden tab pauses", async () => {
    const m = await mount();
    await intersect(true);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(log.pause).toBe(1);
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    await act(async () => void document.dispatchEvent(new Event("visibilitychange")));
    expect(log.play).toBe(2);
    await m.unmount();
  });

  test("reduced motion: the still at the poster frame, never autoplay; play is the viewer's choice", async () => {
    reduce = true;
    const m = await mount();
    await intersect(true);
    expect(m.stage()).toBe("thumbnail");
    expect(m.host.querySelector('[data-fake="thumbnail"]')!.getAttribute("data-frame")).toBe("150");
    expect(log.play).toBe(0);
    const button = m.host.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("Play");
    await act(async () => button.click());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(m.stage()).toBe("player");
    expect(log.play).toBe(1);
    await m.unmount();
  });

  test("scrub: the frame follows scroll progress, no clock, no controls", async () => {
    const m = await mount({ mode: "scrub" });
    const frame = m.host.querySelector(".kit-media-frame") as HTMLElement;
    let top = 450;
    frame.getBoundingClientRect = () => ({ top, height: 300, bottom: top + 300, left: 0, right: 0, width: 0, x: 0, y: top, toJSON() {} }) as DOMRect;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    await intersect(true);
    expect(m.stage()).toBe("player");
    expect(log.seeks).toEqual([67]); // progress (900 - 450) / (900 + 300) = 0.375, frame round(0.375 * 179)
    top = 300;
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await new Promise((r) => setTimeout(r, 40));
    });
    expect(log.seeks).toEqual([67, 90]); // 0.5 * 179 = 89.5, rounds to 90
    expect(m.figure().getAttribute("data-video-frame")).toBe("90");
    expect(log.play).toBe(0);
    expect(m.host.querySelector("button")).toBeNull();
    expect(m.host.querySelector("section")!.getAttribute("data-variant")).toBe("video-scrub");
    await m.unmount();
  });

  test("scrub on the Lenis clock: subscribes through on('scroll') instead of native scroll", async () => {
    let tick: (() => void) | null = null;
    let off = false;
    const clock = { on: (_e: string, cb: () => void) => ((tick = cb), () => void (off = true)) };
    const m = await mount({ mode: "scrub", scrollClock: clock });
    const frame = m.host.querySelector(".kit-media-frame") as HTMLElement;
    let top = 900;
    frame.getBoundingClientRect = () => ({ top, height: 300 }) as DOMRect;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    await intersect(true);
    expect(log.seeks).toEqual([0]);
    top = -300;
    await act(async () => tick!());
    expect(log.seeks).toEqual([0, 179]);
    await m.unmount();
    expect(off).toBe(true);
  });

  test("inputProps are validated by the schema before the first frame", async () => {
    const m = await mount({ inputProps: { a: 2 } });
    await intersect(true);
    expect(players[players.length - 1].props.inputProps).toEqual({ a: 2 });
    await m.unmount();
  });
});
