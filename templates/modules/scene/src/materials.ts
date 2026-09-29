// Physically based material presets on MeshPhysicalMaterial. Each preset is
// a set of authored roles (base colour, metalness, roughness, and the one or
// two physical layers that make the material read as itself). Values are in
// linear working space; colours are sRGB hex and converted by three.
//
// Use a preset for any surface the scene authors (a procedural part, a client
// model with placeholder materials). A Poly Haven or client glTF that ships
// real PBR maps keeps its maps: applyPreset only overrides the scalar roles
// you name and never throws a texture away.
//
//   anodisedAluminium  metal, satin bead-blast, tinted oxide colour. Laptop
//                      shells, lamp heads, audio gear. Reads by its broad soft
//                      highlight; needs an environment to reflect.
//   brushedMetal       metal with anisotropic streaks along the tangent. Knobs,
//                      bezels, stems. Reads by the stretched highlight; the
//                      anisotropy direction follows the UV u axis.
//   satinPlastic       dielectric, mid roughness, a faint clear coat. Housings,
//                      buttons, cable jackets. Reads by a soft highlight with a
//                      slightly sharper top layer.
//   ceramicGlaze       dielectric body under a glossy clear coat. Mugs, vases,
//                      tiles. Reads by the sharp coat reflection over a matte
//                      body.
//   frostedDiffuser    transmissive acrylic with rough refraction and a real
//                      thickness. Lamp diffusers, light guides. Reads by the
//                      blurred light through it; costs a transmission pass.
//   fabricSheen        dielectric, rough, with sheen for fibre back-scatter.
//                      Cloth, felt, speaker grilles. Reads by the soft rim that
//                      sheen gives at grazing angles.
import { Color, MeshPhysicalMaterial, MeshStandardMaterial, type MeshPhysicalMaterialParameters, type Material } from "three";

export type PresetName = "anodisedAluminium" | "brushedMetal" | "satinPlastic" | "ceramicGlaze" | "frostedDiffuser" | "fabricSheen";

export interface Preset {
  /** What the eye reads to accept the material, for the imm.taste self-check. */
  reads: string;
  /** Relative GPU cost on top of MeshStandardMaterial. */
  cost: "base" | "layer" | "transmission";
  params: MeshPhysicalMaterialParameters;
}

export const PRESETS: Record<PresetName, Preset> = {
  anodisedAluminium: {
    reads: "broad soft highlight, even satin tone, colour in the reflection",
    cost: "base",
    params: { color: "#c9ccd1", metalness: 1, roughness: 0.34, envMapIntensity: 1 },
  },
  brushedMetal: {
    reads: "highlight stretched along the brush direction",
    cost: "layer",
    params: { color: "#d8d8d6", metalness: 1, roughness: 0.3, anisotropy: 0.75, anisotropyRotation: 0, envMapIntensity: 1 },
  },
  satinPlastic: {
    reads: "soft highlight with a slightly crisper top layer, no mirror",
    cost: "layer",
    params: { color: "#e9e7e2", metalness: 0, roughness: 0.48, clearcoat: 0.25, clearcoatRoughness: 0.45, specularIntensity: 0.5, ior: 1.46 },
  },
  ceramicGlaze: {
    reads: "sharp coat reflection over a matte body, rim darkening",
    cost: "layer",
    params: { color: "#f1eee8", metalness: 0, roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.06, ior: 1.52, specularIntensity: 0.6 },
  },
  frostedDiffuser: {
    reads: "light glows through as a blurred refraction, edges carry thickness",
    cost: "transmission",
    params: {
      color: "#ffffff",
      metalness: 0,
      roughness: 0.6,
      transmission: 1,
      thickness: 0.004,
      ior: 1.49,
      attenuationColor: new Color("#fff4e6"),
      attenuationDistance: 0.05,
      specularIntensity: 0.4,
    },
  },
  fabricSheen: {
    reads: "soft rim at grazing angles, no specular hotspot",
    cost: "layer",
    params: { color: "#8c8a84", metalness: 0, roughness: 0.92, sheen: 1, sheenRoughness: 0.7, sheenColor: new Color("#d9d6cf"), specularIntensity: 0.2 },
  },
};

/** A new material from a preset, with optional overrides (colour, maps). */
export function createMaterial(name: PresetName, overrides: MeshPhysicalMaterialParameters = {}): MeshPhysicalMaterial {
  const m = new MeshPhysicalMaterial({ ...PRESETS[name].params, ...overrides });
  m.name = m.name || name;
  return m;
}

const SCALARS: (keyof MeshPhysicalMaterialParameters)[] = [
  "metalness", "roughness", "clearcoat", "clearcoatRoughness", "sheen", "sheenRoughness",
  "transmission", "thickness", "ior", "specularIntensity", "anisotropy", "anisotropyRotation", "attenuationDistance",
];

/**
 * Apply a preset's scalar roles to an existing material, keeping every map it
 * already has. A MeshStandardMaterial from a glTF is upgraded to physical so
 * the preset's layers exist; the old material is disposed.
 */
export function applyPreset(material: Material, name: PresetName, keepColor = true): MeshPhysicalMaterial {
  const src = material as MeshPhysicalMaterial;
  const target = src instanceof MeshPhysicalMaterial ? src : new MeshPhysicalMaterial();
  if (target !== src) {
    // Carry the glTF's maps and colour across with the standard copy (the
    // physical copy would read physical fields the source does not have),
    // then restore the PHYSICAL define that the standard copy resets.
    MeshStandardMaterial.prototype.copy.call(target, src as unknown as MeshStandardMaterial);
    target.defines = { STANDARD: "", PHYSICAL: "" };
    material.dispose();
  }
  const p = PRESETS[name].params as Record<string, unknown>;
  for (const k of SCALARS) if (p[k] !== undefined) (target as any)[k] = p[k];
  if (!keepColor && p.color !== undefined) target.color.set(p.color as string);
  if (p.sheenColor instanceof Color) target.sheenColor.copy(p.sheenColor);
  if (p.attenuationColor instanceof Color) target.attenuationColor.copy(p.attenuationColor);
  target.needsUpdate = true;
  return target;
}
