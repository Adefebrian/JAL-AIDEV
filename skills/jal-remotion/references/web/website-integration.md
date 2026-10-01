# Remotion on a JAL website

How a JAL website (Bun.build React 19 app, Hono server, AppShell `scroll="document"`, the kit in `packages/ui/src/kit`, reduced motion) embeds Remotion compositions as live motion sections. This is the JAL layer on top of the Remotion docs in this folder. Read it before `player.md`.

From: https://www.remotion.dev/player/ , https://www.remotion.dev/docs/player/ , https://www.remotion.dev/docs/player/integration , https://www.remotion.dev/docs/player/best-practices , https://www.remotion.dev/docs/player/preloading , https://www.remotion.dev/docs/client-side-rendering/ , https://www.remotion.dev/automate , plus JAL-authored rules (stack, law, budgets). Items marked **[JAL]** are JAL choices, not Remotion statements. Items marked **[verify]** were not on the fetched pages and must be checked in the first real build.

## 1. Where Remotion sits in the motion stack

Remotion is the main core motion of JAL-AIDEV. The other tools are supplements, and JEV picks per case (`jal-jev`).

| Job | Pick | Why |
|---|---|---|
| A designed "video" on the page (product demo, explainer, hero loop, data story) that may also export to MP4 | Remotion Player | One composition, live on the page and rendered to a file |
| The page changes a composition at runtime (name, color, chart data, form values) | Remotion Player with `inputProps` | Props are the API |
| A composition advanced by scroll | Remotion Player, paused, `seekTo` from scroll progress (`scroll-scrub.md`) | Exact frames, same code as the MP4 |
| A user downloads an MP4 they just configured | `renderMediaOnWeb` (`web-renderer.md`) | No server, no headless Chrome |
| Small dependency-free demo, no export, no `@remotion/*` need | JAL frame core (`skills/jal-immersive/references/frames.md`) | Zero dependencies |
| Entrances, pins and reveals on real page elements | kit motion plus GSAP/ScrollTrigger (`skills/jal-immersive/references/scroll-choreography.md`), Lenis | DOM choreography, not a video |
| State-driven component motion, layout and exit | Framer Motion or CSS (`skills/jal-motion`) | React state is the clock |
| 3D scene | Three.js and R3F (`skills/jal-immersive`); a Remotion composition may host it via `@remotion/three` | |
| Section recipes | magicui, animata, noyzzi, OriginKit | Ready-made pieces, JEV judged |

JEV decision to record in the build report: `motion.engine` with the answer (`remotion`, `kit_css`, `gsap_lenis`, `r3f`, `frame_core`, `noyzzi_or_library`, `none`) and the one reason; a video request is `remotion` and a micro-interaction is `kit_css` by precheck. A `remotion` answer is followed by `motion.remotion_recipe` (`../visuals/recipe-index.md`). A page may layer several; one owner per element (the kit already steps aside when a module sets `data-motion-engine`). The code for the pattern in this file is the opt-in video module (`templates/modules/video`, copied to `packages/video`: `RemotionSection`, the compositions registry, `exportMp4`, `watchScroll`; its README holds the steps), and the rules are in `skills/jal-remotion/SKILL.md`.

## 2. Stack rules for websites

