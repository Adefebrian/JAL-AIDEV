// Stage: the one persistent Canvas of a page, poster first.
//
//   mode "fixed"    a full-page canvas fixed behind the DOM (pointer-events
//                   none). One scene for the whole page; CameraRig moves the
//                   camera between named shots as sections scroll. Use it
//                   whenever 3D appears in more than one section.
//   mode "section"  a canvas bound to its parent section's box (the parent is
//                   position: relative). Use it for a single 3D section.
//
// Renderer contract (premium-3d.md section 4):
//   - outputColorSpace SRGBColorSpace; colour textures tagged sRGB by loaders.
//   - Tone mapping Neutral (Khronos PBR Neutral) by default, a measured
//     choice for a white-first page. Neutral keeps base colours true up to
//     about 0.76, reaches the page white #fafaf9 at a linear 2, and still
//     rolls a hot practical (a bulb, the brightest part of a desk pool) off to
//     white. Measured on three r186 for a neutral linear 1.0: Neutral #F0F0F0,
//     ACES #E2E2E2, AgX #CACACA; AgX needs a linear 9 to reach the page white
//     and ACES pushes a saturated orange shade toward yellow. "agx" stays for
//     a contained dark moment or a scene of strong emitters with no white
//     ground; "aces" for a punchier contained scene. PostFX applies the same
//     mode, since the composer turns renderer tone mapping off.
//   - Physically correct lights (three's only mode since r165): intensities
//     in candela for spot and point lights, lux for directional.
//   - Shadows on with PCF ("percentage"): r186 removed PCFSoftShadowMap and
//     its PCF path is a soft Vogel-disk filter driven by light.shadow.radius.
//   - DPR clamped by tier (never above 2), alpha true so the page shows
//     through wherever the scene does not paint, frameloop "demand": the scene
//     renders only when something calls invalidate() (CameraRig, a light
//     change, a loader), so an idle page costs nothing.
//   - WebGL context loss swaps back to the poster and never throws.
import {
  Component,
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping, SRGBColorSpace, type ToneMapping } from "three";
import { budgetFor, probeTier, type Tier, type TierBudget } from "./tier";
import { disposeAllProducts } from "./assets";
import { posterLayerStyle } from "./lifecycle";

export type ToneMappingName = "agx" | "aces" | "neutral";

export const TONE_MAPPING: Record<ToneMappingName, ToneMapping> = {
  agx: AgXToneMapping,
  aces: ACESFilmicToneMapping,
  neutral: NeutralToneMapping,
};

export interface StageState {
  tier: Tier;
  budget: TierBudget;
  toneMapping: ToneMappingName;
  exposure: number;
  /**
   * prefers-reduced-motion: reduce. The probe sends it to the poster; it is
   * true on a live scene only when the page forced a tier (a "View in 3D"
   * opt-in). CameraRig reads it and cuts between shots with no damping.
   */
  reducedMotion: boolean;
}

const StageContext = createContext<StageState | null>(null);

/** Tier, budget, and tone mapping for scene components. Throws outside a Stage. */
export function useStage(): StageState {
  const s = useContext(StageContext);
  if (!s) throw new Error("useStage must be used inside <Stage>");
  return s;
}

