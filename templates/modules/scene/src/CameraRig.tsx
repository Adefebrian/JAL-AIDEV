// CameraRig: one persistent scene, a camera that moves between named shots
// as the page's sections scroll. It replaces rendering the same scene in
// several canvases.
//
// Wiring (the page owns the sections, the rig owns the camera):
//   - shots[i] frames sections[i]. The move from shot k to k + 1 runs while
//     section k + 1 scrolls from the bottom of the viewport to the top.
//   - One ScrollTrigger per move, created on the page's real scroller from
//     getScroller() (packages/ui AppShell): window on a document-mode shell,
//     main.shell-main on a contained shell. Pass `scroller` to override.
//   - The triggers only write a float shot index (progressToShotIndex) into
//     progressRef and call invalidate(). The camera eases toward the sampled
//     pose in useFrame with exponential damping, and keeps invalidating until
//     it settles, then the demand frameloop goes idle.
//   - One smoother per signal: with Lenis smoothing the scroll, set
//     damping={0} so the camera follows Lenis exactly; without Lenis the
//     damping is the smoother. Never add ScrollTrigger scrub on top.
//   - reducedMotion: the Stage shows the poster on reduced motion; if a page
//     opts a visitor in to the live scene anyway, pass reducedMotion and the
//     rig cuts between shots with no in-between move.
//   - Lenis sync, pins, and the shared ticker live in
//     skills/jal-immersive/references/scroll-choreography.md; the rig adds no
//     pins of its own.
import { useLayoutEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Vector3, type PerspectiveCamera } from "three";
import { getScroller } from "@__APP_NAME__/ui";
import { damp, progressToShotIndex, sampleShots, type Shot } from "./shots";

export interface CameraRigProps {
  shots: Shot[];
  /** One selector or element per shot, same order. The first section is the one visible at load. */
  sections: (string | Element)[];
  /** Exponential damping rate (1/s). 0 follows the scroll exactly (use with Lenis). */
  damping?: number;
  scroller?: Element | Window;
  reducedMotion?: boolean;
  /** Receives the float shot index, for other scene parts (a light's kelvin) to follow. */
  progressRef?: MutableRefObject<number>;
}

const EPS = 1e-4;
// Scratch vectors: no allocation per frame.
const wantPos = new Vector3();
const wantLook = new Vector3();

export function CameraRig({ shots, sections, damping = 4, scroller, reducedMotion = false, progressRef }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const index = useRef(0);
  const pos = useRef<Vector3 | null>(null);
  const look = useRef<Vector3 | null>(null);
  const fov = useRef(camera.fov);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = scroller ?? getScroller();
    const els = sections.map((s) => (typeof s === "string" ? document.querySelector(s) : s)).filter((e): e is Element => e !== null);
    if (els.length !== shots.length) {
      console.warn(`[scene] CameraRig: ${shots.length} shots but ${els.length} sections found; the camera stays on the first shot`);
      return;
    }
    const triggers: ScrollTrigger[] = [];
    const update = () => {
      index.current = progressToShotIndex(triggers.map((t) => t.progress));
      if (progressRef) progressRef.current = index.current;
      invalidate();
    };
    for (const el of els.slice(1)) {
      triggers.push(ScrollTrigger.create({ trigger: el, scroller: root, start: "top bottom", end: "top top", onUpdate: update, onRefresh: update }));
    }
    update();
    return () => {
      for (const t of triggers) t.kill();
    };
  }, [shots, sections, scroller, invalidate, progressRef]);

  useFrame((_, delta) => {
    const aspect = size.width / Math.max(1, size.height);
    const want = sampleShots(shots, reducedMotion ? Math.round(index.current) : index.current, aspect);
    const dt = Math.min(delta, 1 / 30);
    const lambda = reducedMotion ? 0 : damping;
    if (!pos.current || !look.current) {
      pos.current = new Vector3(...want.position);
      look.current = new Vector3(...want.target);
      fov.current = want.fov;
    }
    const p = pos.current;
    const l = look.current;
    p.set(damp(p.x, want.position[0], lambda, dt), damp(p.y, want.position[1], lambda, dt), damp(p.z, want.position[2], lambda, dt));
    l.set(damp(l.x, want.target[0], lambda, dt), damp(l.y, want.target[1], lambda, dt), damp(l.z, want.target[2], lambda, dt));
    fov.current = damp(fov.current, want.fov, lambda, dt);
    camera.position.copy(p);
    camera.lookAt(l);
    if (Math.abs(camera.fov - fov.current) > EPS) {
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
    wantPos.set(...want.position);
    wantLook.set(...want.target);
    const settled =
      p.distanceToSquared(wantPos) < EPS * EPS &&
      l.distanceToSquared(wantLook) < EPS * EPS &&
      Math.abs(fov.current - want.fov) < EPS;
    if (!settled) invalidate();
  });

  return null;
}
