// What a RemotionSection shows and does, as pure functions of its signals,
// so every rule is tested without a browser.
//
// Stages: poster -> thumbnail -> player.
//   poster     server HTML and before the chunk loads: the aspect-ratio box,
//              plus a poster image when the page gives one. No video code.
//   thumbnail  the chunk has loaded: Remotion's <Thumbnail> at the poster
//              frame, a still (no clock, no rAF). Reduced motion stays here.
//   player     the section has been on screen: Remotion's <Player>.
//
// Modes: autoplay (muted, inline, only while on screen; plays once and holds
// its last frame unless loop is set), scrub (the frame follows scroll
// progress), manual (a still until the viewer plays).

export type VideoMode = "autoplay" | "scrub" | "manual";
export type ControlsPolicy = "jal" | "remotion" | "none";
export type VideoStage = "poster" | "thumbnail" | "player";

export interface StageInput {
  mode: VideoMode;
  /** The player chunk and the composition module have loaded. */
  loaded: boolean;
  /** The section has intersected the viewport at least once. */
  seen: boolean;
  reduced: boolean;
  /** The viewer pressed play (the only way past the still under reduced motion or in manual mode). */
  userPlay: boolean;
  controls: ControlsPolicy;
}

export function resolveStage(s: StageInput): VideoStage {
  if (!s.loaded) return "poster";
  if (s.userPlay) return "player";
  if (s.reduced) return "thumbnail";
  if (s.mode === "manual") return s.controls === "remotion" && s.seen ? "player" : "thumbnail";
  return s.seen ? "player" : "thumbnail";
}

export interface PlayInput {
  mode: VideoMode;
  reduced: boolean;
  /** On screen now. */
  visible: boolean;
  /** document.visibilityState is not "hidden". */
  pageVisible: boolean;
  userPlay: boolean;
  userPaused: boolean;
  /** A run without loop reached its last frame; it holds there until the viewer replays. */
  ended: boolean;
}

/** Should the clock run right now. Offscreen and hidden tabs always pause. */
export function shouldPlay(s: PlayInput): boolean {
  if (s.mode === "scrub") return false;
  if (!s.visible || !s.pageVisible || s.userPaused || s.ended) return false;
  if (s.mode === "autoplay" && !s.reduced) return true;
  return s.userPlay;
}

export interface ControlsInput {
  mode: VideoMode;
  requested?: ControlsPolicy;
  durationInSeconds: number;
  reduced: boolean;
}

/**
 * The controls a section gets.
 *   scrub: none, scroll is the control.
 *   autoplay: a pause control whenever the loop runs past 5 s (WCAG 2.2.2),
 *     even when "none" was asked for; a play control under reduced motion,
 *     so the viewer can still opt in.
 *   manual: JAL controls unless the page asked for Remotion's own.
 */
export function resolveControls({ mode, requested, durationInSeconds, reduced }: ControlsInput): ControlsPolicy {
  if (mode === "scrub") return "none";
  if (mode === "autoplay") {
    if (requested === "none") return durationInSeconds > 5 && !reduced ? "jal" : "none";
    if (requested) return requested;
    return durationInSeconds > 5 || reduced ? "jal" : "none";
  }
  return requested && requested !== "none" ? requested : "jal";
}

export interface ScrubRange {
  /** Viewport fraction where the frame's top starts the scrub. Default 1 (the bottom edge). */
  startAt?: number;
  /** Viewport fraction where the frame's bottom ends the scrub. Default 0 (the top edge). */
  endAt?: number;
}

export interface Box {
  /** Top of the element relative to the scroller's visible top, in px. */
  top: number;
  height: number;
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Scroll progress of an element through the scroller's viewport: 0 when
 * its top reaches startAt of the viewport, 1 when its bottom reaches endAt.
 * The default (1, 0) runs from entering at the bottom to leaving at the top.
 */
export function scrubProgress(box: Box, viewportHeight: number, range: ScrubRange = {}): number {
  const startAt = range.startAt ?? 1;
  const endAt = range.endAt ?? 0;
  const span = (startAt - endAt) * viewportHeight + box.height;
  if (span <= 0) return box.top <= endAt * viewportHeight - box.height ? 1 : 0;
  return clamp01((startAt * viewportHeight - box.top) / span);
}

/** The frame for a progress: 0 at 0, the last frame at 1. */
export function progressToFrame(progress: number, durationInFrames: number): number {
  const last = Math.max(0, Math.floor(durationInFrames) - 1);
  return Math.round(clamp01(progress) * last);
}

/** The poster frame, kept inside the composition. */
export function clampFrame(frame: number, durationInFrames: number): number {
  const last = Math.max(0, Math.floor(durationInFrames) - 1);
  if (!Number.isFinite(frame)) return last;
  return Math.min(last, Math.max(0, Math.round(frame)));
}

/** An element's box inside the scroller getScroller() returned, and that viewport's height. */
export function viewportBox(el: Element, scroller: Element | Window): { box: Box; viewportHeight: number } {
  const rect = el.getBoundingClientRect();
  // Duck-typed: a Window has no nodeType (and instanceof fails across realms and DOM shims).
  const isWindow = !(scroller as Element).nodeType;
  if (isWindow) {
    const win = scroller as Window;
    return { box: { top: rect.top, height: rect.height }, viewportHeight: win.innerHeight };
  }
  const s = scroller as Element;
  const sr = s.getBoundingClientRect();
  return { box: { top: rect.top - sr.top, height: rect.height }, viewportHeight: s.clientHeight };
}
