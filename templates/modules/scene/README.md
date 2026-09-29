# Scene module (opt-in)

A persistent, physically lit 3D scene for immersive JAL pages: one Canvas with colour management and tier gating, an HDRI environment, a shadow-casting key light, practical lights for products that emit light, a real receiving surface, material presets, a tier-gated post stack, a camera that moves between named shots as sections scroll, and glTF loading with disposal. The quality bar it serves is `skills/jal-immersive/references/premium-3d.md`.

The base template stays dependency-light: this module is copied into a client project only when a page is immersive (JEV `imm.gate` passed and `imm.tech` picked `webgl` with `r3f`).

## When to copy it

- A section's 3D earns its place (`imm.gate`), and the scene shows a product, a desk, a room, or any lit object.
- Always when 3D appears in more than one section: the module's one `Stage` plus `CameraRig` replaces several canvases.
- Not for a 2D canvas, a CSS or DOM effect, a WebGPU/TSL-only scene, or a noyzzi piece (those follow their own recipes).

## How to copy it

From the client repo root (a JAL monorepo scaffolded from `templates/monorepo`):

```sh
cp -R <jal-aidev>/templates/modules/scene packages/scene
```

Then:

0. Replace `__APP_NAME__` with the project's name in `packages/scene/package.json` and `packages/scene/src/` (the same token every template package uses), add `"@<project>/scene": "workspace:*"` and `"gsap": "3.15.0"` (if the app has no GSAP yet) to `apps/web/package.json` dependencies, and run `bun install`.

