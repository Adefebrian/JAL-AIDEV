// @__APP_NAME__/scene: the opt-in premium 3D scene module. Copied into
// packages/scene only when a page is immersive; see README.md.
export { Stage, useStage, useSceneTier, TONE_MAPPING } from "./Stage";
export type { StageProps, StageState, ToneMappingName } from "./Stage";
export { EnvironmentRig } from "./EnvironmentRig";
export type { EnvironmentRigProps } from "./EnvironmentRig";
export { LightRig, KeyLight, PracticalLight } from "./LightRig";
export type { LightRigProps, KeyLightProps, PracticalLightProps, Live } from "./LightRig";
export { Ground, cycloramaGeometry } from "./Ground";
export type { GroundProps, DeskTextures } from "./Ground";
export { PRESETS, createMaterial, applyPreset } from "./materials";
export type { PresetName, Preset } from "./materials";
export { PostFX } from "./PostFX";
export type { PostFXProps } from "./PostFX";
export { CameraRig } from "./CameraRig";
export type { CameraRigProps } from "./CameraRig";
export { Product, preloadProduct, disposeProduct, disposeAllProducts, configureDecoders, DECODERS } from "./assets";
export type { ProductProps, LoadOptions } from "./assets";
export { selectTier, budgetFor, probeTier, readSignals, parseForced } from "./tier";
export type { Tier, TierSignals, TierBudget } from "./tier";
export { lensToFov, responsiveFov, sampleShots, progressToShotIndex, smoothstep, damp, poseFor } from "./shots";
export type { Shot, ShotPose, SampledPose, Vec3 } from "./shots";
export { kelvinToLinearRGB, kelvinToHex, planckianXY, linearToSrgb, spotCandela, pointCandela, mixKelvin, KELVIN } from "./light-math";
export type { RGB } from "./light-math";
