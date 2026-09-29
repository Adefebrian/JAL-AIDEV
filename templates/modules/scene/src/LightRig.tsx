// LightRig: the lights that tell the product story.
//
//   KeyLight        a SpotLight that casts a real shadow map: wide penumbra
//                   for a softbox feel, PCF radius for a soft edge, bias and
//                   normal bias tuned for metre-scale products. The HDRI in
//                   EnvironmentRig is the fill; there is no ambient light.
//   PracticalLight  for a product that emits light (a lamp, a screen, an
//                   indicator): a real light in the scene placed at the
//                   emitter, colour from kelvinToLinearRGB, so the desk and
//                   everything near it receive the light and its shadow. The
//                   emitter's own surface is synced to the same colour as an
//                   emissive, so the bulb and the pool always agree. The light
//                   is shown by what it lights, never by a halo.
//
// Shadow budget: the tier allows N casters (budgetFor().shadowCasters: 2 on
// desktop full, 1 elsewhere). Each light has a shadowPriority; it casts only
// when its priority is within N. The practical is the story, so it defaults
// to priority 1 and the key to 2.
//
// Units: physically correct lights, SpotLight and PointLight intensity in
// candela with inverse-square decay. The HDRI sets the absolute scale (a
// radiance of about 1 renders page white), so real-world lumens convert with
// spotCandela() and then scale by the exposure the capture needs; a desk lamp
// pool that reads bright at 0.5 m is about 2 to 6 cd in these scene units.
// Tune intensity against captures, never by eye on the code.
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { LinearSRGBColorSpace, Object3D, type Material, type MeshStandardMaterial, type PointLight, type SpotLight } from "three";
import { kelvinToLinearRGB } from "./light-math";
import { useStage } from "./Stage";

export type Live<T> = T | MutableRefObject<T>;
const read = <T,>(v: Live<T>): T => (v !== null && typeof v === "object" && "current" in (v as object) ? (v as MutableRefObject<T>).current : (v as T));

type V3 = [number, number, number];

interface ShadowOpts {
  shadowPriority?: number;
  /** World-space radius of the PCF filter in texels. 3 to 6 reads as a soft studio edge. */
  shadowRadius?: number;
  shadowBias?: number;
  shadowNormalBias?: number;
}

function useShadowSetup(ref: RefObject<SpotLight | PointLight | null>, cast: boolean, size: number, far: number, opts: ShadowOpts) {
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    light.castShadow = cast && size > 0;
    if (light.castShadow) {
      light.shadow.mapSize.set(size, size);
      light.shadow.bias = opts.shadowBias ?? -0.0002;
      light.shadow.normalBias = opts.shadowNormalBias ?? 0.004;
      light.shadow.radius = opts.shadowRadius ?? 4;
      light.shadow.camera.near = 0.02;
      light.shadow.camera.far = far;
      light.shadow.camera.updateProjectionMatrix();
      light.shadow.map?.dispose();
      light.shadow.map = null as any;
      light.shadow.needsUpdate = true;
    }
    invalidate();
  }, [ref, cast, size, far, opts.shadowBias, opts.shadowNormalBias, opts.shadowRadius, invalidate]);
}

export interface KeyLightProps extends ShadowOpts {
  position?: V3;
  target?: V3;
  /** Candela, scene units. */
  intensity?: number;
  kelvin?: number;
  /** Half-angle of the cone, radians. */
  angle?: number;
  /** 0 hard edge to 1 fully soft. A softbox reads at 0.6 to 0.9. */
  penumbra?: number;
}

export function KeyLight({
  position = [-1.6, 2.4, 1.6],
  target = [0, 0, 0],
  intensity = 6,
  kelvin = 5600,
  angle = 0.5,
  penumbra = 0.8,
  shadowPriority = 2,
  ...shadow
}: KeyLightProps) {
  const { budget } = useStage();
  const ref = useRef<SpotLight>(null);
  const tgt = useMemo(() => new Object3D(), []);
  const color = useMemo(() => kelvinToLinearRGB(kelvin), [kelvin]);
  const distance = Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2]);
  useLayoutEffect(() => {
    tgt.position.set(...target);
    tgt.updateMatrixWorld();
    ref.current?.color.setRGB(color[0], color[1], color[2], LinearSRGBColorSpace);
  }, [tgt, target[0], target[1], target[2], color]);
  useShadowSetup(ref, shadowPriority <= budget.shadowCasters, budget.shadowMapSize, distance * 2.5, shadow);
  return (
    <>
      <primitive object={tgt} />
      <spotLight ref={ref} position={position} target={tgt} intensity={intensity} angle={angle} penumbra={penumbra} decay={2} />
    </>
  );
}

