# Lottie, GIF and animated emoji

From:
- https://www.remotion.dev/docs/lottie/
- https://www.remotion.dev/docs/lottie/lottie
- https://www.remotion.dev/docs/lottie/getlottiemetadata
- https://www.remotion.dev/docs/lottie/staticfile
- https://www.remotion.dev/docs/lottie/remote
- https://www.remotion.dev/docs/lottie/lottiefiles
- https://www.remotion.dev/docs/gif/
- https://www.remotion.dev/docs/gif/gif
- https://www.remotion.dev/docs/gif/get-gif-duration-in-seconds
- https://www.remotion.dev/docs/gif/preload-gif
- https://www.remotion.dev/docs/animated-emoji/
- https://www.remotion.dev/docs/animated-emoji/animated-emoji
- https://www.remotion.dev/docs/animated-emoji/get-available-emoji

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01). The Lottie and animated-emoji pages list the Remotion License (free up to 3 people, see `showcase-patterns.md#license-and-pricing`); the GIF page lists no licence line.

## Which asset type to pick

| Need | Pick | Why |
|---|---|---|
| Vector UI/icon animation from a designer (After Effects export) | Lottie | Small, scalable, seekable per frame |
| A GIF someone already supplied | `<Gif>` | Frame-synced to the composition clock |
| Photographic or transparent motion | WebM/MP4 with the video tags | Smaller and sharper than GIF; GIF is a last resort |
| Animated emoji | Only if the brief explicitly asks (see emoji section) | JAL no-emoji law |

Interactive Rive and the core `<AnimatedImage>` belong to other references; they are named here only because the GIF page compares against `<AnimatedImage>`.

## Lottie

Install: `bunx remotion add @remotion/lottie` and `bun i lottie-web` (the docs say install `@remotion/lottie` and `lottie-web` together; keep `@remotion/lottie` on the exact Remotion version). It plays animations through `lottie-web`, seeking with `goToAndStop()`.

Supported: playing, speed change, forward and backward, remote files, reading dimensions and duration. Unsupported: other renderers beyond the three below, `setSubFrame()`, `setLocationHref()`, and expressions are only partly supported: since each frame is a `goToAndStop()` call, an expression that is not deterministic can flicker in the output and Remotion cannot fix it upstream. Preview animations with expressions across a full render before delivering.

```tsx
import {Lottie, LottieAnimationData} from '@remotion/lottie';
import {useEffect, useState} from 'react';
import {staticFile, useDelayRender} from 'remotion';

export const Balloons = () => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const [handle] = useState(() => delayRender('Loading Lottie animation'));
  const [data, setData] = useState<LottieAnimationData | null>(null);
  useEffect(() => {
    fetch(staticFile('balloons.json')).then((r) => r.json())
      .then((j) => { setData(j); continueRender(handle); })
      .catch((e) => cancelRender(e));
  }, [handle, continueRender, cancelRender]);
  return data ? <Lottie animationData={data} loop /> : null;
};
```

(The docs use the older module-level `delayRender`/`continueRender` imports from `remotion`; the hook form above is what the newer captions docs use. Both work for the same reason: the render waits until the JSON is loaded.)

Three ways to load: import the `.json` directly (`import animationData from './animation.json'`), `staticFile()` plus fetch (above), or a remote URL (the server must allow CORS). Only render `<Lottie>` once data exists. Memoise `animationData`: a changed object identity re-initialises the animation.

### Lottie props

`animationData` (required), `className`, `style` (applied to the wrapping div), `direction` (`'forward' | 'backward'`), `loop` (default false), `playbackRate` (default 1), `renderer` (`'svg'` default, `'canvas'`, `'html'`, 4.0.105), `preserveAspectRatio` (4.0.105), `onAnimationLoaded` (receives the lottie-web `AnimationItem`), `assetsPath` (4.0.138; e.g. `staticFile('lottie')` loads embedded image assets from `public/lottie`; assets with `e: 0` take that prefix, `e: 1` use absolute URLs). Since 4.0.528 it also inherits the standard timing props from `<Sequence>`: `durationInFrames`, `trimBefore`, `freeze`, `hidden`, `name`, `showInTimeline` (default false here), `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted`.

### Lottie metadata

Returns `{width, height, fps, durationInFrames (rounded down), durationInSeconds}` or `null` if unparsable. Use it in `calculateMetadata()` to size a composition to the animation's natural length.

