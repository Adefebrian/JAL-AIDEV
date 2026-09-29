// Ground: the surface every object stands on. No object floats on the page.
//
//   variant "desk"   a real slab with a rounded edge (RoundedBox, 3 mm edge
//                    radius) and PBR maps (Poly Haven veneer, laminate, or
//                    stone: diffuse, GL normal, and the packed ARM map, which
//                    three reads as AO in R, roughness in G, metalness in B).
//                    The top face is y = 0. It receives the real shadow maps
//                    and the practical light's pool.
//   variant "sweep"  a seamless studio cyclorama (floor, cove, wall) in the
//                    page colour, with its own backdrop light (an emissive lift
//                    in the page colour, the way a studio lights the paper
//                    separately from the product). Under Neutral tone mapping
//                    a total of about 2 (backdrop plus what the key and the
//                    HDRI add) renders as the page white #fafaf9, so the scene
//                    meets the DOM with no visible edge, in both the post and
//                    the no-post path. Shadows on it stay soft and lifted.
//                    Verify by sampling canvas pixels against the page token.
//
// Contact grounding (the shadows prop), with cost per tier:
//   "shadowmap"     the lights' real shadow maps only. Cost is the shadow
//                   pass per casting light (one extra depth render of the
//                   casters each frame the scene renders). Always on for a
//                   desk; it is what makes a practical's pool real.
//   "contact"       drei ContactShadows: an orthographic depth render from
//                   below plus two blur passes. frames=1 when nothing moves
//                   (one-time cost), Infinity when objects move (a full extra
//                   render per frame, about 0.3 to 0.8 ms on a desktop GPU).
//                   Full tier only on mobile, off on reduced.
//   "accumulative"  drei AccumulativeShadows with RandomizedLight: N shadow
//                   renders once at load (80 desktop, 40 mobile, 24 reduced),
//                   then free. The softest, most photographic ground shadow,
//                   but it bakes the light position: use it on a sweep under
//                   a static key, never under a moving or scroll-driven light.
//   "auto"          desk: shadowmap plus contact when the tier allows.
//                   sweep: accumulative when the tier allows, else contact.
//   pcss            drei SoftShadows (PCSS, contact-hardening shadows). It
//                   switches the renderer to BasicShadowMap and adds a blocker
//                   search per shadowed fragment: desktop full tier only.
import { useEffect, useLayoutEffect, useMemo } from "react";
import { AccumulativeShadows, ContactShadows, RandomizedLight, RoundedBox, SoftShadows, useTexture } from "@react-three/drei";
import { BufferGeometry, Float32BufferAttribute, NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { useStage } from "./Stage";

type V3 = [number, number, number];

export interface DeskTextures {
  map: string;
  normalMap?: string;
  /** Poly Haven "arm": AO (R), roughness (G), metalness (B). */
  armMap?: string;
  roughnessMap?: string;
}

export interface GroundProps {
  variant: "desk" | "sweep";
  shadows?: "auto" | "shadowmap" | "contact" | "accumulative";
  pcss?: boolean;
  /** desk: [width, depth] in metres. sweep: [width, floor depth]. */
  size?: [number, number];
  /** desk: slab thickness. */
  thickness?: number;
  textures?: DeskTextures;
  /** Metres covered by one texture tile. Poly Haven surfaces are usually authored at about 1 to 2 m. */
  tileMetres?: number;
  /** Desk base colour when no textures, or the sweep colour (default the page white). */
  color?: string;
  roughness?: number;
  /** A thin lacquer on the desk top. 0 for raw wood or matte laminate. */
  clearcoat?: number;
  /** Normal map strength. Scanned surfaces often read noisy at grazing angles; 0.4 to 0.8 keeps grain without glitter. */
  normalScale?: number;
  /** sweep: wall height and cove radius. */
  wallHeight?: number;
  coveRadius?: number;
  /** sweep: backdrop light, linear emissive strength in the sweep colour. 0 for a sweep lit only by the scene. */
  backdrop?: number;
  /** For accumulative shadows: the key light position they bake. */
  bakeLight?: V3;
  /** Objects move on the ground: contact shadows re-render every frame (see cost above). */
  dynamic?: boolean;
  position?: V3;
}

function DeskSlab({ size, thickness, textures, tileMetres, color, roughness, clearcoat, normalScale }: Required<Pick<GroundProps, "size" | "thickness" | "tileMetres" | "color" | "roughness" | "clearcoat" | "normalScale">> & { textures?: DeskTextures }) {
  const { budget } = useStage();
  const urls = useMemo(() => {
    const u: Record<string, string> = {};
    if (textures?.map) u.map = textures.map;
    if (textures?.normalMap) u.normalMap = textures.normalMap;
    if (textures?.armMap) u.armMap = textures.armMap;
    if (textures?.roughnessMap) u.roughnessMap = textures.roughnessMap;
    return u;
  }, [textures?.map, textures?.normalMap, textures?.armMap, textures?.roughnessMap]);
  // useTexture suspends; an empty record resolves immediately.
  const maps = useTexture(urls) as Record<string, Texture>;
  useLayoutEffect(() => {
    for (const [key, t] of Object.entries(maps)) {
      t.colorSpace = key === "map" ? SRGBColorSpace : NoColorSpace;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(size[0] / tileMetres, size[1] / tileMetres);
      t.anisotropy = budget.anisotropy;
      t.needsUpdate = true;
    }
  }, [maps, size[0], size[1], tileMetres, budget.anisotropy]);
  const arm = maps.armMap;
  return (
    <RoundedBox args={[size[0], thickness, size[1]]} radius={Math.min(0.003, thickness / 3)} smoothness={4} position={[0, -thickness / 2, 0]} receiveShadow castShadow>
      <meshPhysicalMaterial
        color={maps.map ? "#ffffff" : color}
        map={maps.map ?? null}
        normalMap={maps.normalMap ?? null}
        normalScale={[normalScale, normalScale]}
        aoMap={arm ?? null}
        roughnessMap={arm ?? maps.roughnessMap ?? null}
        metalnessMap={arm ?? null}
        roughness={arm || maps.roughnessMap ? 1 : roughness}
        metalness={arm ? 1 : 0}
        clearcoat={clearcoat}
        clearcoatRoughness={0.35}
      />
    </RoundedBox>
  );
}

/** A seamless cyclorama: floor from +depth to the cove, a quarter-circle cove, then the wall. */
export function cycloramaGeometry(width: number, depth: number, height: number, radius: number, segX = 8, segFloor = 24, segCove = 24, segWall = 16): BufferGeometry {
  const pts: { y: number; z: number; ny: number; nz: number }[] = [];
  for (let i = 0; i <= segFloor; i++) pts.push({ y: 0, z: depth - (depth * i) / segFloor, ny: 1, nz: 0 });
  for (let i = 1; i <= segCove; i++) {
    const a = (i / segCove) * (Math.PI / 2);
    // Centre of the cove at (y = r, z = -0); the surface bends from the floor up into the wall at z = -r.
    pts.push({ y: radius - Math.cos(a) * radius, z: -Math.sin(a) * radius, ny: Math.cos(a), nz: Math.sin(a) });
  }
  for (let i = 1; i <= segWall; i++) pts.push({ y: radius + ((height - radius) * i) / segWall, z: -radius, ny: 0, nz: 1 });
  let total = 0;
  const along = [0];
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
    along.push(total);
  }
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  for (let j = 0; j < pts.length; j++) {
    for (let i = 0; i <= segX; i++) {
      const u = i / segX;
      pos.push((u - 0.5) * width, pts[j].y, pts[j].z);
      nor.push(0, pts[j].ny, pts[j].nz);
      uv.push(u, along[j] / total);
    }
  }
  const idx: number[] = [];
  const row = segX + 1;
  for (let j = 0; j < pts.length - 1; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * row + i;
      const b = a + row;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function Sweep({ size, wallHeight, coveRadius, color, roughness, backdrop }: { size: [number, number]; wallHeight: number; coveRadius: number; color: string; roughness: number; backdrop: number }) {
  const geometry = useMemo(() => cycloramaGeometry(size[0], size[1], wallHeight, coveRadius), [size[0], size[1], wallHeight, coveRadius]);
  // A geometry passed as a prop is not disposed by R3F: free the old sweep
  // when a size prop builds a new one, and the last one on unmount.
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} metalness={0} emissive={color} emissiveIntensity={backdrop} />
    </mesh>
  );
}

