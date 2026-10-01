// Small frame primitives every JAL composition shares. Each is a pure
// function of the frame: no state, no effects, no timers, so the Player,
// Studio, and the in-browser renderer all draw the same picture.
// Only styles the in-browser renderer supports are used here: layout,
// transform, opacity, background-color, a full border, border-radius,
// overflow, and plain text properties (client-side-rendering/limitations).
import type { CSSProperties, ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { curve, dur } from "./tokens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 to 1 over [start, start + length] on the one curve. */
export function ease(frame: number, start: number, length: number = dur.d600): number {
  return interpolate(frame, [start, start + length], [0, 1], { ...clamp, easing: curve });
}

/** A block that rises into place: opacity and a short travel, on the curve. */
export function riseStyle(p: number, travel = 24): CSSProperties {
  return { opacity: p, transform: `translateY(${(1 - p) * travel}px)` };
}

/**
 * A line that rises from its own mask (recipe R03, the masked line reveal).
 * The mask box keeps the line's height from frame 0, so nothing shifts.
 */
export function MaskLine({ start, children, style }: { start: number; children: ReactNode; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const p = ease(frame, start, dur.d800);
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
      <div style={{ ...style, transform: `translateY(${(1 - p) * 110}%)` }}>{children}</div>
    </div>
  );
}

/** A full-width hairline that draws from the start edge. */
export function Hairline({ start, color, length = dur.d800, style }: { start: number; color: string; length?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const p = ease(frame, start, length);
  return <div style={{ height: 2, backgroundColor: color, transform: `scaleX(${p})`, transformOrigin: "0 50%", ...style }} />;
}

/** Thousands separators, a true minus sign, fixed decimals. */
export function formatFigure(value: number, decimals = 0): string {
  const abs = Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return value < 0 ? `−${abs}` : abs;
}

/** The figure at this frame of a count-up from 0 (recipe R07). */
export function countAt(frame: number, start: number, target: number, length: number = dur.d800 + dur.d400, decimals = 0): string {
  const p = ease(frame, start, length);
  const f = 10 ** decimals;
  return formatFigure(Math.round(target * p * f) / f, decimals);
}
