// PostFX: the smallest post stack that finishes a lit scene, gated by tier.
// @react-three/postprocessing and postprocessing are approved by Brian
// (2026-09-29) for this module.
//
// Order: N8AO (ambient occlusion in the creases the shadow maps miss), then
// DepthOfField (a subtle
// focus falloff), ToneMapping (the Stage's mode, because the composer turns
// renderer tone mapping off), SMAA (after tone mapping, where edges are
// perceptual). The composer renders at half-float so bright emitters stay above
// 1.0 until tone mapping.
//
// Tier gate (budgetFor): the whole stack runs on desktop full only. Mobile
// full and reduced render without a composer: the renderer's own tone
// mapping and MSAA from the context (antialias on when postFX is off).
//
// Law (premium-3d.md section 6): post never manufactures form or light. The
// scene must already read as finished with post off (the no-post baseline
// capture). No bloom, ever (Brian's ruling: glow is banned outside noyzzi);
// the light is shown by what it lights. No chromatic aberration, vignette, noise, glitch, or god rays.
import { DepthOfField, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { HalfFloatType, Vector3 } from "three";
import { useMemo, type ReactElement } from "react";
import { useStage, type ToneMappingName } from "./Stage";
import type { PostFXProps } from "./PostFX";

const MODE: Record<ToneMappingName, ToneMappingMode> = {
  agx: ToneMappingMode.AGX,
  aces: ToneMappingMode.ACES_FILMIC,
  neutral: ToneMappingMode.NEUTRAL,
};


export default function PostFXImpl({ aoRadius = 0.08, aoIntensity = 1.2, aoHalfRes = false, ao = true, focus, bokehScale = 1.2 }: PostFXProps) {
  const { budget, toneMapping } = useStage();
  const target = useMemo(() => (focus ? new Vector3(...focus) : undefined), [focus?.[0], focus?.[1], focus?.[2]]);
  if (!budget.postFX) return null;
  const effects: ReactElement[] = [];
  if (ao && budget.ao) {
    effects.push(<N8AO key="ao" aoRadius={aoRadius} distanceFalloff={0.6} intensity={aoIntensity} quality={budget.aoQuality} halfRes={aoHalfRes} depthAwareUpsampling />);
  }
  if (target && budget.dof) {
    effects.push(<DepthOfField key="dof" target={target} focalLength={0.05} bokehScale={Math.min(2, bokehScale)} />);
  }
  effects.push(<ToneMapping key="tm" mode={MODE[toneMapping]} />);
  effects.push(<SMAA key="aa" />);
  return (
    <EffectComposer multisampling={0} frameBufferType={HalfFloatType} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
