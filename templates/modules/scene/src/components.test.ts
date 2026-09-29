// Component tests on a stub renderer. The module is a template: its deps
// (react, three, R3F, drei, gsap, the app's ui package) are installed only
// once it is copied into a client workspace, so here every one of them is a
// small stub and a minimal hook renderer runs the real components.
import { beforeEach, describe, expect, mock, test } from "bun:test";

// ---------- a minimal renderer: function and class components, hooks, context, effects ----------

type Host = { type: string; props: any };
const FRAGMENT = Symbol.for("stub.fragment");
const jsx = (type: any, props: any, key?: any) => ({ type, props: props ?? {}, key });
// The test builds trees with h() (no JSX here: a JSX runtime import would be
// resolved before the stubs below are registered).
const h = (type: any, props: any, ...children: any[]) => {
  const { key, ...rest } = props ?? {};
  return { type, props: children.length === 0 ? rest : { ...rest, children: children.length === 1 ? children[0] : children }, key };
};

interface Fiber {
  hooks: any[];
  instance?: any;
}
let fibers = new Map<string, Fiber>();
let visited = new Set<string>();
let hosts: Host[] = [];
let pending: (() => void)[] = [];
let dirty = false;
let current: { fiber: Fiber; i: number } | null = null;
const ctxStacks = new Map<any, any[]>();

function changed(a?: any[], b?: any[]): boolean {
  if (!a || !b) return true;
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}
function hook(): { fiber: Fiber; i: number } {
  if (!current) throw new Error("hook outside a component");
  return { fiber: current.fiber, i: current.i++ };
}

const ReactStub: any = {
  Fragment: FRAGMENT,
  createContext(def: any) {
    const ctx: any = { _default: def };
    ctx.Provider = { _provider: ctx };
    return ctx;
  },
  useContext(ctx: any) {
    const st = ctxStacks.get(ctx);
    return st && st.length ? st[st.length - 1] : ctx._default;
  },
  useState(init: any) {
    const { fiber, i } = hook();
    if (!(i in fiber.hooks)) fiber.hooks[i] = { v: typeof init === "function" ? init() : init };
    const h = fiber.hooks[i];
    const set = (nv: any) => {
      const next = typeof nv === "function" ? nv(h.v) : nv;
      if (!Object.is(next, h.v)) {
        h.v = next;
        dirty = true;
      }
    };
    return [h.v, set];
  },
  useRef(v: any) {
    const { fiber, i } = hook();
    if (!(i in fiber.hooks)) fiber.hooks[i] = { current: v };
    return fiber.hooks[i];
  },
  useMemo(fn: () => any, deps?: any[]) {
    const { fiber, i } = hook();
    const h = fiber.hooks[i];
    if (h && !changed(h.deps, deps)) return h.v;
    const v = fn();
    fiber.hooks[i] = { v, deps };
    return v;
  },
  useCallback(fn: any, deps?: any[]) {
    return ReactStub.useMemo(() => fn, deps);
  },
  useEffect(fn: () => any, deps?: any[]) {
    const { fiber, i } = hook();
    const h = fiber.hooks[i];
    if (h && !changed(h.deps, deps)) return;
    const rec: any = { deps, cleanup: undefined, effect: true };
    fiber.hooks[i] = rec;
    pending.push(() => {
      h?.cleanup?.();
      const r = fn();
      rec.cleanup = typeof r === "function" ? r : undefined;
    });
  },
  Component: class {
    props: any;
    state: any;
    constructor(props: any) {
      this.props = props;
    }
  },
  Suspense: ({ children }: any) => children,
  lazy: () => () => null,
};
ReactStub.useLayoutEffect = ReactStub.useEffect;

