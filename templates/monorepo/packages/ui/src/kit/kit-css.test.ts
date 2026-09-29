import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(import.meta.dir, "..", "kit.css"), "utf8");
const marker = css.indexOf("2. Component layer (var() only");
const knobs = css.slice(0, marker);
const components = css.slice(marker);
const EM_DASH = String.fromCharCode(0x2014);

function hue(hex: string): { h: number; s: number } {
  const v = hex.length === 4 ? hex.slice(1).split("").map((c) => c + c) : [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];
  const [r, g, b] = v.map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return { h: h < 0 ? h + 360 : h, s };
}

describe("kit.css law", () => {
  test("has the component-layer marker", () => {
    expect(marker).toBeGreaterThan(0);
  });

  test("no gradients, no blur, no glow, no transparency fades", () => {
    expect(css).not.toMatch(/gradient/i);
    expect(css).not.toMatch(/filter\s*:|backdrop-filter|drop-shadow|text-shadow|glow|mask-image/i);
  });

  test("box-shadow only ever none", () => {
    for (const m of css.matchAll(/box-shadow\s*:\s*([^;]+);/g)) expect(m[1].trim()).toBe("none");
  });

  test("no purple family: no named hues and no hex in HSL 235 to 330", () => {
    expect(css).not.toMatch(/purple|violet|indigo|magenta|fuchsia|lavender|orchid|plum/i);
    for (const m of css.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
      const { h, s } = hue(m[0]);
      if (s > 0.08) expect({ hex: m[0], inBan: h >= 235 && h <= 330 }).toEqual({ hex: m[0], inBan: false });
    }
  });

  test("no em-dash anywhere in the kit", () => {
    expect(css.includes(EM_DASH)).toBe(false);
    for (const f of readdirSync(import.meta.dir)) {
      if (/\.(tsx?|css)$/.test(f)) expect({ f, dash: readFileSync(join(import.meta.dir, f), "utf8").includes(EM_DASH) }).toEqual({ f, dash: false });
    }
  });

  test("the component layer reads tokens only: no raw hex, no raw font sizes", () => {
    expect(components).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    for (const m of components.matchAll(/font-size\s*:\s*([^;]+);/g)) expect(m[1]).toMatch(/^var\(--(text-|kit-)/);
    for (const m of components.matchAll(/line-height\s*:\s*([^;]+);/g)) expect(m[1]).toMatch(/^var\(--(line-|kit-)/);
  });

  test("five type roles only: display, heading, title (19), body (16), meta (13)", () => {
    const sizes = new Set([...components.matchAll(/font-size\s*:\s*var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]));
    const allowed = new Set(["--kit-display-sm-size", "--kit-display-md-size", "--kit-display-lg-size", "--kit-heading-sm-size", "--kit-heading-lg-size", "--text-1", "--text-0", "--text-n1"]);
    for (const s of sizes) expect({ s, allowed: allowed.has(s) }).toEqual({ s, allowed: true });
  });

  test("no side lines: no inline-start or inline-end border at all", () => {
    expect(css).not.toMatch(/border-(left|right|inline-start|inline-end)\s*:/);
  });

  test("no eyebrow machinery: no uppercase transforms or tracked-out caps", () => {
    expect(css).not.toMatch(/text-transform\s*:\s*uppercase/i);
    expect(css).not.toMatch(/letter-spacing\s*:\s*0?\.\d+em/);
  });

  test("no space-between or flex-grow fill on rows", () => {
    expect(css).not.toMatch(/space-between|flex-grow/);
  });

  test("every direction D1 to D13 has a knob block, and D13 needs an explicit dark theme", () => {
    for (let i = 1; i <= 13; i++) expect(knobs).toContain(`[data-direction="D${i}"]`);
    expect(knobs).toContain('[data-direction="D13"][data-theme="dark"]');
    expect(knobs).not.toMatch(/prefers-color-scheme/);
  });

  test("reduced motion collapses the story and the chevron", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.kit-story-frame/);
  });
});
