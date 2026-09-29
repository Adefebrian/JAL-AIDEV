// PostFX: the tier-gated post stack. The implementation (postprocessing and
// N8AO, about 160 KB gzip) is a separate chunk loaded only when the tier runs
// post (desktop full), so mobile and reduced tiers never download it. It
// loads inside the Stage's Suspense boundary, so the scene reveals once, with
// its finished look, never without post and then with it.
// Stack, order, and the post law: PostFXImpl.tsx.
import { lazy } from "react";
import { useStage } from "./Stage";

export interface PostFXProps {
  /** Ambient occlusion radius in metres (world space). About a tenth of the product's size. */
  aoRadius?: number;
  aoIntensity?: number;
  /** Half-resolution AO is cheaper but its noise shows on a flat bright backdrop. Default full resolution. */
  aoHalfRes?: boolean;
  /** Turn AO off for a scene with no creases the shadow maps miss. */
  ao?: boolean;
  /** Focus point in world space. Omit to skip depth of field. */
  focus?: [number, number, number];
  /** Bokeh size; kept subtle (at most 2). */
  bokehScale?: number;
}

const PostFXImpl = lazy(() => import("./PostFXImpl"));

export function PostFX(props: PostFXProps) {
  const { budget } = useStage();
  return budget.postFX ? <PostFXImpl {...props} /> : null;
}
