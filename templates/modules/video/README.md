# Video module (opt-in)

Remotion is the main motion core of JAL-AIDEV. This module puts Remotion compositions on JAL websites and gets MP4 out of the browser: a composition registry with three JAL examples, `RemotionSection` (the Player as kit media, poster first, lazy, reduced-motion safe, autoplay or scroll scrub), an in-browser MP4 export on WebCodecs, and an optional Remotion Studio entry. Websites keep `Bun.build`; nothing here adds Vite, Next.js, or webpack to `apps/web`.

## When to copy it

- A page needs frame-accurate motion that is also a video: a product intro, a data story, a social cut, a demo that must also ship as MP4.
- Scroll-driven storytelling where every scroll position is an exact frame (scrub mode).
- Not for UI micro-motion or entrances (the kit's own motion and `packages/motion` cover those), and not for 3D scenes (`packages/scene`). A composition can sit beside them: the scrub runs on Lenis's clock when the motion module is present.

## How to copy it

From the client repo root (a JAL monorepo scaffolded from `templates/monorepo`):

```sh
cp -R <jal-aidev>/templates/modules/video packages/video
```

1. Replace `__APP_NAME__` with the project's name in `packages/video/` (package.json and `src/`), add `"@<project>/video": "workspace:*"` to `apps/web/package.json`, and run `bun install`. `apps/web` never lists a Remotion package itself.
2. Import the styles once after the kit: `@import "../../../packages/video/src/video.css";` in `apps/web/src/styles.css`.
3. Build with `NODE_ENV=production bun run build.ts` (see "Bun findings": without it Bun.build bundles React's development build).
4. Record the ADR: the module, the pinned version, the render path (in-browser), the team size against the license.
5. Run `bun <jal-aidev>/scripts/video/check.ts --team <people>` from the client root.

### package.json

The plugin's dependency guardrail (`hooks/guardrails.mjs`) still blocks any manifest that names `remotion` or `@remotion/*`, so this template carries its manifest here until the guardrail allows Remotion in `packages/video`. Write it as `packages/video/package.json`:

```json
{
  "name": "@__APP_NAME__/video",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "sideEffects": ["./src/video.css"],
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "lint": "echo 'no lint configured for packages/video' && exit 0",
    "studio": "remotionb studio"
  },
  "dependencies": {
    "@__APP_NAME__/ui": "workspace:*",
    "@remotion/player": "4.0.532",
    "@remotion/transitions": "4.0.532",
    "@remotion/web-renderer": "4.0.532",
    "remotion": "4.0.532",
    "zod": "4.5.4"
  },
  "peerDependencies": { "react": ">=19 <19.4", "react-dom": ">=19 <19.4" },
  "devDependencies": {
    "@happy-dom/global-registrator": "^15.11.0",
    "@types/bun": "^1.1.0",
    "@types/react": "~19.3.0",
    "@types/react-dom": "~19.3.0",
    "react": "~19.3.0",
    "react-dom": "~19.3.0",
    "typescript": "^5.7.0"
  }
}
```

## License

Remotion is free for JAL under its Free License while JAL is **3 people** (2 devs and 1 AI specialist). **At 4 people or more a Company License is required** before Remotion is used again: https://remotion.dev/license. `scripts/video/check.ts --team N` (or `"team"` in `.jal/video.json`) warns from 4. The Player is told the license was acknowledged (`acknowledgeRemotionLicense`), and the in-browser renderer gets `licenseKey: "free-license"`; pass the Company License key to `exportMp4` (or `Mp4Export licenseKey`) once JAL holds one.

## Render paths

| Path | Package | Status | Notes |
|---|---|---|---|
| Website playback | `@remotion/player` | default | the Player and Thumbnail in `RemotionSection`, bundled by Bun.build |
| MP4 in the browser | `@remotion/web-renderer` (WebCodecs through Mediabunny) | **default MP4 path** | `exportMp4`, `Mp4Export`; no server, no Chrome; feature-detects WebCodecs and says why when it cannot, never falls back to a server |
| Remotion Studio (preview, prop editing) | `@remotion/cli` (brings `@remotion/bundler`, webpack, inside `packages/video` only) | optional | `bun add -d --exact @remotion/cli@4.0.532` in `packages/video`, then `bunx remotionb studio` |
| CLI render, Studio's Render button | `@remotion/cli`, `@remotion/renderer` (Chrome Headless Shell) | **needs Brian's yes** | headless Chrome rendering; never the default |
| Lambda, Cloud Run, Vercel | `@remotion/lambda`, `@remotion/cloudrun`, `@remotion/vercel` | **needs Brian's yes** | cloud rendering and its accounts; any complex extra stack also needs his confirmation |

## Pinned versions (verified 2026-10-01 against the npm registry)

All `@remotion/*` packages and `remotion` are published together and must share one exact version (no `^`): **4.0.532** (released 2026-10-01, `latest`). Every one of them asks only `react >=16.8.0` (the web renderer `>=18.0.0`), so the template's React `~19.3.0` (19.3.0 is `latest`) satisfies them all; `bun install` reports no peer warning.

| Package | Version | In this module |
|---|---|---|
| `remotion` | 4.0.532 | dependency: the core (frames, `interpolate`, `Easing`, `AbsoluteFill`, `Composition`) |
| `@remotion/player` | 4.0.532 | dependency: `Player`, `Thumbnail` |
| `@remotion/web-renderer` | 4.0.532 | dependency: `renderMediaOnWeb`, `canRenderMediaOnWeb` (stable since 4.0.491) |
| `@remotion/transitions` | 4.0.532 | dependency: `TransitionSeries`, `slide`, `fade` (the social cut) |
| `zod` | 4.5.4 | dependency: the prop schemas; the exact version Remotion 4.0.532's Studio and `@remotion/media` pin (latest zod is 4.6.5) |
| `@remotion/shapes`, `@remotion/paths` | 4.0.532 | come with transitions; add explicitly when a composition imports them |
| `@remotion/noise`, `@remotion/media-utils`, `@remotion/zod-types` | 4.0.532 | add when a composition needs them, at the same version |
| `@remotion/cli` | 4.0.532 | optional devDependency for Studio (above) |
| `@remotion/bundler`, `@remotion/renderer` | 4.0.532 | server render path: needs Brian's yes |

## File map

| File | Holds |
|---|---|
| `src/compositions/registry.ts` | `VideoEntry` (size, fps, duration, poster frame, `load()`, `schema()`), the three entries, `VIDEOS`, `resolveProps`, `loadVideo`. No runtime imports. |
| `src/compositions/schemas.ts` | The zod schema per composition; the prop types are inferred from them. Its own chunk. |
| `src/compositions/ProductIntro.tsx` | 16:9, 6 s: headline lines rise from masks a stagger apart, the lead follows, a surface panel arrives and three figures count up |
| `src/compositions/DataStory.tsx` | 16:9, 8 s: bars grow on the curve, the story focuses (others step back, the highlight turns ink and shows its value), the delta counts |
| `src/compositions/SocialCut.tsx` | 9:16, 7 s: hook, three numbered points, end card, joined by `slide` and `fade` on the curve, inside the platform safe area |
| `src/compositions/parts.tsx` | `ease`, `riseStyle`, `MaskLine` (R03), `Hairline`, `countAt` (R07), `formatFigure` |
| `src/compositions/tokens.ts` | JAL Core values for frames (ink on white, tonal layers, Geist, the one curve as `Easing.bezier(0.24, 1, 0.4, 1)`, durations in frames) |
| `src/compositions/Root.tsx` | The Remotion Root registry for Studio: every composition with its schema and defaults |
| `src/web/RemotionSection.tsx` | The kit band: `Section composition="media" variant="video-<mode>"`, optional `SectionHead`, the frame |
| `src/web/RemotionFrame.tsx` | The media itself: aspect box, poster, lazy chunks, Thumbnail, Player, play and pause policy, scrub, the controls bar |
| `src/web/policy.ts` | Pure rules: `resolveStage`, `shouldPlay`, `resolveControls`, `scrubProgress`, `progressToFrame`, `viewportBox` |
| `src/web/scroll.ts` | `watchScroll`: Lenis's clock when given, native scroll on `getScroller()` otherwise, one rAF per burst, no idle loop |
| `src/export/mp4.ts` | `checkMp4Support`, `exportMp4` (progress, cancel, props validation), `downloadBlob` |
| `src/export/support.ts` | `hasWebCodecs`, the MP4 codec order (H.264, VP9, AV1), messages, `framesIn` |
| `src/export/Mp4Export.tsx` | `useMp4Export` and the `Mp4Export` control (Export, progress, Cancel, Download) |
| `src/studio/index.ts`, `remotion.config.ts` | Optional Studio entry (`registerRoot`, Geist loaded with `staticFile`) and its config (entry point, public dir = the ui package's fonts) |
| `src/video.css` | Size cap for tall cuts, the stage layer, the controls bar |
| `src/**/*.test.ts` | See "Checks" |

## Using it

```tsx
import { useLenis } from "@<project>/motion"; // only when the page runs the motion module
import { dataStory, Mp4Export, productIntro, RemotionFrame, RemotionSection, socialCut } from "@<project>/video";

// Autoplay: muted, inline, only while on screen, plays once and holds its last frame.
<RemotionSection id="intro" tone="layer" video={productIntro}
  title="Six seconds, three numbers." lead="..."
  label="Hawa product intro: the headline rises line by line, then three figures count up"
  poster={{ src: "/media/product-intro.webp" }} />

// Scrub: the frame follows scroll progress; on Lenis's clock when it runs.
function Story() {
  return <RemotionSection id="story" video={dataStory} mode="scrub" scrollClock={useLenis()} title="..." label="..." />;
}

// Manual, inside another composition's media slot, with the MP4 export in its bar.
<Split id="social" title="..." media={
  <RemotionFrame video={socialCut} mode="manual" label="..." maxBlockSize="70svh"
    actions={<Mp4Export video={socialCut} frameRange={[0, 89]} label="Export 3 s MP4" />} />
} />
```

`inputProps` overrides a composition's defaults; they are validated by its schema first (the schema chunk loads only then), and an invalid override draws the defaults and says why in the console.

### What RemotionFrame guarantees

- **No layout shift.** The kit media frame holds `width / height` from the server HTML on. Tall cuts are capped at `maxBlockSize` (default `80svh`): the width follows the capped height.
- **Poster first.** Server HTML and first paint are the box plus the `poster` image when given (export one from Studio or a frame of the MP4). `@remotion/player` and the composition load as their own chunks when the frame comes within `nearMargin` (default `50% 0px`) of the scroller, a `Thumbnail` at `posterFrame` takes over, and the `Player` mounts once the frame has been on screen.
- **Reduced motion.** The Thumbnail at `posterFrame` stays: no autoplay, no scrub, no clock. A Play control remains so the viewer can opt in.
- **Offscreen and hidden tabs pause**, and autoplay resumes on return unless the viewer paused. A run without `loop` holds its last frame and offers Replay (`loop` is for pieces built to loop seamlessly; a loop that snaps back to frame 0 reads as a glitch).
- **Controls policy.** Scrub: none (scroll is the control). Autoplay: a pause control whenever it runs past 5 s (WCAG 2.2.2), even if `controls="none"` was asked for. Manual: a JAL Play and Pause button. All of it is a 44px kit button in a bar below the media, never over it. `controls="remotion"` switches to Remotion's own overlay controls.
- **Audits.** The section is `data-kit-composition="media"`, so ui_audit's rhythm, repetition, and dead-space rules see it. The slot is `data-jal-canvas` with `role="img"` and the label; the composition's DOM sits in an `aria-hidden` stage with no pointer events, so the audit treats the drawn frame like a canvas.
- **Scroller.** Visibility and scrub use `getScroller()` after mount: a contained shell's `main.shell-main` or the window.

### Writing compositions

- A picture is a pure function of `useCurrentFrame()`: no state, effects, or timers.
- Use the values in `tokens.ts` and the one curve; every move is `ease(frame, start, length)`.
- Stay inside what the in-browser renderer draws (client-side-rendering/limitations): layout, `transform`, `opacity`, `background-color`, a full `border`, `border-radius`, `overflow`, text properties. No `z-index`, `mix-blend-mode`, `backdrop-filter`, `perspective`, or `<foreignObject>`. Text is HTML, not SVG `<text>` (SVG text only gets fonts loaded through `@remotion/fonts`).
- Borders are the 1px hairline; separators are 2px filled divs. No gradients, shadows, glow, side stripes, eyebrows, or emoji, as on the page.
- Silent by default: the Player runs with `numberOfSharedAudioTags={0}`. A composition with sound needs `media-src data:` in the page CSP and its own audio tag count.
- Register a new composition in `registry.ts`, `schemas.ts`, and `Root.tsx`, with a `posterFrame` where everything has landed.

## CSP

The template's CSP (`apps/web/server.ts`: `default-src 'self'`, `script-src 'self'`, `connect-src 'self' <api>`) plays and scrubs every composition with no change. Measured on an export page:

- `worker-src blob:` is blocked, so the web renderer's background keepalive worker fails ("Background keepalive worker encountered an error"). The export still finishes in a foreground tab. Allowing `worker-src 'self' blob:` on export pages lets it keep rendering in a background tab.
- After each render the web renderer posts a usage event (page origin, success, no video data) to `https://www.remotion.pro/api/track/register-usage-point`. `connect-src` blocks it; the export is unaffected, the console logs it, and the renderer retries a few times. Allowing it or keeping it blocked is Brian's call.

## Bun findings (Bun 1.3.14, Remotion 4.0.532)

- `Bun.build` bundles the Player, the Thumbnail, the compositions, `@remotion/transitions`, and `@remotion/web-renderer` with no plugin and no config; each `import()` is its own chunk. `bunx remotionb studio` runs Studio under Bun (Remotion prints its "mostly supported" note).
- `Bun.build` inlines `process.env.NODE_ENV` from the build process and bundles React's **development** build when it is unset (react-dom 117 KB gzip instead of 65 KB). Build with `NODE_ENV=production`. The template's `infra/Dockerfile.web` sets it only in the runtime stage, after `bun run build.ts`.
- `import { z } from "zod"` (zod 4 classic) pulls every zod locale into the bundle: an 84 KB gzip chunk. That is why the schemas are their own chunk, loaded only when props need validating.
- The web renderer's AAC, FLAC, and MP3 encoders (264, 87, and 130 KB gzip) are lazy chunks. A muted export (every JAL composition) never fetches them.
- Remotion's Bun runtime caveat (`lazyComponent` disabled on Bun) does not apply: the module loads compositions with its own `import()` and passes `component`.

## Budget

`Bun.build`, minified, browser target, `NODE_ENV=production`, gzip, 2026-10-01, the proof page (kit page, React and the kit in the entry):

| Chunk | gzip | Loads |
|---|---|---|
| Page entry (React 64.6 KB, kit, RemotionSection, registry) | 82.3 KB | at load |
| `remotion` core | 83.0 KB | with the first video near the viewport |
| `@remotion/player` | 18.6 KB | with the first video near the viewport |
| ProductIntro, DataStory, SocialCut (with transitions) | 1.0, 1.2, 11.9 KB | each with its own section |
| Schemas (zod) | 84.3 KB | only when a page passes `inputProps` |
| `@remotion/web-renderer` and Mediabunny | 34.1 and 71.4 KB | on the first export click |
| Audio encoders (AAC, FLAC, MP3) | 264.5, 86.6, 130.1 KB | never for a muted export |

So a page with one video pays 82 KB at load and about 103 KB more as the video approaches; the export adds 105 KB on demand.

## Checks

```sh
bun test            # policy, scroll, export: fakes only, no install needed
                    # registry and RemotionSection tests need the workspace installed (they skip with a note otherwise)
bunx tsc --noEmit   # needs the workspace installed
bun <jal-aidev>/scripts/video/check.ts --team 3      # one exact Remotion version, no bundler in apps, render paths to confirm, license
bun <jal-aidev>/scripts/video/probe-mp4.ts out.mp4   # duration, size, codec, frames of an exported file
```

Then `bun mcp/jal-design/server.ts audit <url>` on the page.

Browser proof, 2026-10-01 (the three compositions on a kit page built with Bun.build and served by Bun on port 4195, headless Chrome with SwiftShader over the DevTools protocol): only the video near the top loaded at first paint, the others stayed posters; the intro Player advanced 22 to 23 frames per 700 ms (30 fps), froze offscreen (frame 117 held), and resumed on return; the scrub landed on exactly the expected frame at three scroll positions on the document shell (36, 120, 203) and on a contained shell (48, 120, 191), and followed Lenis's eased scroll frame by frame with the motion module on; under reduced motion all three stayed Thumbnails and the frame never changed; the in-browser export of the 9:16 cut, frames 0 to 89, finished in about 2 s and produced a 276,509-byte H.264 High MP4, 1080x1920, 90 frames, 2.97 s by its container, fast start, which ffprobe reads and whose frames show Geist and the slide transition; no zod or audio-encoder chunk was fetched. Studio listed all three compositions with schema-driven prop editing and Geist loaded. `ui_audit` PASS at 375 and 1280.