export interface PracticalLightProps extends ShadowOpts {
  kind?: "spot" | "point";
  position: V3;
  /** Spot only: where the emitter points. */
  target?: V3;
  /** Candela, scene units. May be a ref for animated values. */
  intensity: Live<number>;
  /** Colour temperature. May be a ref, for a scroll-driven warm-to-cool beat. */
  kelvin: Live<number>;
  angle?: number;
  penumbra?: number;
  /** Stop the light at this range (metres); 0 is physically unbounded. */
  distance?: number;
  /** The emitter's visible surface (bulb, diffuser). Its emissive follows the light. */
  emitter?: Material | Material[] | null;
  /** Emissive strength of the emitter surface. Above 1 reads as a light source and rolls off to warm white under AgX. */
  emitterIntensity?: Live<number>;
}

export function PracticalLight({
  kind = "spot",
  position,
  target = [position[0], 0, position[2]],
  intensity,
  kelvin,
  angle = 0.75,
  penumbra = 0.55,
  distance = 0,
  emitter,
  emitterIntensity = 4,
  shadowPriority = 1,
  ...shadow
}: PracticalLightProps) {
  const { budget } = useStage();
  const invalidate = useThree((s) => s.invalidate);
  const spot = useRef<SpotLight>(null);
  const point = useRef<PointLight>(null);
  const tgt = useMemo(() => new Object3D(), []);
  const last = useRef({ k: NaN, i: NaN, e: NaN });

  useLayoutEffect(() => {
    tgt.position.set(...target);
    tgt.updateMatrixWorld();
  }, [tgt, target[0], target[1], target[2]]);

  const reach = distance > 0 ? distance : 4;
  useShadowSetup(kind === "spot" ? spot : point, shadowPriority <= budget.shadowCasters, budget.shadowMapSize, reach, shadow);

  const apply = () => {
    const k = read(kelvin);
    const i = read(intensity);
    const e = read(emitterIntensity);
    const l = last.current;
    if (k === l.k && i === l.i && e === l.e) return false;
    const [r, g, b] = kelvinToLinearRGB(k);
    const light = kind === "spot" ? spot.current : point.current;
    if (light) {
      light.color.setRGB(r, g, b, LinearSRGBColorSpace);
      light.intensity = i;
    }
    const mats = emitter ? (Array.isArray(emitter) ? emitter : [emitter]) : [];
    for (const m of mats as MeshStandardMaterial[]) {
      if (!m.emissive) continue;
      m.emissive.setRGB(r, g, b, LinearSRGBColorSpace);
      m.emissiveIntensity = e;
    }
    last.current = { k, i, e };
    return true;
  };

  // Static values apply once; ref values are read every rendered frame, and
  // whoever changes the ref (CameraRig progress, a drag) calls invalidate().
  useEffect(() => {
    last.current = { k: NaN, i: NaN, e: NaN };
    apply();
    invalidate();
  });
  useFrame(() => {
    apply();
  });

  return kind === "spot" ? (
    <>
      <primitive object={tgt} />
      <spotLight ref={spot} position={position} target={tgt} angle={angle} penumbra={penumbra} distance={distance} decay={2} />
    </>
  ) : (
    <pointLight ref={point} position={position} distance={distance} decay={2} />
  );
}

export interface LightRigProps {
  /** false for a scene lit only by its practical and the environment. */
  keyLight?: KeyLightProps | false;
  practicals?: PracticalLightProps[];
}

/** A key light plus any practical lights. The HDRI in EnvironmentRig is the fill. */
export function LightRig({ keyLight = {}, practicals = [] }: LightRigProps) {
  const keyPriority = practicals.length === 0 ? 1 : 2;
  return (
    <>
      {keyLight !== false && <KeyLight shadowPriority={keyPriority} {...keyLight} />}
      {practicals.map((p, i) => (
        <PracticalLight key={i} {...p} />
      ))}
    </>
  );
}
