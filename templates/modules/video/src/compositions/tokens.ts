// JAL Core tokens for frames. A composition renders in three places: the
// Player inside a JAL page, Remotion Studio (no JAL stylesheet), and the
// in-browser renderer (it reads computed styles from a scaffold it mounts).
// So compositions carry their own values instead of reading CSS variables:
// the same picture everywhere. Keep these in step with
// packages/ui/src/tokens.css (the source of truth).
import { Easing } from "remotion";

export const color = {
  page: "#fafaf9",
  surface: "#ffffff",
  layer1: "#f5f5f4",
  layer2: "#efefed",
  border: "#e5e5e3",
  borderStrong: "#d4d4d1",
  ink: "#1b1b1b",
  inkMuted: "#474747",
  inkSubtle: "#6b6b6b",
  success: "#1f7a45",
} as const;

export const font = {
  sans: '"Geist", "Geist Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"Geist Mono", "Geist Mono Fallback", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
} as const;

/** The one curve: --ease-standard, cubic-bezier(0.24, 1, 0.4, 1). */
export const curve = Easing.bezier(0.24, 1, 0.4, 1);

/** Frame counts at 30 fps for the motion token scale (--dur-*). */
export const dur = {
  d200: 6,
  d300: 9,
  d400: 12,
  d600: 18,
  d800: 24,
} as const;

/** --stagger-item at 30 fps. */
export const stagger = 3;

/** Radii on the 1920 canvas (the page's --radius-12 and --radius-16, scaled for video). */
export const radius = { tile: 24, frame: 32 } as const;