- **Bun only.** The site bundle is built with `Bun.build` (`skills/jal-scaffold/SKILL.md`). No Vite, Next.js, webpack or Rspack in a website. Remotion's Player, Thumbnail, `@remotion/media`, `@remotion/preload`, `@remotion/web-renderer` and Mediabunny are plain ESM packages that `Bun.build` bundles. **[verify]** on the first project that `process.env.NODE_ENV` and `staticFile()` resolve correctly in the browser bundle.
- **Hono serves static files.** Compositions that use `staticFile("x.mp4")` need the file under the public path Hono serves. Cross-origin assets need CORS (`Access-Control-Allow-Origin`), because Mediabunny decoding and the web renderer enforce it. Set the header in a Hono middleware on the asset route, never `*` for credentialed routes.
- **No server render of Remotion.** The website renders on the client only. The server HTML holds the poster (section 4). Do not call `@remotion/renderer`, `@remotion/bundler` or `@remotion/cli` from a website server.
- **Headless rendering is not the default.** Anything that needs a file from a composition prefers `renderMediaOnWeb`/`renderStillOnWeb` in the user's own browser (WebCodecs). A headless Chrome path (server-side `@remotion/renderer`, or a puppeteer screenshot) needs a JEV `video.render_path` decision and Brian's confirmation per project. See `../rendering/render-paths.md`.
- **The Remotion Studio and CLI are not part of the website.** The Studio and `npx remotion render` use their own bundler (webpack family). Decided (Brian, 2026-10-01): Studio and its bundler run only inside a separate video workspace (`packages/video`, the video module's optional Studio entry), never in `apps/web`; a CLI or Studio render needs Brian's confirmation per project. Author compositions as plain React files that compile under both `Bun.build` and the Studio bundler, and preview them through the page or the Studio.
- **Pin versions.** `bun add --exact`, every `remotion` and `@remotion/*` on one version.

```ts
// apps/web/build.ts: code splitting keeps remotion out of the first bundle
await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  splitting: true,   // each dynamic import() becomes its own chunk
  minify: true,
  sourcemap: "linked",
});
```

Folder layout:

```
apps/web/src/
  motion/
    MotionStage.tsx        main bundle, no remotion import (poster, observer, lazy load)
    stage.chunk.tsx        lazy chunk: imports @remotion/player and the composition
    useScrollScrub.ts      scroll progress to frame (scroll-scrub.md)
  compositions/
    Hero.tsx               the composition (plain React, reads useCurrentFrame)
    Hero.schema.ts         zod props schema, defaults, poster frame, fps, duration
```

## 3. Law zones

A Remotion Player is a media region. Treat it like `MediaFrame kind="canvas"`:

- **The frame (MediaFrame)** follows the full JAL law: fixed aspect ratio, no shadow, no gradient, no side line, caption below the media never over it, hairline, radius from the direction.
- **Inside the composition** the composition is DOM, so full page law applies (no gradients, no shadows, no emoji, white-first, no purple; Brian, 2026-10-01). The canvas exemption (natural light and shade, `jal-immersive` Zone B) covers scene content only: a 3D scene, footage, a rendered image inside the frame. Text, UI, captions, and chrome in the same frame keep full law, so a UI-like product demo never takes it. JEV decides once per composition and the answer is written in the composition's schema file.
- **Default Player controls** (the built-in bar) are not used by default: the JAL default is custom controls built from kit tokens outside the Player (`player.md` section 10). The built-in bar may ship on a page only after that page passes `ui_audit` with it on.
- Text in a composition is real DOM and follows the type scale and the overlap law; no text over busy media without a plain surface behind it.

## 4. The recommended pattern: poster first, lazy, in view

Three stages. Stage 0 costs almost nothing and carries the LCP. The expensive Remotion chunk loads only when it is needed.

| Stage | When | What renders | Cost |
|---|---|---|---|
| 0 Poster | Server HTML, first paint, reduced motion, no JS | `MediaFrame` with a fixed ratio and a static poster image (or an honest placeholder) | One image, no JS |
| 1 Thumbnail | Section is within about 300px of the viewport | Lazy chunk loads; `<Thumbnail frameToDisplay={posterFrame}>` draws the real composition frame | One chunk, no playback loop |
| 2 Player | In view and motion allowed, or the user presses play | `<Player>` in the same chunk, paused or looping per the section | Playback loop |

Under `prefers-reduced-motion: reduce` the section stops at stage 1 (a paused Thumbnail) and never autoplays. The viewer may still press play on a visible control, since that is user-started.

```tsx
// motion/MotionStage.tsx  (main bundle: no remotion import here)
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MediaFrame, usePrefersReducedMotion, getScroller, scrollerRoot } from "@__APP_NAME__/ui";
import type { StageProps } from "./stage.chunk";

const Stage = lazy(() => import("./stage.chunk")); // Bun.build splits this chunk

type Props = Omit<StageProps, "mode"> & {
  posterSrc: string;          // stage 0 image, WebP, 200KB or less
  posterAlt: string;
  ratio?: "16/9" | "4/3" | "1/1" | "4/5";
  /** "loop" plays on its own once visible, "tap" waits for a press. */
  play?: "loop" | "tap";
};

export function MotionStage({ posterSrc, posterAlt, ratio = "16/9", play = "loop", ...stage }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [near, setNear] = useState(false);     // stage 1
  const [visible, setVisible] = useState(false); // stage 2
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const root = scrollerRoot(getScroller(el)); // after mount; window on a document shell
    const close = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true),
      { root, rootMargin: "300px 0px" });
    const inView = new IntersectionObserver(([e]) => setVisible(e.isIntersecting),
      { root, threshold: 0.35 });
    close.observe(el); inView.observe(el);
    return () => { close.disconnect(); inView.disconnect(); };
  }, []);

  const mode = !near ? "none"
    : reduced && !pressed ? "thumbnail"
    : play === "tap" && !pressed ? "thumbnail"
    : visible ? "player" : "thumbnail";

  return (
    <div ref={host}>
      <MediaFrame kind="canvas" ratio={ratio}>
        {mode === "none" ? (
          <img src={posterSrc} alt={posterAlt} width={1280} height={720} decoding="async" />
        ) : (
          <Suspense fallback={<img src={posterSrc} alt={posterAlt} />}>
            <Stage {...stage} mode={mode} onPress={() => setPressed(true)} />
          </Suspense>
        )}
      </MediaFrame>
    </div>
  );
}
```

```tsx
// motion/stage.chunk.tsx  (lazy chunk: remotion lives only here)
import { Player, Thumbnail, type PlayerRef } from "@remotion/player";
import { useMemo, useRef } from "react";
import type { ComponentType } from "react";

export interface StageProps<P extends Record<string, unknown> = Record<string, unknown>> {
  mode: "thumbnail" | "player" | "none";
  component: ComponentType<P>;
  inputProps: P;                 // changes at runtime are fine
  fps: number; durationInFrames: number; width: number; height: number;
  posterFrame: number;           // the frame that tells the whole story in one still
  onPress?: () => void;
}

export default function Stage<P extends Record<string, unknown>>(p: StageProps<P>) {
  const ref = useRef<PlayerRef>(null);
  const inputProps = useMemo(() => p.inputProps, [p.inputProps]); // callers pass a stable object
  const common = {
    component: p.component, inputProps, durationInFrames: p.durationInFrames, fps: p.fps,
    compositionWidth: p.width, compositionHeight: p.height, style: { width: "100%" },
    acknowledgeRemotionLicense: true,
  } as const;

  if (p.mode === "thumbnail") {
    return <Thumbnail {...common} frameToDisplay={p.posterFrame} />;
  }
  return (
    <Player ref={ref} {...common} loop autoPlay={false /* started by the controls, silent compositions only */}
      controls={false} clickToPlay={false} spaceKeyToPlayOrPause={false}
      initialFrame={p.posterFrame} logLevel="warn" />
  );
}
```

Notes:

- Stage 0 uses the same MediaFrame the rest of the kit uses, so there is no layout shift and the LCP image is a normal `<img>`. The canvas kind of MediaFrame takes any child, so when the poster is the LCP media set `loading="eager"` and `fetchPriority="high"` on that `<img>` by hand (the kit's `priority` flag only applies to `kind="image"`), and never lazy-load it.
- Where a section must also autoplay a silent loop, drive `ref.current?.play()` from the in-view state and `pause()` when out of view, so off-screen Players burn no frames. The code above omits the controller for brevity; add it in `stage.chunk.tsx` with an effect keyed on `mode`.
- The poster image (stage 0) should be the composition's own `posterFrame`. Make it once with a dev-only page that calls `renderStillOnWeb` and downloads the blob (a real browser, a person clicks); see `thumbnail-and-preload.md` section 3. No headless Chrome is needed.
- Stage 1 to stage 2 is instant because both live in the same chunk.
- For a story that changes frames with scroll, replace stage 2 with the paused scrub Player in `scroll-scrub.md`.

## 5. Interactive props at runtime

The Player re-renders the composition whenever `inputProps` changes identity, so the page can drive the picture live.

```tsx
const [name, setName] = useState("JAL");
const [accent, setAccent] = useState("var(--accent-500)");       // a token, not a literal color
const inputProps = useMemo(() => ({ name, accent }), [name, accent]);
```

Rules:

- Memoize. A fresh object on every render re-renders the tree and drops frames.
- Keep the Player's parent quiet. Typing in a field should re-render the field and the memoized props object, not the Player's component identity. Put frequently changing state (time, progress) in sibling components that read the ref (`player.md` section 7).
- Validate props with a zod schema in `Hero.schema.ts`; the same schema feeds `renderMediaOnWeb`'s `schema` option so a bad value fails in one place.
- Use CSS variables for color, resolved at render: a composition can read `getComputedStyle` tokens through a prop, so the JAL tokens stay the source of truth. Do not hardcode hex values in a composition that lives on a JAL page.
- `calculateMetadata` is not a Player feature. **[verify]** If the duration depends on data, compute `durationInFrames` in the page and pass it; remount with a `key` when the duration changes.
- Debounce text fields (about 150 ms) before they reach `inputProps` if the composition does layout work per change.
- For a configurator that ends in a download, the same `inputProps` object goes to `renderMediaOnWeb` (`web-renderer.md` section 7).

## 6. Scroll-driven playback

Covered in `scroll-scrub.md`. In one line: keep the Player paused with no controls, compute a 0 to 1 progress from the real scroller (Lenis or ScrollTrigger as the source, `getScroller()` after mount), and call `seekTo(Math.round(progress * (durationInFrames - 1)))` once per animation frame when the integer frame changed.

## 7. Performance budgets  **[JAL]**

Starting values, measured on the 4x CPU slowdown profile of the Chrome performance panel and a real mid-range phone. Tighten when the page also runs WebGL or heavy GSAP.

| Budget | Desktop | Mid tablet | Phone | Over budget |
|---|---|---|---|---|
| Live Players running at once (playing, not paused) | 2 | 1 | 1 | Pause off-screen ones, then fall to Thumbnail |
| Players mounted (playing or paused) | 4 | 3 | 2 | Unmount when far from the viewport |
| Main-thread time per frame in a composition | 6 ms | 6 ms | 6 ms | Simplify the composition |
| Composition DOM nodes | 800 | 500 | 300 | Use SVG or canvas for dense parts |
| Remotion chunk (gzip) | measure and record it in the build report; keep out of the first bundle | | | Lazy load, split by composition |
| Poster image | 200 KB WebP or less | | | |
| Total composition media (video, audio) | 5 MB per section | 3 MB | 2 MB | Poster only on phone |
| Interaction latency from a prop change to the new frame | under 100 ms | | | Debounce, memoize |

Other rules:

- Never mount a Player above the fold unless it is the signature moment; the poster is the LCP.
- Mixed `<Video>` tags are the first thing to cut. A decorative loop should be an authored composition (SVG, CSS-driven by frame, canvas) rather than a decoded video. `@remotion/media` uses WebCodecs and a decoded-frame cache, which costs memory and decoder slots (`media.md`).
- Time slices: while a page has any other heavy canvas (Three, particles), the Remotion section falls to Thumbnail on a tier 2 or tier 3 device (`skills/jal-immersive/references/performance.md` tiers).
- Verify with the frame-time sampling method in `skills/jal-immersive/references/performance.md` and with `ui_audit`; record the numbers.

## 8. Accessibility and reduced motion

Full rules in `accessibility.md`. The short version:

- Reduced motion means a paused Thumbnail of the poster frame, no autoplay, no scroll scrub (the section shows the end state), and a visible play button for anyone who wants to start it.
- Any motion longer than 5 seconds has a pause control.
- Informative content gets a text alternative next to the Player; decorative content is `aria-hidden`.
- The built-in Remotion controls are only partly keyboard accessible (seek bar and volume are not exposed as sliders). Use custom controls with real inputs.

## 9. Export to MP4 on the page

An "Export video" button runs `renderMediaOnWeb` in the viewer's browser. It needs a composition written to the web-renderer's CSS and tag subset, a support check, progress, cancel, and a save target. See `web-renderer.md` section 7 and `client-side-rendering.md`. Record `exportable: true|false` in the composition's schema file. Privacy: the Player sends nothing, but each export sends the page origin and the visitor's IP to Remotion. On a public page in-browser export is used only when the feature is needed, with a privacy-policy line added automatically and no UI text (no notice, banner, or extra copy: Brian, 2026-10-01) (operational telemetry to Remotion as a technical provider); internal tools and dev pages use it freely (Brian, 2026-10-01; `skills/jal-remotion/SKILL.md` section 6).

## 10. Multiple Players on one page

- At most one Player with `browserMediaControlsBehavior="register-media-session"` (leave the others on the default).
- Only one Player plays sound at a time. Silent loops can coexist within the budget in section 7.
- Share one `inputProps` store if several Players show the same data.
- `getRemotionEnvironment()` and `delayRender()` are global and can conflict between a Player and a web render on the same page; use `useRemotionEnvironment()` and `useDelayRender()` in compositions that may run in both (`client-side-rendering.md` section 6).

## 11. Licensing for a website

- Free license: individuals and companies of up to 3 people. JAL is 3 people and every project is internal (Brian, 2026-10-01), so the free license applies to every JAL project, **including embedding the Remotion Player on a website**.
- The Remotion pricing page lists "embedding the Remotion Player" under the **Automators** plan (`$0.01 per render, $100 per month minimum`) for licensed companies. That plan is for organizations that need a company license (4 or more people, or collaborations). Record both: free covers the Player at JAL's size; the Automators plan would apply the moment the team reaches 4 people or an external client appears.
- **Warn and stop at 4 or more people, or an external client.** If the Git contributor list, the org seat count or any intake note shows 4 or more people on a Remotion project, or anyone outside JAL who would receive or run the source, stop and tell Brian before shipping. A product feature that lets visitors render their own video from a JAL composition is allowed (in-browser, with the privacy rule above); a service that renders user-supplied Remotion code is never built.
- `@remotion/media`, `@remotion/web-renderer`, `@remotion/player` and `remotion` are under the Remotion License. Mediabunny alone is MPL 2.0 and independent. The deprecated `@remotion/webcodecs` and `@remotion/media-parser` note a possible future "WebCodecs Conversion Seat" (`webcodecs.md`).
- Details in `products-and-licensing.md`.

## 12. Checks before shipping a Remotion section

1. Stage 0 poster present, ratio fixed, no layout shift.
2. Remotion not in the first bundle (inspect the `Bun.build` output; the lazy chunk only).
3. Reduced motion emulated: paused Thumbnail, no autoplay, no scrub, play button works.
4. No audio in autoplaying compositions; any sound starts from a press with `play(e)`.
5. Live Player count within budget; off-screen Players paused or unmounted.
6. Unmount cleanup: listeners removed, ScrollTrigger and Lenis destroyed, object URLs revoked.
7. `ui_audit` passes (overlap, tap targets, reduced-motion, stuck reveal).
8. Frame-time sampling recorded on a throttled profile.
9. Asset CORS verified if the composition reads cross-origin media or will export.
10. License check: team at 3 people or fewer and no external client; otherwise stopped for Brian. Export privacy: one privacy-policy line and no UI text on a public page.

## 13. Anti-patterns

- A Player mounted at page load with `autoPlay` and `controls` just to look alive.
- `inputProps={{ ... }}` inline in the render.
- A scroll listener that calls `seekTo` on every scroll event with no frame-change check.
- The current time held in the parent of the Player.
- A decoded `<Video>` where an authored composition would do.
- Importing `@remotion/player` in the main entry file.
- Wrapping a Remotion section in an iframe.
- Using Next.js, Vite or webpack to "make Remotion work" on a website.
- Headless Chrome as the default way to make a poster or an MP4.
