// Pure camera-shot math for CameraRig. No three import.
//
// A shot is a named camera pose: position, look-at target, and a lens in mm
// (full-frame equivalent). The page lists shots in section order; shot i
// frames section i. Scroll gives a float shot index in [0, shots.length - 1];
// sampleShots eases between the two neighbouring shots.

export type Vec3 = [number, number, number];

export interface ShotPose {
  position: Vec3;
  target: Vec3;
  /** Focal length in mm, full-frame equivalent. 35 to 50 is the product range. */
  lens: number;
}

export interface Shot extends ShotPose {
  name: string;
  /** Optional pose for portrait viewports (aspect under 1). Missing fields fall back to the landscape pose. */
  portrait?: Partial<ShotPose>;
}

/** Full-frame sensor height, mm. */
export const SENSOR_HEIGHT_MM = 24;

/** Vertical field of view in degrees for a focal length on a full-frame sensor. 35 mm is 37.8, 50 mm is 27.0. */
export function lensToFov(lensMm: number, sensorHeightMm = SENSOR_HEIGHT_MM): number {
  return (2 * Math.atan(sensorHeightMm / (2 * lensMm)) * 180) / Math.PI;
}

/**
 * Portrait viewports keep the subject's width in frame: the vertical fov
 * widens so the horizontal fov equals the landscape vertical fov, capped at
 * 65 degrees (wider reads as a fisheye and shrinks the product). A portrait
 * shot still needs its own pose: aim above the subject so it sits in the
 * lower two thirds, clear of the DOM copy at the top.
 */
export function responsiveFov(fovDeg: number, aspect: number, capDeg = 65): number {
  if (aspect >= 1) return fovDeg;
  const half = (fovDeg * Math.PI) / 360;
  return Math.min(capDeg, (2 * Math.atan(Math.tan(half) / aspect) * 180) / Math.PI);
}

export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function poseFor(shot: Shot, aspect: number): ShotPose {
  const base: ShotPose = { position: shot.position, target: shot.target, lens: shot.lens };
  return aspect < 1 && shot.portrait ? { ...base, ...shot.portrait } : base;
}

export interface SampledPose {
  position: Vec3;
  target: Vec3;
  /** Vertical fov in degrees, already adjusted for the aspect. */
  fov: number;
  /** The shot the camera is nearest to. */
  nearest: string;
}

/**
 * Pose at float index `t` (0 = first shot, n - 1 = last). Each segment eases
 * with smoothstep so the camera settles on every shot. The lens is
 * interpolated in fov space, which keeps a dolly-zoom-free move even.
 */
export function sampleShots(shots: Shot[], t: number, aspect = 16 / 9): SampledPose {
  if (shots.length === 0) throw new Error("sampleShots needs at least one shot");
  const max = shots.length - 1;
  const c = Math.min(max, Math.max(0, Number.isFinite(t) ? t : 0));
  const i = Math.min(max - 1, Math.floor(c));
  if (max === 0 || i < 0) {
    const p = poseFor(shots[0], aspect);
    return { position: p.position, target: p.target, fov: responsiveFov(lensToFov(p.lens), aspect), nearest: shots[0].name };
  }
  const k = smoothstep(c - i);
  const a = poseFor(shots[i], aspect);
  const b = poseFor(shots[i + 1], aspect);
  const fov = lerp(lensToFov(a.lens), lensToFov(b.lens), k);
  return {
    position: lerp3(a.position, b.position, k),
    target: lerp3(a.target, b.target, k),
    fov: responsiveFov(fov, aspect),
    nearest: shots[Math.round(c)].name,
  };
}

/**
 * Float shot index from the progress (0..1) of the section triggers. Trigger k
 * covers the move from shot k to shot k + 1 and runs while section k + 1
 * scrolls in, so the triggers are sequential and their sum is the index.
 */
export function progressToShotIndex(progresses: number[]): number {
  let sum = 0;
  for (const p of progresses) sum += Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
  return sum;
}

/** Frame-rate independent exponential damping (same curve as THREE.MathUtils.damp). */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lambda <= 0 ? target : lerp(current, target, 1 - Math.exp(-lambda * dt));
}