### Finding Lottie files

LottieFiles hosts shared animations: open one, Download, choose **Lottie JSON**, put the file in `public/`. JAL checks the licence of every animation before use (many are not free for commercial work), prefers designer-made files owned by the client, and records the source in the README. Remotion has an "Import from After Effects" guide for designer-made animations (it is not one of the pages this file covers).

## GIF

Install `bunx remotion add @remotion/gif`. `<Gif>` draws the GIF on a canvas and syncs it to `useCurrentFrame()`, using a JavaScript decoder (so it works in Safari). It does not support animated AVIF or WebP; for those use the core `<AnimatedImage>`.

```tsx
import {Gif} from '@remotion/gif';
<Gif src={staticFile('cat.gif')} width={w} height={h} fit="cover" playbackRate={1} loopBehavior="loop" />
```

| Prop | Meaning |
|---|---|
| `src` | URL or local file. Remote GIFs must send CORS headers (render origin is usually `http://localhost:3000`, may differ on Lambda or a busy port). |
| `width`, `height` | Display size; do not set them through `style`. |
| `fit` | `fill` (default, stretches), `contain`, `cover`. |
| `loopBehavior` | `loop` (default), `pause-after-finish`, `unmount-after-finish` (a ref becomes null afterwards). |
| `playbackRate` | Default 1 (4.0.44). |
| `onLoad` | Gives `{width, height, delays, frames: ImageData[]}`. |
| `effects` | 4.0.464, effects applied to each frame after it is drawn on the canvas. |
| `cropLeft`, `cropRight`, `cropTop`, `cropBottom` | 4.0.500, ratios 0 to 1. |
| `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted` | 4.0.497, mount the canvas early (hidden, frozen on first frame) so a big GIF can load and build its frame cache before it shows. |
| `delayRenderTimeoutInMilliseconds` | 4.0.403, default 30 s load timeout. |
| `requestInit` | 4.0.471, options for the internal `fetch()` (credentials, headers). |
| `ref` | A `HTMLCanvasElement` ref. |
| `style` | Custom CSS (no width/height). |

- `getGifDurationInSeconds(src, {requestInit}?)` returns the duration of one pass in seconds, ignoring looping; works for imported, `staticFile()` and remote GIFs (CORS for remote). Use it in `calculateMetadata()`.
- `preloadGif(src, {requestInit}?)` returns `{waitUntilDone(): Promise<void>, free(): void}`. Use it in a `<Player>` so the GIF is ready before play; call `free()` to release memory.

JAL: GIFs are large and low quality. When you control the source, convert to WebM/MP4 or Lottie instead. Use `<Gif>` when a client file is already a GIF.

## Animated emoji

Only when the brief explicitly asks.

JAL law forbids emoji in product UI and generated content. These assets are therefore **available but never a default**: no agent uses them unless the written brief or the client request names animated emoji. If used, say so in the README.

What it is: the Google Fonts Animated Emoji packaged as `<AnimatedEmoji emoji="blush" />`. Licence: assets are CC BY 4.0, so **attribution to the creators is required**; the component package is under the Remotion License. Install `bunx remotion add @remotion/animated-emoji`.

- **Assets are not bundled.** Copy the videos from the `public` folder of the `remotion-dev/animated-emoji` repository into the project's `public/`. (Fetching them is a download: do it only on an explicit request.) Or point `calculateSrc` at your own location. Default `calculateSrc` returns `staticFile(`${emoji}-${scale}x.${ext}`)`, with `ext` = `webm` (VP9 alpha) or `mp4` (when `format` is `hevc`).
- **Props:** `emoji` (name), `scale?` (`0.5` = 512 px, `1` = 1024 px default, `2` = 2048 px), `calculateSrc?`.
- **Names:** `getAvailableEmojis()` returns `{name, categories, tags, durationInSeconds, codepoint}[]` (several hundred names such as `blush`, `100`, `airplane-arrival`). Use `durationInSeconds` to size a `<Sequence>`.
- **Limit:** it uses `<OffthreadVideo>` underneath, which does not support client-side (browser) rendering. Under JAL's preferred browser renderer these will not render; they are server-render only.
- In place of emoji, JAL motion uses shapes, icons from the koboyo/reicon sources, Lottie, or SVG.
