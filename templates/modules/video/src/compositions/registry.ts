// The composition registry. An entry is the metadata a page needs before
// any video code loads (size, fps, duration, the poster frame: enough to
// draw the aspect-ratio box with no layout shift) plus two loaders:
// `load()` imports the component and its defaultProps, `schema()` imports
// its zod schema. Bun.build splits each `import()` into its own chunk, so a
// page pays for a composition only when its section comes near the
// viewport, and for zod only when it passes inputProps to validate. This
// file has no runtime imports.
//
// Studio (studio/index.ts, through Root.tsx) and the in-browser MP4 export
// read the same entries, so a composition is registered once.
import type { ComponentType } from "react";
import type { z } from "zod";
import type { DataStoryProps, ProductIntroProps, SocialCutProps } from "./schemas";

// Kept in sync with SOCIAL_DURATION in SocialCut.tsx (registry.test.ts checks it).
const SOCIAL_DURATION = 210;

export interface VideoMeta {
  /** Composition id: letters, numbers, and hyphens (Remotion's rule). */
  id: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  /** The still for reduced motion and the thumbnail: a frame where everything has landed. */
  posterFrame: number;
}

export interface VideoModule<P extends Record<string, unknown>> {
  component: ComponentType<P>;
  defaultProps: P;
}

export interface VideoEntry<P extends Record<string, unknown> = Record<string, unknown>> extends VideoMeta {
  load: () => Promise<VideoModule<P>>;
  schema: () => Promise<z.ZodType<P>>;
}

export const productIntro: VideoEntry<ProductIntroProps> = {
  id: "product-intro",
  title: "Product intro",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 180,
  posterFrame: 150,
  load: () => import("./ProductIntro").then((m) => ({ component: m.ProductIntro, defaultProps: m.productIntroDefaults })),
  schema: () => import("./schemas").then((m) => m.productIntroSchema),
};

export const dataStory: VideoEntry<DataStoryProps> = {
  id: "data-story",
  title: "Data story",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 240,
  posterFrame: 200,
  load: () => import("./DataStory").then((m) => ({ component: m.DataStory, defaultProps: m.dataStoryDefaults })),
  schema: () => import("./schemas").then((m) => m.dataStorySchema),
};

export const socialCut: VideoEntry<SocialCutProps> = {
  id: "social-cut",
  title: "Social cut 9:16",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: SOCIAL_DURATION,
  posterFrame: 50,
  load: () => import("./SocialCut").then((m) => ({ component: m.SocialCut, defaultProps: m.socialCutDefaults })),
  schema: () => import("./schemas").then((m) => m.socialCutSchema),
};

export const VIDEOS = [productIntro, dataStory, socialCut] as const;

export function durationInSeconds(meta: Pick<VideoMeta, "durationInFrames" | "fps">): number {
  return meta.durationInFrames / meta.fps;
}

/**
 * The props a composition renders with: its defaults, overridden by the
 * page's props, validated by its schema. An invalid override falls back to
 * the defaults (and says why) rather than drawing a broken frame. Without
 * overrides there is nothing to validate and no schema is needed.
 */
export function resolveProps<P extends Record<string, unknown>>(
  defaults: P,
  overrides: Partial<P> | undefined,
  schema: z.ZodType<P> | null,
): { props: P; error: string | null } {
  if (!overrides) return { props: defaults, error: null };
  if (!schema) return { props: defaults, error: "no schema loaded to validate the overrides" };
  const parsed = schema.safeParse({ ...defaults, ...overrides });
  if (parsed.success) return { props: parsed.data, error: null };
  return { props: defaults, error: parsed.error.issues.map((i) => `${i.path.join(".") || "props"}: ${i.message}`).join("; ") };
}

/** The component, its defaults, and (only when there are overrides) its schema, in parallel. */
export async function loadVideo<P extends Record<string, unknown>>(
  video: VideoEntry<P>,
  overrides?: Partial<P>,
): Promise<{ mod: VideoModule<P>; schema: z.ZodType<P> | null }> {
  const [mod, schema] = await Promise.all([video.load(), overrides ? video.schema() : Promise.resolve(null)]);
  return { mod, schema };
}
