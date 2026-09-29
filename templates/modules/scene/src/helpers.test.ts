import { describe, expect, test } from "bun:test";
import { kelvinToHex, kelvinToLinearRGB, mixKelvin, pointCandela, spotCandela } from "./light-math";
import { damp, lensToFov, progressToShotIndex, responsiveFov, sampleShots, type Shot } from "./shots";
import { budgetFor, parseForced, selectTier, type TierSignals } from "./tier";

describe("kelvinToLinearRGB", () => {
  test("normalised: the largest channel is 1, none negative", () => {
    for (const k of [1000, 1900, 2700, 4000, 5600, 6500, 10000, 30000]) {
      const c = kelvinToLinearRGB(k);
      expect(Math.max(...c)).toBeCloseTo(1, 6);
      expect(Math.min(...c)).toBeGreaterThanOrEqual(0);
    }
  });

  test("tungsten is warm: red over green over blue, blue low", () => {
    const [r, g, b] = kelvinToLinearRGB(2700);
    expect(r).toBe(1);
    expect(g).toBeLessThan(r);
    expect(b).toBeLessThan(g);
    expect(b).toBeLessThan(0.3);
  });

  test("about 6500 K is near neutral", () => {
    const [r, g, b] = kelvinToLinearRGB(6500);
    expect(Math.abs(r - g)).toBeLessThan(0.1);
    expect(Math.abs(r - b)).toBeLessThan(0.12);
  });

  test("blue rises and red falls monotonically with temperature", () => {
    let prev = kelvinToLinearRGB(1700);
    for (let k = 1800; k <= 12000; k += 100) {
      const c = kelvinToLinearRGB(k);
      expect(c[2] / c[0]).toBeGreaterThanOrEqual(prev[2] / prev[0] - 1e-9);
      prev = c;
    }
    const hot = kelvinToLinearRGB(12000);
    expect(hot[2]).toBe(1);
  });

  test("hex output is an sRGB-encoded CSS colour", () => {
    expect(kelvinToHex(2700)).toMatch(/^#ff[0-9a-f]{4}$/);
    expect(kelvinToHex(12000).slice(5)).toBe("ff");
  });

  test("mired mixing hits both ends and moves evenly in mired", () => {
    expect(mixKelvin(2700, 5000, 0)).toBeCloseTo(2700, 6);
    expect(mixKelvin(2700, 5000, 1)).toBeCloseTo(5000, 6);
    const mid = mixKelvin(2700, 5000, 0.5);
    expect(1e6 / mid).toBeCloseTo((1e6 / 2700 + 1e6 / 5000) / 2, 6);
  });

  test("photometry: candela from lumens", () => {
    expect(pointCandela(4 * Math.PI)).toBeCloseTo(1, 9);
    // A hemisphere (half-angle 90 degrees) spreads over 2 pi steradians.
    expect(spotCandela(2 * Math.PI, Math.PI / 2)).toBeCloseTo(1, 9);
    expect(spotCandela(800, 0.3)).toBeGreaterThan(spotCandela(800, 0.8));
  });
});

const shots: Shot[] = [
  { name: "hero", position: [0, 1, 3], target: [0, 0.5, 0], lens: 50 },
  { name: "detail", position: [1, 0.6, 1], target: [0.2, 0.2, 0], lens: 35, portrait: { position: [1, 0.8, 1.6] } },
  { name: "cta", position: [-1, 1.4, 2], target: [0, 0.3, 0], lens: 50 },
];

describe("shots", () => {
  test("lens to vertical fov on full frame", () => {
    expect(lensToFov(50)).toBeCloseTo(26.99, 1);
    expect(lensToFov(35)).toBeCloseTo(37.85, 1);
  });

  test("integer indices land exactly on shots", () => {
    const a = sampleShots(shots, 0);
    expect(a.position).toEqual([0, 1, 3]);
    expect(a.nearest).toBe("hero");
    const c = sampleShots(shots, 2);
    expect(c.position).toEqual([-1, 1.4, 2]);
    expect(c.fov).toBeCloseTo(lensToFov(50), 6);
  });

  test("halfway is the eased midpoint, and out-of-range clamps", () => {
    const m = sampleShots(shots, 0.5);
    expect(m.position[0]).toBeCloseTo(0.5, 6);
    expect(m.fov).toBeCloseTo((lensToFov(50) + lensToFov(35)) / 2, 6);
    expect(sampleShots(shots, -3).nearest).toBe("hero");
    expect(sampleShots(shots, 99).nearest).toBe("cta");
    expect(sampleShots(shots, Number.NaN).nearest).toBe("hero");
  });

  test("easing settles at the ends of a segment", () => {
    const near0 = sampleShots(shots, 0.02).position[0];
    const near1 = sampleShots(shots, 0.98).position[0];
    expect(near0).toBeLessThan(0.02);
    expect(near1).toBeGreaterThan(0.98);
  });

  test("portrait uses the portrait pose and widens the fov", () => {
    const p = sampleShots(shots, 1, 9 / 16);
    expect(p.position).toEqual([1, 0.8, 1.6]);
    expect(p.fov).toBeGreaterThan(lensToFov(35));
    expect(responsiveFov(30, 2)).toBe(30);
    expect(responsiveFov(60, 0.2)).toBe(65);
  });

  test("progress of sequential triggers sums to the shot index", () => {
    expect(progressToShotIndex([])).toBe(0);
    expect(progressToShotIndex([0.5, 0])).toBe(0.5);
    expect(progressToShotIndex([1, 0.25])).toBe(1.25);
    expect(progressToShotIndex([1.4, -2, Number.NaN])).toBe(1);
  });

  test("damping converges and 0 snaps", () => {
    expect(damp(0, 1, 0, 0.016)).toBe(1);
    let v = 0;
    for (let i = 0; i < 240; i++) v = damp(v, 1, 4, 1 / 60);
    expect(v).toBeGreaterThan(0.999);
    expect(damp(0, 1, 4, 1 / 60)).toBeCloseTo(damp(0, 1, 4, 1 / 120) + (1 - damp(0, 1, 4, 1 / 120)) * damp(0, 1, 4, 1 / 120), 9);
  });
});

const desktop: TierSignals = { reducedMotion: false, saveData: false, webgl2: true, coarsePointer: false, viewportWidth: 1440, deviceMemory: 16, cores: 10, renderer: "ANGLE (Apple, Apple M2, OpenGL 4.1)", maxTextureSize: 16384 };

describe("tier", () => {
  test("a capable desktop is full with post", () => {
    expect(selectTier(desktop)).toBe("full");
    const b = budgetFor("full", 1440, false);
    expect(b.postFX).toBe(true);
    expect(b.dpr[1]).toBeLessThanOrEqual(2);
    expect(b.shadowCasters).toBe(2);
  });

  test("reduced motion, save-data, no WebGL2, and software GPUs get the poster", () => {
    expect(selectTier({ ...desktop, reducedMotion: true })).toBe("static");
    expect(selectTier({ ...desktop, saveData: true })).toBe("static");
    expect(selectTier({ ...desktop, webgl2: false })).toBe("static");
    expect(selectTier({ ...desktop, renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))" })).toBe("static");
    expect(selectTier({ ...desktop, maxTextureSize: 2048 })).toBe("static");
  });

  test("a low-memory phone is reduced; a strong phone is full without post", () => {
    const phone = { ...desktop, coarsePointer: true, viewportWidth: 390 };
    expect(selectTier({ ...phone, deviceMemory: 4 })).toBe("reduced");
    expect(selectTier({ ...phone, cores: 4, deviceMemory: undefined })).toBe("reduced");
    expect(selectTier({ ...phone, deviceMemory: 8, cores: 8 })).toBe("full");
    const b = budgetFor("full", 390, true);
    expect(b.postFX).toBe(false);
    expect(b.dpr[1]).toBe(1.25);
    expect(budgetFor("reduced", 390, true).dpr).toEqual([1, 1]);
    expect(budgetFor("static", 390, true).shadowCasters).toBe(0);
  });

  test("a forced tier wins, parsed only from known values", () => {
    expect(parseForced("?scene-tier=full")).toBe("full");
    expect(parseForced("?scene-tier=ultra")).toBeUndefined();
    expect(selectTier({ ...desktop, webgl2: false, forced: "full" })).toBe("full");
  });
});
