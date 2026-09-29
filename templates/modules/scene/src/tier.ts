// Device tiers for the scene module, the same idea as `imm.tier` in
// skills/jal-immersive/references/performance.md section 3, collapsed to the
// three states a scene actually ships:
//
//   full     T3 desktop full and T2 mobile full: the live scene, post on desktop
//   reduced  T1: the live scene at DPR 1, one shadow map, no post
//   static   T0: the poster and the DOM only, no WebGL at all
//
// selectTier and budgetFor are pure. probeTier reads the browser once and
// releases its probe context.

export type Tier = "full" | "reduced" | "static";

export interface TierSignals {
  reducedMotion: boolean;
  saveData: boolean;
  webgl2: boolean;
  coarsePointer: boolean;
  viewportWidth: number;
  deviceMemory?: number;
  cores?: number;
  /** UNMASKED_RENDERER_WEBGL, when the browser exposes it. */
  renderer?: string;
  maxTextureSize?: number;
  /** A forced tier from `?scene-tier=` (captures and debugging only). Never overrides reducedMotion, saveData, or a missing WebGL2. */
  forced?: Tier;
}

/** Software rasterisers: a visitor on one of these gets the poster. */
export const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;

// A forced tier (captures, debugging) overrides only the capability guesses:
// the software-renderer, texture-size, memory, and core checks. The visitor's
// own choices (reduced motion, save-data) and a missing WebGL2 still give the
// poster, whatever the URL says.
export function selectTier(s: TierSignals): Tier {
  if (s.reducedMotion || s.saveData || !s.webgl2) return "static";
  if (s.forced) return s.forced;
  if (s.renderer && SOFTWARE_RENDERER.test(s.renderer)) return "static";
  if (s.maxTextureSize !== undefined && s.maxTextureSize < 4096) return "static";
  const lowMemory = s.deviceMemory !== undefined && s.deviceMemory <= 4;
  const fewCores = s.cores !== undefined && s.cores <= 4;
  if (s.coarsePointer && (lowMemory || fewCores)) return "reduced";
  return "full";
}

export interface TierBudget {
  tier: Tier;
  /** R3F dpr range. The law ceiling is 2; tier caps are tighter. */
  dpr: [number, number];
  shadowMapSize: number;
  /** How many lights may cast shadows. */
  shadowCasters: number;
  anisotropy: number;
  postFX: boolean;
  ao: boolean;
  aoQuality: "performance" | "low" | "medium" | "high";
  dof: boolean;
  contactShadows: boolean;
  /** Frames for AccumulativeShadows (a one-time cost at load). 0 disables it. */
  accumulativeFrames: number;
  softShadows: boolean;
}

/** Desktop is a fine pointer at 1024 px or wider (T3); everything else full is T2. */
export function budgetFor(tier: Tier, viewportWidth: number, coarsePointer: boolean): TierBudget {
  const desktop = !coarsePointer && viewportWidth >= 1024;
  if (tier === "full" && desktop) {
    return {
      tier, dpr: [1, 1.5], shadowMapSize: 2048, shadowCasters: 2, anisotropy: 8,
      postFX: true, ao: true, aoQuality: "medium", dof: true,
      contactShadows: true, accumulativeFrames: 80, softShadows: true,
    };
  }
  if (tier === "full") {
    return {
      tier, dpr: [1, 1.25], shadowMapSize: 1024, shadowCasters: 1, anisotropy: 4,
      postFX: false, ao: false, aoQuality: "performance", dof: false,
      contactShadows: true, accumulativeFrames: 40, softShadows: false,
    };
  }
  if (tier === "reduced") {
    return {
      tier, dpr: [1, 1], shadowMapSize: 1024, shadowCasters: 1, anisotropy: 2,
      postFX: false, ao: false, aoQuality: "performance", dof: false,
      contactShadows: false, accumulativeFrames: 24, softShadows: false,
    };
  }
  return {
    tier, dpr: [1, 1], shadowMapSize: 0, shadowCasters: 0, anisotropy: 1,
    postFX: false, ao: false, aoQuality: "performance", dof: false,
    contactShadows: false, accumulativeFrames: 0, softShadows: false,
  };
}

const FORCE_PARAM = "scene-tier";

export function parseForced(search: string): Tier | undefined {
  const v = new URLSearchParams(search).get(FORCE_PARAM);
  return v === "full" || v === "reduced" || v === "static" ? v : undefined;
}

/**
 * Reads the browser once: media queries, connection, memory, cores, and a
 * throwaway WebGL2 context for the renderer string and texture limit. The
 * probe context is released with WEBGL_lose_context so it never counts
 * against the page's one canvas.
 */
export function readSignals(win: Window = window): TierSignals {
  const nav = win.navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const mm = (q: string) => (typeof win.matchMedia === "function" ? win.matchMedia(q).matches : false);
  const signals: TierSignals = {
    reducedMotion: mm("(prefers-reduced-motion: reduce)"),
    saveData: nav.connection?.saveData === true,
    webgl2: false,
    coarsePointer: mm("(pointer: coarse)"),
    viewportWidth: win.innerWidth,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    forced: parseForced(win.location?.search ?? ""),
  };
  try {
    const canvas = win.document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
    if (gl) {
      signals.webgl2 = true;
      signals.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) signals.renderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    signals.webgl2 = false;
  }
  return signals;
}

export function probeTier(win: Window = window): { tier: Tier; signals: TierSignals } {
  const signals = readSignals(win);
  return { tier: selectTier(signals), signals };
}