1. React 19.x below 19.4 in `apps/web` (the template already ships `~19.3.0`; R3F 9 needs `>=19 <19.4`).
2. Fetch assets into the app with `bun scripts/assets/polyhaven.ts get ... --out apps/web/public/assets/polyhaven` (run from the client root, with the plugin's script path); commit `ASSETS.md` with them.
3. In `apps/web/build.ts`, copy decoders to a versioned path when a model uses them: `node_modules/three/examples/jsm/libs/draco/gltf/` to `dist/vendor/r186/draco/`, and `node_modules/three/examples/jsm/libs/basis/` to `dist/vendor/r186/basis/` for KTX2. Poly Haven glTFs need neither.
4. Import the scene lazily from the page (`lazy(() => import("./Scene"))`) so three loads only after the poster.
5. Record the ADR: the module, its pinned versions, and the Poly Haven assets used.

## Pinned versions (verified 2026-09-29 against the npm registry)

| Package | Version | Peer constraints that matter |
|---|---|---|
| `three` | 0.186.1 | `@types/three` 0.186.0 |
| `@react-three/fiber` | 9.8.1 | `react >=19 <19.4`, `three >=0.156` |
| `@react-three/drei` | 10.7.9 | `react ^19`, `three >=0.159`, `@react-three/fiber ^9.0.0` |
| `@react-three/postprocessing` | 3.1.3 | `react ^19.0.0`, `three >=0.156.0`, `postprocessing ^6.36.0`, `@react-three/fiber >=9.7.0`; bundles `n8ao ^2.0.0` |
| `postprocessing` | 6.39.5 | `three >=0.168.0 <0.187.0`: this caps three below r187 |
| `gsap` (peer) | ^3.15.0 | the app's own copy, shared with its motion code |

Approved by Brian (2026-09-29): `@react-three/postprocessing` and `postprocessing` for this module, and CC0 Poly Haven assets fetched into the client project at build time. Bump three only together with `postprocessing` once its peer range allows it.

## File map

| File | Holds |
|---|---|
| `src/Stage.tsx` | The one Canvas: poster first, tier probe, sRGB output, Neutral tone mapping (measured choice, see the file header), physically correct lights, PCF shadows, DPR by tier, `frameloop="demand"`, context-loss and error fallback to the poster, disposal on unmount |
| `src/tier.ts` | `selectTier` (full, reduced, static), `budgetFor` (DPR, shadow casters and map size, post, AO, DoF, contact and accumulative shadows), `probeTier` (media queries, memory, cores, a throwaway WebGL2 probe for the renderer string) |
| `src/EnvironmentRig.tsx` | Local HDRI fill and reflections, background off, intensity and rotation knobs |
| `src/LightRig.tsx` | `KeyLight` (shadow-casting SpotLight), `PracticalLight` (a real light at a product's emitter, kelvin-driven colour, emitter emissive synced), `LightRig` |
| `src/light-math.ts` | `kelvinToLinearRGB` (Planckian locus to linear sRGB), `mixKelvin` (mired), `spotCandela`, `pointCandela`, `kelvinToHex` |
| `src/Ground.tsx` | Desk slab (rounded edge, PBR maps, packed ARM) or seamless sweep with a backdrop light; contact, accumulative, or shadow-map grounding; optional PCSS |
| `src/materials.ts` | Six MeshPhysicalMaterial presets and `applyPreset` for glTF materials |
| `src/PostFX.tsx`, `src/PostFXImpl.tsx` | N8AO, DepthOfField (no bloom), ToneMapping, SMAA; the implementation is a lazy chunk loaded only on the desktop full tier |
| `src/CameraRig.tsx`, `src/shots.ts` | Named shots, ScrollTrigger on `getScroller()`, damped moves, portrait poses, `progressRef` for light beats |
| `src/assets.tsx` | `Product` (useGLTF with Draco, Meshopt, KTX2 from local decoders, shadow flags, presets, anisotropy), `preloadProduct`, `disposeProduct`, `disposeAllProducts` |
| `src/lifecycle.ts` | Pure helpers: the poster layer style (hidden under a ready live scene), CameraRig's content key, the per-instance Product registry |
| `src/helpers.test.ts` | Tests for kelvin, photometry, shot interpolation, tier selection, and the lifecycle helpers |
| `src/components.test.tsx` | Component tests on a stub renderer (no workspace install): poster visibility, reduced motion into CameraRig, trigger keying, sweep disposal |

## Tiers and cost

| Tier | When | Ships |
|---|---|---|
| full, desktop | fine pointer, 1024 px or wider, not weak | DPR up to 1.5, two shadow casters at 2048, PostFX (AO, DoF, SMAA), contact shadows, accumulative shadows 80 frames, PCSS allowed |
| full, mobile | coarse pointer or narrow, not weak | DPR up to 1.25, one caster at 1024, no post, contact shadows |
| reduced | coarse pointer with 4 GB or less, or 4 cores or fewer | DPR 1, one caster at 1024, no post, no contact shadows |
| static | reduced motion, save-data, no WebGL2, a software GPU, max texture under 4096 | the poster and the DOM, no WebGL |

Once the live scene reports ready, the poster wrapper gets `visibility: hidden` (the canvas is transparent, so a visible poster would show its product through the scene); it stays mounted and shows again on context loss or a scene error.

`?scene-tier=full|reduced|static` forces a tier over the capability checks only (software GPU, texture limit, memory, cores): reduced motion, save-data, and a missing WebGL2 still get the poster. Headless Chrome for `ui_shots` does not emulate reduced motion, so captures still get the forced full tier. The critic's `ui_shots` captures run on SwiftShader, which the probe sends to the poster, so `ui_shots` with `webgl: true` appends `?scene-tier=full` on its own (unless the URL already sets a tier); the lead captures the poster once with `?scene-tier=static` (it must match the scene's framing).

Grounding cost: shadow maps cost one depth pass per casting light per rendered frame; `ContactShadows` with `frames={1}` is a one-time cost (Infinity re-renders the scene every frame, about 0.3 to 0.8 ms on a desktop GPU); `AccumulativeShadows` renders N shadow frames once at load and then nothing, but bakes the light position, so it suits a sweep under a static key only.

## Budgets

Target: the hero scene chunk under 180 KB gzip excluding three. Measured on the proof page (Bun.build, minified, 2026-09-29):

| Chunk | gzip | Loaded on |
|---|---|---|
| Page entry (React, ReactDOM, page) | 66 KB | every tier |
| Shared vendor (three, R3F and its reconciler, the drei parts used) | 321 KB | full and reduced |
| Scene entry (this module, GSAP and ScrollTrigger, the page's scene) | 53 KB | full and reduced |
| PostFX (postprocessing, N8AO) | 162 KB | full desktop only |

three alone is about 190 KB gzip, and R3F imports the whole three namespace, so three cannot be tree-shaken under R3F. Excluding three, a mobile or reduced visitor loads about 190 KB of scene code (at the target, not under it); a desktop visitor about 350 KB. Realistic numbers: a lit R3F product scene with drei is 370 to 400 KB gzip on mobile and 530 to 560 KB with post on desktop. The poster is the LCP element, so this weight never blocks first paint; keep assets lean instead (1k textures, one HDRI at 1k, about 1.5 MB, models under 150k triangles).

## Example

```tsx
import { useRef, type MutableRefObject } from "react";
import { CameraRig, EnvironmentRig, Ground, LightRig, PostFX, Product, Stage, preloadProduct, useStage, type Shot } from "@<project>/scene";

const A = "/assets/polyhaven";
const LAMP = `${A}/desk_lamp_arm_01/desk_lamp_arm_01_1k.gltf`;
preloadProduct(LAMP);
const shots: Shot[] = [
  { name: "hero", position: [0.8, 0.62, 1.5], target: [-0.16, 0.3, -0.1], lens: 40, portrait: { position: [0.74, 0.7, 0.97], target: [0.12, 0.47, -0.1] } },
  { name: "pool", position: [0.55, 0.3, 0.62], target: [0.08, 0.06, -0.04], lens: 50 },
];

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  // The Stage's prefers-reduced-motion. It is true on a live scene only behind
  // a "View in 3D" opt-in (<Stage tier="full">); the rig then cuts between
  // shots with no damping. CameraRig reads it from the Stage on its own; it
  // is passed here to show the wiring.
  const { reducedMotion } = useStage();
  return <CameraRig shots={shots} sections={["#hero", "#pool"]} progressRef={progress} reducedMotion={reducedMotion} />;
}

export default function Scene() {
  const progress = useRef(0);
  return (
    <Stage mode="fixed" poster="/poster.webp">
      <EnvironmentRig files={`${A}/studio_small_09/studio_small_09_1k.hdr`} intensity={0.8} rotationY={1.2} />
      <LightRig keyLight={{ position: [-2.6, 3.8, 2.6], intensity: 15, angle: 0.62, penumbra: 0.6 }} practicals={[{ position: [-0.08, 0.61, -0.12], target: [0.04, 0, 0.08], intensity: 2.7, kelvin: 3200 }]} />
      <Ground variant="desk" size={[3.6, 1.6]} position={[0, 0, 0.43]} textures={{ map: `${A}/ash_veneer/ash_veneer_diff_1k.jpg`, normalMap: `${A}/ash_veneer/ash_veneer_nor_gl_1k.jpg`, armMap: `${A}/ash_veneer/ash_veneer_arm_1k.jpg` }} tileMetres={0.9} />
      <Ground variant="sweep" size={[10, 0.6]} position={[0, -0.76, -0.75]} coveRadius={0.3} color="#fafaf9" shadows="shadowmap" />
      <Product src={LAMP} position={[-0.12, -0.02, -0.37]} rotation={[0, Math.PI, 0]} />
      <Rig progress={progress} />
      <PostFX focus={[0.05, 0.2, -0.05]} bokehScale={0.5} aoRadius={0.05} />
    </Stage>
  );
}
```

For a lamp, pass the bulb material to the practical (`emitter`) and turn its mesh's `castShadow` off through `Product onScene`; drive `kelvin` with a ref for a scroll beat (`mixKelvin(3200, 5200, progress.current)`).

## Checks

```sh
bun test            # helpers.test.ts
bunx tsc --noEmit   # needs the workspace installed (packages/ui for getScroller)
```

Then the verification in `skills/jal-immersive/SKILL.md` section 7 and the self-check in `premium-3d.md` section 8.
