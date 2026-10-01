// Pure policy tests: no browser, no install needed.
import { describe, expect, test } from "bun:test";
import { clamp01, clampFrame, progressToFrame, resolveControls, resolveStage, scrubProgress, shouldPlay, viewportBox, type PlayInput, type StageInput } from "./policy";

const stage = (o: Partial<StageInput>) =>
  resolveStage({ mode: "autoplay", loaded: true, seen: true, reduced: false, userPlay: false, controls: "jal", ...o });
const play = (o: Partial<PlayInput>) =>
  shouldPlay({ mode: "autoplay", reduced: false, visible: true, pageVisible: true, userPlay: false, userPaused: false, ended: false, ...o });

describe("resolveStage", () => {
  test("poster until the chunks load, whatever else is true", () => {
    expect(stage({ loaded: false })).toBe("poster");
    expect(stage({ loaded: false, userPlay: true })).toBe("poster");
  });
  test("thumbnail once loaded, player once seen", () => {
    expect(stage({ seen: false })).toBe("thumbnail");
    expect(stage({ seen: true })).toBe("player");
    expect(stage({ mode: "scrub", seen: true })).toBe("player");
  });
  test("reduced motion stays on the still until the viewer plays", () => {
    expect(stage({ reduced: true })).toBe("thumbnail");
    expect(stage({ reduced: true, mode: "scrub" })).toBe("thumbnail");
    expect(stage({ reduced: true, userPlay: true })).toBe("player");
  });
  test("manual is a still until play, unless Remotion's own controls are on", () => {
    expect(stage({ mode: "manual" })).toBe("thumbnail");
    expect(stage({ mode: "manual", userPlay: true })).toBe("player");
    expect(stage({ mode: "manual", controls: "remotion" })).toBe("player");
  });
});

describe("shouldPlay", () => {
  test("autoplay runs only on screen in a visible tab", () => {
    expect(play({})).toBe(true);
    expect(play({ visible: false })).toBe(false);
    expect(play({ pageVisible: false })).toBe(false);
  });
  test("the viewer's pause and the end of a run hold", () => {
    expect(play({ userPaused: true })).toBe(false);
    expect(play({ ended: true })).toBe(false);
  });
  test("reduced motion and manual need the viewer's play", () => {
    expect(play({ reduced: true })).toBe(false);
    expect(play({ reduced: true, userPlay: true })).toBe(true);
    expect(play({ mode: "manual" })).toBe(false);
    expect(play({ mode: "manual", userPlay: true })).toBe(true);
    expect(play({ mode: "manual", userPlay: true, visible: false })).toBe(false);
  });
  test("scrub never runs the clock", () => {
    expect(play({ mode: "scrub", userPlay: true })).toBe(false);
  });
});

describe("resolveControls", () => {
  test("scrub has none: scroll is the control", () => {
    expect(resolveControls({ mode: "scrub", requested: "jal", durationInSeconds: 8, reduced: false })).toBe("none");
  });
  test("autoplay past 5 s always keeps a pause control (WCAG 2.2.2)", () => {
    expect(resolveControls({ mode: "autoplay", durationInSeconds: 6, reduced: false })).toBe("jal");
    expect(resolveControls({ mode: "autoplay", requested: "none", durationInSeconds: 6, reduced: false })).toBe("jal");
    expect(resolveControls({ mode: "autoplay", requested: "none", durationInSeconds: 4, reduced: false })).toBe("none");
    expect(resolveControls({ mode: "autoplay", durationInSeconds: 4, reduced: false })).toBe("none");
  });
  test("reduced motion offers play; a page may ask for Remotion's controls", () => {
    expect(resolveControls({ mode: "autoplay", durationInSeconds: 4, reduced: true })).toBe("jal");
    expect(resolveControls({ mode: "autoplay", requested: "remotion", durationInSeconds: 8, reduced: false })).toBe("remotion");
    expect(resolveControls({ mode: "manual", requested: "none", durationInSeconds: 8, reduced: false })).toBe("jal");
    expect(resolveControls({ mode: "manual", requested: "remotion", durationInSeconds: 8, reduced: false })).toBe("remotion");
  });
});

describe("scroll progress to frame", () => {
  const vh = 900;
  test("0 when the top meets the bottom edge, 1 when the bottom leaves the top", () => {
    expect(scrubProgress({ top: 900, height: 300 }, vh)).toBe(0);
    expect(scrubProgress({ top: 1400, height: 300 }, vh)).toBe(0);
    expect(scrubProgress({ top: -300, height: 300 }, vh)).toBe(1);
    expect(scrubProgress({ top: -900, height: 300 }, vh)).toBe(1);
  });
  test("linear in between", () => {
    expect(scrubProgress({ top: 300, height: 300 }, vh)).toBeCloseTo(0.5, 6);
    expect(scrubProgress({ top: 450, height: 300 }, vh)).toBeCloseTo(0.375, 6);
  });
  test("a custom range: from the frame's top at 80% to its bottom at 20%", () => {
    const range = { startAt: 0.8, endAt: 0.2 };
    expect(scrubProgress({ top: 720, height: 300 }, vh, range)).toBe(0);
    expect(scrubProgress({ top: 180 - 300, height: 300 }, vh, range)).toBeCloseTo(1, 9);
    expect(scrubProgress({ top: 720 - 420, height: 300 }, vh, range)).toBeCloseTo(0.5, 6);
  });
  test("progress maps to whole frames, 0 to the last", () => {
    expect(progressToFrame(0, 240)).toBe(0);
    expect(progressToFrame(1, 240)).toBe(239);
    expect(progressToFrame(0.5, 240)).toBe(120);
    expect(progressToFrame(0.375, 90)).toBe(33);
    expect(progressToFrame(-2, 240)).toBe(0);
    expect(progressToFrame(7, 240)).toBe(239);
    expect(progressToFrame(Number.NaN, 240)).toBe(0);
  });
  test("clamp helpers", () => {
    expect(clamp01(Infinity)).toBe(0);
    expect(clampFrame(500, 180)).toBe(179);
    expect(clampFrame(-4, 180)).toBe(0);
    expect(clampFrame(Number.NaN, 180)).toBe(179);
  });
});

describe("viewportBox", () => {
  const rect = (top: number, height: number) => ({ getBoundingClientRect: () => ({ top, height }) }) as unknown as Element;
  test("a contained scroller: the box is relative to the scroller's top", () => {
    const scroller = { nodeType: 1, clientHeight: 700, getBoundingClientRect: () => ({ top: 64, height: 700 }) } as unknown as Element;
    expect(viewportBox(rect(364, 200), scroller)).toEqual({ box: { top: 300, height: 200 }, viewportHeight: 700 });
  });
  test("the window: the viewport is innerHeight", () => {
    const win = { innerHeight: 812 } as unknown as Window;
    expect(viewportBox(rect(100, 50), win)).toEqual({ box: { top: 100, height: 50 }, viewportHeight: 812 });
  });
});
