// Asset loading: a real glTF product, loaded under the Stage's Suspense
// boundary (the poster covers the wait), preloaded for the first shot, and
// disposed when the scene unmounts.
//
// Compression, all decoded from files the app serves itself (never drei's
// gstatic Draco default, never a CDN; three-foundations.md section 7):
//   Draco    geometry compression. The build copies
//            node_modules/three/examples/jsm/libs/draco/gltf/ to
//            dist/vendor/r186/draco/; pass draco (or configureDecoders).
//   Meshopt  geometry and animation compression (gltfpack or gltf-transform
//            output). The decoder ships inline in three-stdlib, no files.
//   KTX2     GPU texture compression (Basis Universal). The build copies
//            node_modules/three/examples/jsm/libs/basis/ to
//            dist/vendor/r186/basis/; pass ktx2. The loader is created once
//            per renderer (it spins up transcoder workers) and disposed with
//            the scene.
// Poly Haven glTFs ship plain glTF with JPG textures: none of the above is
// needed for them. Compress a client's heavy model offline (gltf-transform is
// an approval candidate, ask Brian) and turn the matching flag on.
//
// Units: glTF is metres. A model authored in centimetres gets unitScale 0.01
// here, once, at load (the scene's visual contract), and nowhere else.
import { useLayoutEffect, useMemo, type ReactNode } from "react";
import { useThree, type ThreeElements } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Mesh, type Material, type Object3D, type Texture, type WebGLRenderer } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { applyPreset, type PresetName } from "./materials";
import { InstanceRegistry } from "./lifecycle";

export const DECODERS = {
  draco: "/vendor/r186/draco/",
  basis: "/vendor/r186/basis/",
};

/** Point the decoders at the app's own versioned vendor paths. Call once before any load. */
export function configureDecoders(paths: Partial<typeof DECODERS>) {
  Object.assign(DECODERS, paths);
  useGLTF.setDecoderPath(DECODERS.draco);
}

let ktx2: KTX2Loader | null = null;
function ktx2For(gl: WebGLRenderer): KTX2Loader {
  if (!ktx2) ktx2 = new KTX2Loader().setTranscoderPath(DECODERS.basis).detectSupport(gl);
  return ktx2;
}

export interface LoadOptions {
  draco?: boolean;
  meshopt?: boolean;
  ktx2?: boolean;
}

// The cached glTF scene per file (its geometry and textures are shared by
// every clone), and every mounted clone per <Product> instance (its
// materials are its own). Keyed per instance, so a second <Product> of the
// same file never hides the first clone from disposal.
const originals = new Map<string, Object3D>();
const instances = new InstanceRegistry<Object3D>();

function extendFor(opts: LoadOptions, gl?: WebGLRenderer) {
  return opts.ktx2 && gl ? (loader: any) => loader.setKTX2Loader(ktx2For(gl)) : undefined;
}

/**
 * Start the first shot's download before the Stage mounts (call at module top
 * level of the scene chunk). KTX2 needs the renderer, so a KTX2 model
 * preloads from inside the Canvas instead: render <Product> early.
 */
export function preloadProduct(src: string, opts: LoadOptions = {}) {
  useGLTF.preload(src, opts.draco ? DECODERS.draco : false, opts.meshopt ?? false);
}

export type ProductProps = Omit<ThreeElements["group"], "children"> & {
  src: string;
  load?: LoadOptions;
  /** Material name (as authored in the glTF) to preset. Maps are kept. */
  presets?: Record<string, PresetName>;
  unitScale?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Receives the cloned scene once, for finding an emitter material or a bulb node. */
  onScene?: (scene: Object3D) => void;
  children?: ReactNode;
};

export function Product({ src, load = {}, presets, unitScale = 1, castShadow = true, receiveShadow = true, onScene, children, ...group }: ProductProps) {
  const gl = useThree((s) => s.gl);
  const gltf = useGLTF(src, load.draco ? DECODERS.draco : false, load.meshopt ?? false, extendFor(load, gl));
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    // Clone materials too, so presets and emissive changes never leak into
    // the cache shared by another <Product> of the same file.
    clone.traverse((o) => {
      if (o instanceof Mesh) {
        o.material = Array.isArray(o.material) ? o.material.map((m: Material) => m.clone()) : (o.material as Material).clone();
      }
    });
    return clone;
  }, [gltf.scene]);

  // Register this instance's clone; on unmount (or a new file) free the
  // clone's own materials. Geometry and textures belong to the cache and go
  // with disposeProduct.
  useLayoutEffect(() => {
    originals.set(src, gltf.scene);
    const id = instances.add(src, scene);
    return () => {
      if (instances.remove(id)) disposeMaterials(scene, false);
    };
  }, [scene, src, gltf.scene]);

  useLayoutEffect(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = castShadow;
      o.receiveShadow = receiveShadow;
      const mats: Material[] = Array.isArray(o.material) ? o.material : [o.material];
      const next = mats.map((m) => {
        const preset = presets?.[m.name];
        const out = preset ? applyPreset(m, preset) : m;
        for (const v of Object.values(out as any)) if ((v as Texture)?.isTexture) (v as Texture).anisotropy = aniso;
        return out;
      });
      o.material = Array.isArray(o.material) ? next : next[0];
    });
    onScene?.(scene);
  }, [scene, castShadow, receiveShadow, presets, gl, onScene]);

  return (
    <group {...group}>
      <primitive object={scene} scale={unitScale} />
      {children}
    </group>
  );
}

function disposeMaterials(root: Object3D, textures: boolean) {
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const mats: Material[] = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (textures) for (const v of Object.values(m as any)) if ((v as Texture)?.isTexture) (v as Texture).dispose();
      m.dispose();
    }
  });
}

function disposeObject(root: Object3D) {
  root.traverse((o) => {
    if (o instanceof Mesh) o.geometry?.dispose();
  });
  disposeMaterials(root, true);
}

/** Free one product's GPU memory (every mounted clone and the cached original) and drop it from the loader cache. */
export function disposeProduct(src: string) {
  for (const clone of instances.removeSrc(src)) disposeObject(clone);
  const original = originals.get(src);
  if (original) disposeObject(original);
  originals.delete(src);
  useGLTF.clear(src);
}

/** Called by Stage on unmount: every product, then the KTX2 transcoder workers. */
export function disposeAllProducts() {
  for (const src of new Set([...originals.keys(), ...instances.srcs()])) disposeProduct(src);
  ktx2?.dispose();
  ktx2 = null;
}
