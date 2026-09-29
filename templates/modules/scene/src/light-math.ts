// Pure light math for the scene module: colour temperature to linear RGB and
// photometric conversions. No three import, so it is testable anywhere.
//
// kelvinToLinearRGB follows the Planckian locus through the Kim et al. (2002)
// cubic approximation of CIE 1931 xy (valid 1667 K to 25000 K), converts xyY
// (Y = 1) to XYZ, then XYZ to linear sRGB (D65 primaries, the working space of
// three's ColorManagement), clamps negatives, and normalises the largest
// channel to 1. Brightness belongs to the light's intensity, never its colour.
//
// Feed the result to three as a linear colour:
//   light.color.setRGB(r, g, b, THREE.LinearSRGBColorSpace)
// Never through setHex or a CSS string, which would treat it as sRGB and apply
// the transfer curve a second time.

export type RGB = [number, number, number];

export const KELVIN_MIN = 1667;
export const KELVIN_MAX = 25000;

/** Common practical sources, in kelvin, for briefs and presets. */
export const KELVIN = {
  candle: 1900,
  tungsten: 2700,
  warmWhite: 3000,
  halogen: 3200,
  neutralWhite: 4000,
  daylight: 5600,
  overcast: 6500,
  shade: 7500,
} as const;

export function planckianXY(kelvin: number): [number, number] {
  const t = Math.min(KELVIN_MAX, Math.max(KELVIN_MIN, kelvin));
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    t <= 4000
      ? -0.2661239e9 / t3 - 0.2343589e6 / t2 + 0.8776956e3 / t + 0.17991
      : -3.0258469e9 / t3 + 2.1070379e6 / t2 + 0.2226347e3 / t + 0.24039;
  const x2 = x * x;
  const x3 = x2 * x;
  const y =
    t <= 2222
      ? -1.1063814 * x3 - 1.3481102 * x2 + 2.18555832 * x - 0.20219683
      : t <= 4000
        ? -0.9549476 * x3 - 1.37418593 * x2 + 2.09137015 * x - 0.16748867
        : 3.081758 * x3 - 5.8733867 * x2 + 3.75112997 * x - 0.37001483;
  return [x, y];
}

export function kelvinToLinearRGB(kelvin: number): RGB {
  const [x, y] = planckianXY(kelvin);
  const X = x / y;
  const Y = 1;
  const Z = (1 - x - y) / y;
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z;
  const b = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  const c: RGB = [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
  const m = Math.max(c[0], c[1], c[2]) || 1;
  return [c[0] / m, c[1] / m, c[2] / m];
}

/** Linear to sRGB-encoded 0..1, for a CSS token or a swatch next to the scene. */
export function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/** CSS hex of a colour temperature, for the DOM ground token that follows the lamp. */
export function kelvinToHex(kelvin: number): string {
  return (
    "#" +
    kelvinToLinearRGB(kelvin)
      .map((v) => Math.round(Math.min(1, linearToSrgb(v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Luminous intensity in candela for a spot light of `lumens` with three's
 * `angle` (the half-angle of the cone, radians): cd = lm / (2 pi (1 - cos a)).
 * three's SpotLight.intensity is candela when physically correct lights are on
 * (the default since r155).
 */
export function spotCandela(lumens: number, halfAngle: number): number {
  const solid = 2 * Math.PI * (1 - Math.cos(halfAngle));
  return solid > 0 ? lumens / solid : 0;
}

/** Candela for an isotropic point source: cd = lm / (4 pi). */
export function pointCandela(lumens: number): number {
  return lumens / (4 * Math.PI);
}

/** Interpolate a temperature in mired space, which reads as even steps to the eye. */
export function mixKelvin(a: number, b: number, t: number): number {
  const ma = 1e6 / a;
  const mb = 1e6 / b;
  return 1e6 / (ma + (mb - ma) * Math.min(1, Math.max(0, t)));
}