export function Ground({
  variant,
  shadows = "auto",
  pcss = false,
  size = variant === "desk" ? [1.4, 0.7] : [8, 4],
  thickness = 0.025,
  textures,
  tileMetres = 1,
  color = "#ffffff",
  roughness = variant === "desk" ? 0.55 : 0.92,
  clearcoat = 0,
  normalScale = 0.6,
  wallHeight = 4,
  coveRadius = 1,
  backdrop = 1.3,
  bakeLight = [-1.6, 2.4, 1.6],
  dynamic = false,
  position = [0, 0, 0],
}: GroundProps) {
  const { budget } = useStage();
  const mode =
    shadows !== "auto"
      ? shadows
      : variant === "desk"
        ? budget.contactShadows
          ? "contact"
          : "shadowmap"
        : budget.accumulativeFrames > 0
          ? "accumulative"
          : budget.contactShadows
            ? "contact"
            : "shadowmap";
  const extent = Math.max(size[0], size[1]);
  return (
    <group position={position}>
      {variant === "desk" ? (
        <DeskSlab size={size} thickness={thickness} textures={textures} tileMetres={tileMetres} color={color} roughness={roughness} clearcoat={clearcoat} normalScale={normalScale} />
      ) : (
        <Sweep size={size} wallHeight={wallHeight} coveRadius={coveRadius} color={color} roughness={roughness} backdrop={backdrop} />
      )}
      {mode === "contact" && budget.contactShadows && (
        <ContactShadows position={[0, 0.0008, 0]} scale={extent} far={0.6} blur={2.2} opacity={0.55} resolution={budget.tier === "full" ? 1024 : 512} frames={dynamic ? Infinity : 1} />
      )}
      {mode === "accumulative" && budget.accumulativeFrames > 0 && (
        <AccumulativeShadows position={[0, 0.0008, 0]} frames={budget.accumulativeFrames} temporal={false} alphaTest={0.85} opacity={0.8} scale={extent} color="#3a3530" colorBlend={2}>
          <RandomizedLight amount={8} radius={0.6} ambient={0.4} intensity={1} position={bakeLight} bias={0.001} />
        </AccumulativeShadows>
      )}
      {pcss && budget.softShadows && <SoftShadows size={18} samples={12} focus={0.6} />}
    </group>
  );
}