/** The Stage state, or null outside a Stage (for components that also work standalone). */
export function useMaybeStage(): StageState | null {
  return useContext(StageContext);
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** prefers-reduced-motion, kept current if the visitor changes it. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(REDUCED_MOTION);
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

/** Probe once on mount; null until the probe ran (render the poster meanwhile). */
export function useSceneTier(): Tier | null {
  const [tier, setTier] = useState<Tier | null>(null);
  useEffect(() => {
    setTier(probeTier().tier);
  }, []);
  return tier;
}

export interface StageProps {
  /** The poster: an <img> element or a src string. It is the LCP element and every fallback state. */
  poster: ReactNode | string;
  /** Poster alt text when `poster` is a src string. Empty when the scene is decorative. */
  posterAlt?: string;
  mode?: "fixed" | "section";
  /** Forced tier; otherwise probed on mount. */
  tier?: Tier;
  toneMapping?: ToneMappingName;
  exposure?: number;
  /** First camera pose. CameraRig takes over when it mounts. */
  camera?: { position: [number, number, number]; fov?: number; near?: number; far?: number };
  /** Called once when the first full frame is on screen. */
  onReady?: () => void;
  /** Called when the scene gives up (context loss, loader error) and the poster shows. */
  onFallback?: (reason: string) => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

function RendererSetup({ toneMapping, exposure, onLost }: { toneMapping: ToneMappingName; exposure: number; onLost: (r: string) => void }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    gl.outputColorSpace = SRGBColorSpace;
    gl.toneMapping = TONE_MAPPING[toneMapping];
    gl.toneMappingExposure = exposure;
    gl.setClearColor(0x000000, 0);
    invalidate();
  }, [gl, toneMapping, exposure, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onLost("webgl context lost");
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

/** A loader or compile error inside the scene falls back to the poster instead of unmounting the page. */
class SceneBoundary extends Component<{ onError: (reason: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(`scene error: ${error instanceof Error ? error.message : String(error)}`);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Ready({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    // Everything under the Suspense boundary resolved and Preload uploaded
    // the textures. Wait two frames so the first full frame is presented.
    invalidate();
    let a = 0;
    let b = 0;
    a = requestAnimationFrame(() => {
      invalidate();
      b = requestAnimationFrame(onReady);
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [invalidate, onReady]);
  return null;
}

export function Stage({
  poster,
  posterAlt = "",
  mode = "section",
  tier: forcedTier,
  toneMapping = "neutral",
  exposure = 1,
  camera = { position: [0, 1.2, 3], fov: 32 },
  onReady,
  onFallback,
  className,
  style,
  children,
}: StageProps) {
  const probed = useSceneTier();
  const tier = forcedTier ?? probed;
  const [failed, setFailed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();

  const coarse = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  const width = typeof window !== "undefined" ? window.innerWidth : 1280;
  const budget = useMemo(() => (tier ? budgetFor(tier, width, coarse) : null), [tier, width, coarse]);
  const state = useMemo<StageState | null>(
    () => (tier && budget ? { tier, budget, toneMapping, exposure, reducedMotion } : null),
    [tier, budget, toneMapping, exposure, reducedMotion],
  );

  const fallback = useCallback(
    (reason: string) => {
      setFailed(reason);
      console.warn(`[scene] poster fallback: ${reason}`);
      onFallback?.(reason);
    },
    [onFallback],
  );
  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  // Free every cached glTF when the page's scene unmounts.
  useEffect(() => () => disposeAllProducts(), []);

  const live = state !== null && state.tier !== "static" && failed === null;
  const box: CSSProperties =
    mode === "fixed"
      ? { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }
      : { position: "absolute", inset: 0 };

  const posterEl =
    typeof poster === "string" ? (
      <img
        src={poster}
        alt={posterAlt}
        fetchPriority="high"
        decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      poster
    );

  return (
    <div className={className} style={{ ...box, ...style }} data-scene-tier={state?.tier ?? "pending"} data-scene-ready={ready && live ? "true" : "false"}>
      {/* The poster stays mounted underneath: it is the LCP element and every
          fallback. Hidden (not removed) once the live scene is on screen, since
          the alpha canvas would otherwise let the static product show through
          after the camera leaves the first shot. */}
      <div aria-hidden={live && ready ? true : undefined} data-scene-poster="" style={posterLayerStyle(live, ready)}>
        {posterEl}
      </div>
      {live && state && (
        <SceneBoundary onError={fallback}>
        <Canvas
          aria-hidden="true"
          frameloop="demand"
          dpr={state.budget.dpr}
          shadows="percentage"
          camera={{ position: camera.position, fov: camera.fov ?? 32, near: camera.near ?? 0.05, far: camera.far ?? 60 }}
          gl={{ antialias: !state.budget.postFX, alpha: true, powerPreference: "high-performance", stencil: false }}
          style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 300ms cubic-bezier(0.2, 0, 0, 1)" }}
          fallback={null}
        >
          <StageContext.Provider value={state}>
            <RendererSetup toneMapping={toneMapping} exposure={exposure} onLost={fallback} />
            <Suspense fallback={null}>
              {children}
              <Preload all />
              <Ready onReady={handleReady} />
            </Suspense>
          </StageContext.Provider>
        </Canvas>
        </SceneBoundary>
      )}
    </div>
  );
}
