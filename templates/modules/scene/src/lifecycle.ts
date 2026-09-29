// Pure lifecycle helpers for Stage, CameraRig, and the asset loader. They
// import neither three nor React, so bun test covers them without the
// workspace installed.

/**
 * The poster wrapper under the Canvas. The Canvas is alpha: true (the page
 * shows through wherever the scene does not paint), so once the live scene is
 * on screen the static poster must stop painting, or its product shows
 * through after the camera leaves the first shot. It stays mounted (hidden,
 * not removed) so context loss or a loader error can show it again at once.
 */
export function posterLayerStyle(live: boolean, ready: boolean): { position: "absolute"; inset: number; visibility?: "hidden" } {
  return live && ready ? { position: "absolute", inset: 0, visibility: "hidden" } : { position: "absolute", inset: 0 };
}

const elementIds = new WeakMap<object, number>();
let nextElementId = 0;
function elementKey(el: object): string {
  let id = elementIds.get(el);
  if (id === undefined) {
    id = ++nextElementId;
    elementIds.set(el, id);
  }
  return `e:${id}`;
}

/**
 * A stable key for CameraRig's shots and sections. Pages usually write both
 * inline (`shots={[...]}`, `sections={["#hero", "#pool"]}`), which makes new
 * arrays every render; keying the ScrollTrigger effect on content instead of
 * identity keeps the triggers alive across re-renders. Shots are compared by
 * their JSON; a section selector by its text, a section element by identity.
 */
export function contentKey(shots: unknown, sections: readonly (string | object)[]): string {
  return JSON.stringify([shots, sections.map((s) => (typeof s === "string" ? `s:${s}` : elementKey(s)))]);
}

/**
 * Every mounted <Product>, one entry per instance. Two Products of the same
 * file each get their own entry, so neither clone is lost to the other and
 * both can be disposed.
 */
export class InstanceRegistry<T> {
  private next = 0;
  private entries = new Map<number, { src: string; value: T }>();

  add(src: string, value: T): number {
    const id = ++this.next;
    this.entries.set(id, { src, value });
    return id;
  }

  remove(id: number): T | undefined {
    const e = this.entries.get(id);
    this.entries.delete(id);
    return e?.value;
  }

  forSrc(src: string): T[] {
    const out: T[] = [];
    for (const e of this.entries.values()) if (e.src === src) out.push(e.value);
    return out;
  }

  /** Drops and returns every instance of one file. */
  removeSrc(src: string): T[] {
    const out: T[] = [];
    for (const [id, e] of this.entries) {
      if (e.src !== src) continue;
      out.push(e.value);
      this.entries.delete(id);
    }
    return out;
  }

  srcs(): string[] {
    return [...new Set([...this.entries.values()].map((e) => e.src))];
  }

  get size(): number {
    return this.entries.size;
  }
}