function renderNode(node: any, path: string) {
  if (node === null || node === undefined || typeof node === "boolean" || typeof node === "string" || typeof node === "number") return;
  if (Array.isArray(node)) {
    node.forEach((n, i) => renderNode(n, `${path}/${n?.key ?? i}`));
    return;
  }
  const { type, props } = node;
  if (type === FRAGMENT) return renderNode(props.children, `${path}/f`);
  if (type && type._provider) {
    const st = ctxStacks.get(type._provider) ?? [];
    ctxStacks.set(type._provider, st);
    st.push(props.value);
    renderNode(props.children, `${path}/p`);
    st.pop();
    return;
  }
  if (typeof type === "string") {
    hosts.push({ type, props });
    return renderNode(props.children, `${path}/${type}`);
  }
  const p = `${path}/${type.name}`;
  visited.add(p);
  let fiber = fibers.get(p);
  if (!fiber) {
    fiber = { hooks: [] };
    fibers.set(p, fiber);
  }
  if (type.prototype && typeof type.prototype.render === "function") {
    fiber.instance ??= new type(props);
    fiber.instance.props = props;
    fiber.instance.state ??= {};
    return renderNode(fiber.instance.render(), p);
  }
  const prev = current;
  current = { fiber, i: 0 };
  const out = type(props);
  current = prev;
  renderNode(out, p);
}

function unmountFiber(f: Fiber) {
  for (const h of f.hooks) if (h?.effect && typeof h.cleanup === "function") h.cleanup();
}

function render(root: any) {
  for (let pass = 0; pass < 20; pass++) {
    dirty = false;
    visited = new Set();
    hosts = [];
    renderNode(root, "r");
    for (const [p, f] of fibers) {
      if (!visited.has(p)) {
        unmountFiber(f);
        fibers.delete(p);
      }
    }
    const run = pending;
    pending = [];
    for (const fn of run) fn();
    if (!dirty) return;
  }
  throw new Error("render did not settle");
}

function resetRenderer() {
  for (const f of fibers.values()) unmountFiber(f);
  fibers = new Map();
  pending = [];
  hosts = [];
}

// ---------- stubs for the module's dependencies ----------

class Vec3 {
  x: number;
  y: number;
  z: number;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  copy(v: Vec3) {
    return this.set(v.x, v.y, v.z);
  }
  distanceToSquared(v: Vec3) {
    return (this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2;
  }
}

const geometries: { disposed: number }[] = [];
class BufferGeometry {
  disposed = 0;
  constructor() {
    geometries.push(this);
  }
  setAttribute() {}
  setIndex() {}
  computeBoundingSphere() {}
  dispose() {
    this.disposed++;
  }
}
class Material {
  name = "";
  disposed = 0;
  clone() {
    return new Material();
  }
  dispose() {
    this.disposed++;
  }
}
class Mesh {
  castShadow = false;
  receiveShadow = false;
  constructor(
    public geometry: BufferGeometry,
    public material: Material,
  ) {}
}
class Group {
  constructor(public children: Mesh[]) {}
  traverse(fn: (o: any) => void) {
    fn(this);
    for (const c of this.children) fn(c);
  }
  clone() {
    return new Group(this.children.map((m) => new Mesh(m.geometry, m.material)));
  }
}

mock.module("react", () => ReactStub);
mock.module("react/jsx-runtime", () => ({ jsx, jsxs: jsx, Fragment: FRAGMENT }));
mock.module("react/jsx-dev-runtime", () => ({ jsxDEV: jsx, Fragment: FRAGMENT }));
mock.module("three", () => ({
  ACESFilmicToneMapping: 4,
  AgXToneMapping: 6,
  NeutralToneMapping: 7,
  SRGBColorSpace: "srgb",
  NoColorSpace: "",
  LinearSRGBColorSpace: "srgb-linear",
  RepeatWrapping: 1000,
  HalfFloatType: 1016,
  BufferGeometry,
  Float32BufferAttribute: class {},
  Vector3: Vec3,
  Euler: class {},
  Object3D: class {},
  Color: class {},
  MeshPhysicalMaterial: class extends Material {},
  MeshStandardMaterial: class extends Material {},
  Mesh,
}));
mock.module("three/examples/jsm/loaders/KTX2Loader.js", () => ({ KTX2Loader: class {} }));

const gltfCache = new Map<string, Group>();
const useGLTF: any = (src: string) => {
  if (!gltfCache.has(src)) gltfCache.set(src, new Group([new Mesh(new BufferGeometry(), new Material())]));
  return { scene: gltfCache.get(src) };
};
useGLTF.preload = () => {};
useGLTF.clear = (src: string) => gltfCache.delete(src);
useGLTF.setDecoderPath = () => {};

const nothing = () => null;
mock.module("@react-three/drei", () => ({
  Preload: nothing,
  AccumulativeShadows: nothing,
  ContactShadows: nothing,
  RandomizedLight: nothing,
  RoundedBox: nothing,
  SoftShadows: nothing,
  Environment: nothing,
  useTexture: () => ({}),
  useGLTF,
}));

let frameCallbacks: ((state: unknown, delta: number) => void)[] = [];
const lostListeners: ((e: { preventDefault(): void }) => void)[] = [];
const camera = { fov: 32, position: new Vec3(), lookAt() {}, updateProjectionMatrix() {} };
const three = {
  gl: {
    capabilities: { getMaxAnisotropy: () => 8 },
    setClearColor() {},
    domElement: {
      addEventListener: (name: string, fn: any) => name === "webglcontextlost" && lostListeners.push(fn),
      removeEventListener: (name: string, fn: any) => {
        const i = lostListeners.indexOf(fn);
        if (name === "webglcontextlost" && i >= 0) lostListeners.splice(i, 1);
      },
    },
  },
  invalidate: () => {},
  camera,
  size: { width: 1280, height: 800 },
};
mock.module("@react-three/fiber", () => ({
  Canvas: function Canvas({ children }: any) {
    return children;
  },
  useThree: (sel: (s: typeof three) => unknown) => sel(three),
  useFrame: (fn: any) => {
    frameCallbacks.push(fn);
  },
}));

type Trigger = { progress: number; killed: boolean; kill(): void; onUpdate: () => void };
let triggers: Trigger[] = [];
mock.module("gsap", () => ({ gsap: { registerPlugin() {} } }));
mock.module("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    create(opts: any) {
      const t: Trigger = { progress: 0, killed: false, kill() { this.killed = true; }, onUpdate: opts.onUpdate };
      triggers.push(t);
      return t;
    },
  },
}));
mock.module("@__APP_NAME__/ui", () => ({ getScroller: () => ({}) }));

