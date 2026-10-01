// The registry and the schemas. The metadata checks run anywhere; the
// schema and composition checks need the workspace installed (zod,
// remotion) and skip with a note when it is not.
import { describe, expect, test } from "bun:test";
import { durationInSeconds, resolveProps, VIDEOS } from "./registry";

const installed = (() => {
  try {
    for (const m of ["zod", "remotion", "@remotion/transitions", "react"]) Bun.resolveSync(m, import.meta.dir);
    return true;
  } catch {
    return false;
  }
})();
if (!installed) console.warn("registry.test: workspace not installed, schema checks skipped (run inside packages/video after bun install)");

describe("registry metadata", () => {
  test("ids follow Remotion's rule and are unique", () => {
    const ids = VIDEOS.map((v) => v.id);
    for (const id of ids) expect(id).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test("poster frames sit inside each composition; sizes are even (H.264 needs it)", () => {
    for (const v of VIDEOS) {
      expect(v.posterFrame).toBeGreaterThanOrEqual(0);
      expect(v.posterFrame).toBeLessThan(v.durationInFrames);
      expect(v.width % 2).toBe(0);
      expect(v.height % 2).toBe(0);
    }
  });
  test("the 9:16 cut is 9:16, the others 16:9", () => {
    const [intro, story, social] = VIDEOS;
    expect(intro.width / intro.height).toBeCloseTo(16 / 9, 6);
    expect(story.width / story.height).toBeCloseTo(16 / 9, 6);
    expect(social.width / social.height).toBeCloseTo(9 / 16, 6);
    expect(durationInSeconds(social)).toBe(7);
  });
});

describe.skipIf(!installed)("schemas and compositions", () => {
  test("every composition's defaultProps validate against its schema", async () => {
    for (const v of VIDEOS) {
      const [mod, schema] = await Promise.all([v.load(), v.schema()]);
      const parsed = schema.safeParse(mod.defaultProps);
      if (!parsed.success) throw new Error(`${v.id}: ${JSON.stringify(parsed.error.issues)}`);
      expect(parsed.data).toEqual(mod.defaultProps as never);
      expect(typeof mod.component).toBe("function");
    }
  });
  test("invalid overrides fall back to the defaults with the reason", async () => {
    const [intro] = VIDEOS;
    const [mod, schema] = await Promise.all([intro.load(), intro.schema()]);
    const bad = resolveProps(mod.defaultProps, { headline: [] } as never, schema);
    expect(bad.props).toBe(mod.defaultProps);
    expect(bad.error).toContain("headline");
    const good = resolveProps(mod.defaultProps, { product: "Udara" } as never, schema);
    expect(good.error).toBeNull();
    expect((good.props as { product: string }).product).toBe("Udara");
  });
  test("the data story refuses a highlight outside its series", async () => {
    const story = VIDEOS[1];
    const [mod, schema] = await Promise.all([story.load(), story.schema()]);
    expect(resolveProps(mod.defaultProps, { highlight: 99 } as never, schema).error).toContain("highlight");
  });
  test("the social cut's scenes add up to the registered duration", async () => {
    const { SOCIAL_DURATION } = await import("./SocialCut");
    expect(SOCIAL_DURATION).toBe(VIDEOS[2].durationInFrames);
  });
});
