# Scroll-driven Remotion compositions

Scroll is the clock, the composition is the picture. A paused `<Player>` is moved with `seekTo(frame)` from a 0 to 1 scroll progress. Lenis or ScrollTrigger supplies the scroll value; Remotion supplies exact frames.

The Remotion docs have no page about scrolling. This file builds the pattern from the documented Player API (`seekTo`, `getCurrentFrame`, the `seeked` event, `controls`, `clickToPlay`, `spaceKeyToPlayOrPause`) and from JAL's own scroll rules. No item is left open here; the video module implements the pattern as `watchScroll` and `scrubProgress` (`templates/modules/video`).

From: https://www.remotion.dev/docs/player/player , https://www.remotion.dev/docs/player/current-time , https://www.remotion.dev/docs/player/best-practices , https://www.remotion.dev/docs/player/thumbnail , https://www.remotion.dev/docs/player/premounting , https://www.remotion.dev/docs/player/scaling , JAL-authored (`skills/jal-immersive/references/scroll-choreography.md`, `frames.md` section 6, `StickyStory.tsx`, `AppShell.tsx` getScroller).

## 1. When to scrub

- A product walkthrough, an exploded diagram, a process, a data story that reads better when the visitor controls the pace.
- It is a tier 3 motion (`motion.intensity`) and a JEV `motion.pin` decision when the stage pins. It is off below 768 px unless JEV says otherwise, and off under reduced motion.
- Do not scrub a composition that has audio or a decoded `<Video>` (section 7).

## 2. The shape

```
<section>                      tall track:  height = pinLength  (for example 300vh)
  <div class="stage">          position: sticky; top: 0; height: 100svh
    <MediaFrame> <Player paused, no controls /> </MediaFrame>
  </div>
</section>
```