let prefersReduced = false;
(globalThis as any).window = {
  innerWidth: 1280,
  navigator: {},
  location: { search: "" },
  matchMedia: (q: string) => ({ matches: q.includes("reduced-motion") ? prefersReduced : false, addEventListener() {}, removeEventListener() {} }),
  document: { createElement: () => ({ getContext: () => null }) },
};
(globalThis as any).document = { querySelector: (s: string) => ({ selector: s }) };
(globalThis as any).requestAnimationFrame = (cb: () => void) => {
  cb();
  return 1;
};
(globalThis as any).cancelAnimationFrame = () => {};
console.warn = () => {};

const { Stage } = await import("./Stage");
const { CameraRig } = await import("./CameraRig");
const { Ground } = await import("./Ground");
const { Product, disposeAllProducts } = await import("./assets");
const { sampleShots } = await import("./shots");

const poster = () => hosts.find((h) => h.type === "div" && "data-scene-poster" in h.props);
const shots = () => [
  { name: "hero", position: [0, 1, 3] as [number, number, number], target: [0, 0, 0] as [number, number, number], lens: 40 },
  { name: "pool", position: [2, 0.5, 1] as [number, number, number], target: [0.5, 0, 0] as [number, number, number], lens: 50 },
];

beforeEach(() => {
  resetRenderer();
  frameCallbacks = [];
  triggers = [];
  prefersReduced = false;
  geometries.length = 0;
  lostListeners.length = 0;
});

describe("Stage poster", () => {
  test("hidden (still mounted) once the live scene is ready; visible again after context loss", () => {
    render(h(Stage, { tier: "full", poster: "/poster.webp" }, null));
    expect(poster()?.props.style.visibility).toBe("hidden");
    expect(lostListeners.length).toBe(1);
    lostListeners[0]({ preventDefault() {} });
    render(h(Stage, { tier: "full", poster: "/poster.webp" }, null));
    expect(poster()).toBeDefined();
    expect(poster()?.props.style.visibility).toBeUndefined();
  });

  test("visible on the static tier", () => {
    render(h(Stage, { tier: "static", poster: "/poster.webp" }, null));
    expect(poster()?.props.style.visibility).toBeUndefined();
  });
});