CSS `position: sticky` does the pin, so the pin never fights Lenis or the AppShell. No ScrollTrigger pin is needed. (The kit's StickyStory uses the same sticky-track idea with a hidden marker track.) Progress is how far the track's top has passed the viewport top:

```
progress = clamp(( -trackTop ) / (trackHeight - viewportHeight), 0, 1)
frame    = round(progress * (durationInFrames - 1))
```

The scroll length decides the feel. Roughly 1 viewport of scroll per second of composition is a calm start; shorten for impatient audiences, lengthen for dense steps. Give the section a visible beginning and end so the page never feels trapped.

## 3. The hook (document shell)

`AppShell scroll="document"` is the default for marketing pages, so the scroller is `window`. The hook below also works on a contained shell because it reads the real scroller after mount.

```ts
// motion/useScrollScrub.ts
import { useEffect, type RefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import { getScroller } from "@__APP_NAME__/ui";

interface Options {
  track: RefObject<HTMLElement | null>;        // the tall section
  player: RefObject<PlayerRef | null>;
  durationInFrames: number;
  enabled: boolean;                             // false under reduced motion or on small screens
  /** 0 = follow scroll exactly, 0.1 to 0.2 = soft catch-up. Lenis already smooths, so start at 0. */
  smoothing?: number;
  /** An external source of scroll events, for example Lenis. Falls back to the native scroll event. */
  subscribe?: (onScroll: () => void) => () => void;
}

export function useScrollScrub({ track, player, durationInFrames, enabled, smoothing = 0, subscribe }: Options) {
  useEffect(() => {
    const el = track.current;
    if (!enabled || !el) return;
    const scroller = getScroller(el);                       // after mount: window or the contained main
    const last = durationInFrames - 1;
    let target = 0, shown = -1, raf = 0, queued = false;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const vh = scroller instanceof Element ? scroller.clientHeight : window.innerHeight;
      const span = Math.max(1, r.height - vh);
      const top = scroller instanceof Element ? r.top - scroller.getBoundingClientRect().top : r.top;
      return Math.min(1, Math.max(0, -top / span));
    };

    const apply = () => {
      queued = false;
      const goal = measure() * last;
      target = smoothing > 0 ? target + (goal - target) * (1 - smoothing) : goal;
      const frame = Math.round(target);
      if (frame !== shown) {                                // one seek per changed frame
        shown = frame;
        player.current?.seekTo(frame);
      }
      if (smoothing > 0 && Math.abs(goal - target) > 0.25) schedule(); // keep easing toward the goal
    };
    const schedule = () => { if (!queued) { queued = true; raf = requestAnimationFrame(apply); } };

    player.current?.pause();
    schedule();
    const off = subscribe
      ? subscribe(schedule)
      : (scroller.addEventListener("scroll", schedule, { passive: true }), () => scroller.removeEventListener("scroll", schedule));
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(raf); off(); window.removeEventListener("resize", schedule); };
  }, [track, player, durationInFrames, enabled, smoothing, subscribe]);
}
```

Usage:

```tsx
function ScrubSection({ props }: { props: StoryProps }) {
  const track = useRef<HTMLElement>(null);
  const player = useRef<PlayerRef>(null);
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery("(min-width: 768px)");        // your existing media-query hook
  useScrollScrub({ track, player, durationInFrames: 240, enabled: !reduced && wide });

  return (
    <section ref={track} style={{ height: "300svh" }} aria-label="Product walkthrough">
      <div style={{ position: "sticky", top: 0, height: "100svh" }}>
        <MediaFrame kind="canvas" ratio="16/9">
          <Player ref={player} component={Story} inputProps={props}
            durationInFrames={240} fps={30} compositionWidth={1920} compositionHeight={1080}
            style={{ width: "100%" }} controls={false} clickToPlay={false}
            spaceKeyToPlayOrPause={false} initialFrame={reduced || !wide ? 239 : 0}
            acknowledgeRemotionLicense />
        </MediaFrame>
      </div>
    </section>
  );
}
```

Points:

- The Player must be **paused** (do not set `autoPlay` or `loop`). `seekTo` on a playing Player pauses it for a moment and then resumes, which stutters.
- Turn off every input that could start playback: `controls={false}`, `clickToPlay={false}`, `spaceKeyToPlayOrPause={false}`.
- `initialFrame` is the end frame when scrub is off (reduced motion, small screens), so the visitor sees the finished state. It cannot change after mount, so give the Player a `key` tied to the mode if the mode can flip live.
- `seekTo` is called at most once per animation frame and only when the integer frame changed. At 30 fps and normal scrolling most animation frames cause no seek.
- `seekTo` makes the whole composition tree re-render. Keep a scrubbed composition light (budgets in `website-integration.md` section 7).

## 4. Scroll source: Lenis

Lenis smooths wheel and touch input and fires a `scroll` event every frame it moves. Use it as the source so the scrub follows the smoothed value.

```ts
// document shell
const lenis = new Lenis({ autoRaf: true });          // JAL default; or drive it from gsap.ticker (below)
const subscribe = (cb: () => void) => { lenis.on("scroll", cb); return () => lenis.off("scroll", cb); };
useScrollScrub({ track, player, durationInFrames, enabled, subscribe });
```

- Create one Lenis for the whole page (in the AppShell's client wrapper), not one per section. Pass it down by context.
- On a contained shell, give Lenis `wrapper: getScroller()` and `content: wrapper.firstElementChild` as in `scroll-choreography.md`.
- Keep `smoothing` at 0 when Lenis is the source. Two layers of easing feel like lag.
- Destroy Lenis on unmount (`lenis.destroy()`).

## 5. Scroll source: ScrollTrigger

When the page already uses GSAP, let ScrollTrigger compute progress and skip the manual math. ScrollTrigger can also pin, but the sticky track above is simpler; use `pin: true` only when the stage needs to pin inside a contained shell (JEV `motion.pin`, `pinSpacing` stays true).

```ts
useGSAP(() => {
  const st = ScrollTrigger.create({
    trigger: track.current, start: "top top", end: "bottom bottom",
    scrub: true,                                       // or a number for catch-up seconds
    onUpdate: (self) => {
      const frame = Math.round(self.progress * (durationInFrames - 1));
      if (frame !== shown.current) { shown.current = frame; player.current?.seekTo(frame); }
    },
  });
  return () => st.kill();
}, { scope: track });
```

- `gsap.matchMedia()` wraps the create call so reduced motion and narrow screens skip it (the pattern in `frames.md` section 6).
- On a contained shell call `ScrollTrigger.defaults({ scroller: getScroller() })` once, after mount, before creating triggers.
- With Lenis plus ScrollTrigger, wire `lenis.on("scroll", ScrollTrigger.update)` and drive Lenis from `gsap.ticker` (`autoRaf: false`) as in `scroll-choreography.md`. One scroll clock for the page.
- Prefer the hook (Lenis or native events) when only this one section is scroll linked and GSAP is not otherwise on the page. Do not add GSAP just for this.

## 6. Step stories (few frames, no continuous scrub)

When the story is three to five states rather than a smooth film:

- Map progress to a **step** (like `StickyStory`), compute `frame = stepFrames[step]`, and call `seekTo(frame)` only when the step changes. Pair it with a short CSS crossfade on the section chrome, not on the Player.
- Or render one `<Thumbnail frameToDisplay={frames[step]}>` per step (cheap, no playback loop, each is a real composition frame). Changing `frameToDisplay` re-renders; mounting one Thumbnail per step and cross-fading them avoids re-render stutter on small compositions.
- Or let each step play a short slice with `inFrame` and `outFrame` on a real playing Player, started when the step becomes active. This is "scroll triggers playback", not "scroll is the clock", and is the right call when the sections have easing built into the composition.

## 7. Composition rules for scrubbing

- **Pure function of the frame.** No `Math.random()`, no `Date.now()`, no state that accumulates. A scrubbed frame must look identical every time and in both directions (the same rule as server rendering).
- **No audio, no decoded video.** `seekTo` on a frame with `<Video>` or `<Audio>` forces seek and decode work per frame. If the story needs a video, extract key frames with Mediabunny at build time (`mediabunny.md`) and use `<Img>` frames, or pre-render the passage as an image sequence.
- **Preload what the frames use.** Images and fonts are loaded before the first scrubbed frame (`preloadImage`, `preloadFont`, `thumbnail-and-preload.md`), otherwise the first scroll reveals blank pieces. `useDelayRender`/`delayRender` is for rendering, not for the Player; use the Player's buffer state (`player.md` section 8) for load gating.
- **Easing lives in the composition.** Use `interpolate` with `Easing` and `spring` inside the composition. Linear scroll then becomes eased motion on screen. Do not ease the scroll value a second time.
- **Hold frames at the ends.** Make the first and last 5 percent of the composition still, so the section settles before and after the pin.
- **Direction safe.** Reverse scrolling plays the composition backward; avoid effects that only make sense forward (typing that appends and never deletes) unless it is derived from the frame.

## 8. Reduced motion, small screens, no JS

| Condition | Result |
|---|---|
| Server HTML, no JS | Stage 0 poster, then the section text; the track height is not applied |
| `prefers-reduced-motion: reduce` | No sticky track, no scrub. One paused Thumbnail (or the end-state Player) at the poster frame; steps listed as normal content below it |
| Width under 768 px | Same as reduced motion unless JEV `motion.pin` allows a phone scrub |
| JS ready, motion allowed, wide | Scrub |

Read reduced motion live (`usePrefersReducedMotion` or `matchMedia`), so flipping it mid-session releases the scrub: the hook's `enabled` becomes false, the track height clears, and the Player jumps to the end frame.

## 9. Verification

1. Scroll the section top to bottom and back: frame 0 at the start, the last frame at the end, no jumps, no gap where the stage unpins early.
2. With `window` as the scroller and again with a contained shell if the project uses one.
3. Count `seeked` events during a fast flick (add a temporary listener): at most one per animation frame.
4. Frame time at the throttled profile stays inside the 6 ms budget.
5. `ui_shots` at frame 0, the middle and the end, plus the reduced-motion capture.
6. `ui_audit` stuck-reveal and reduced-motion rules pass.
7. Tab through the page: the tall track adds no focus traps; links inside the pinned stage stay reachable.
8. Resize and orientation change: progress recomputes (the resize listener in the hook).

## 10. Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Stutter or pause mid-scroll | Player was playing | Pause at mount, no autoplay |
| Jumpy frames | `seekTo` every scroll event, or two easing layers | One rAF, change check, `smoothing: 0` with Lenis |
| Stage scrolls away early | Sticky parent has `overflow: hidden/auto` | Remove overflow on every ancestor of the sticky stage |
| Progress wrong on a contained shell | Read `window` instead of the real scroller | `getScroller(el)` after mount |
| Blank first scrolls | Assets not loaded | Preload images and fonts, hold the poster until ready |
| Reduced motion still scrubs | `enabled` not tied to the live query | Use `usePrefersReducedMotion` |
| Layout shift when the track appears | Track height set only after JS | Reserve the height in CSS for the motion-allowed path or keep the track out of the flow until ready |