describe("CameraRig", () => {
  const moveToSecondShot = () => {
    expect(triggers.length).toBe(1);
    triggers[0].progress = 1;
    triggers[0].onUpdate();
  };
  const frame = () => frameCallbacks[frameCallbacks.length - 1](null, 1 / 60);

  test("under reduced motion the Stage's flag reaches the rig: the camera cuts, no damping", () => {
    prefersReduced = true;
    render(h(Stage, { tier: "full", poster: "/p.webp" }, h(CameraRig, { shots: shots(), sections: ["#a", "#b"] })));
    frame();
    moveToSecondShot();
    frame();
    const want = sampleShots(shots(), 1, 1280 / 800).position;
    expect(camera.position.distanceToSquared(new Vec3(...want))).toBeLessThan(1e-12);
  });

  test("without reduced motion the camera damps toward the next shot", () => {
    render(h(Stage, { tier: "full", poster: "/p.webp" }, h(CameraRig, { shots: shots(), sections: ["#a", "#b"] })));
    frame();
    moveToSecondShot();
    frame();
    const want = sampleShots(shots(), 1, 1280 / 800).position;
    expect(camera.position.distanceToSquared(new Vec3(...want))).toBeGreaterThan(0.01);
  });

  test("inline shots and sections with the same content keep their ScrollTriggers; new content rebuilds them", () => {
    const tree = (s = shots()) => h(Stage, { tier: "full", poster: "/p.webp" }, h(CameraRig, { shots: s, sections: ["#a", "#b"] }));
    render(tree());
    render(tree());
    render(tree());
    expect(triggers.length).toBe(1);
    expect(triggers[0].killed).toBe(false);
    const moved = shots();
    moved[1].lens = 60;
    render(tree(moved));
    expect(triggers.length).toBe(2);
    expect(triggers[0].killed).toBe(true);
    expect(triggers[1].killed).toBe(false);
  });
});

describe("Ground sweep", () => {
  test("a size change disposes the old cyclorama geometry, unmount disposes the last", () => {
    render(h(Stage, { tier: "full", poster: "/p.webp" }, h(Ground, { variant: "sweep", size: [10, 0.6] })));
    render(h(Stage, { tier: "full", poster: "/p.webp" }, h(Ground, { variant: "sweep", size: [10, 0.6] })));
    expect(geometries.length).toBe(1);
    render(h(Stage, { tier: "full", poster: "/p.webp" }, h(Ground, { variant: "sweep", size: [12, 0.6] })));
    expect(geometries.length).toBe(2);
    expect(geometries[0].disposed).toBe(1);
    expect(geometries[1].disposed).toBe(0);
    render(null);
    expect(geometries[1].disposed).toBe(1);
  });
});

describe("Product", () => {
  test("two Products of one file are tracked per instance: each clone's materials are freed", () => {
    const clones: any[] = [];
    const tree = (both: boolean) =>
      h(
        Stage,
        { tier: "full", poster: "/p.webp" },
        h(Product, { key: "a", src: "/lamp.gltf", onScene: (s: any) => (clones[0] ??= s) }),
        both ? h(Product, { key: "b", src: "/lamp.gltf", onScene: (s: any) => (clones[1] ??= s) }) : null,
      );
    render(tree(true));
    expect(clones.length).toBe(2);
    const [first, second] = clones.map((c) => c.children[0].material as Material);
    expect(first).not.toBe(second);
    // The second instance unmounts: its own material is freed, the first's is not.
    render(tree(false));
    expect(second.disposed).toBe(1);
    expect(first.disposed).toBe(0);
    // Disposing everything frees the remaining clone too (previously lost when
    // the second instance overwrote the first in a map keyed by src).
    disposeAllProducts();
    expect(first.disposed).toBeGreaterThanOrEqual(1);
  });
});
