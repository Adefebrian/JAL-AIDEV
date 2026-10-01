# Data fetching, delayRender, environment and artifacts (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01).

## What it is

How a composition gets async data and assets safely under a renderer that screenshots frames on many tabs: fetch once in `calculateMetadata()`, or block the screenshot with `delayRender()` and release it with `continueRender()` / `cancelRender()`. Plus the environment probes (`useRemotionEnvironment`), Player buffering (`useBufferState`), side-file output (`<Artifact>`) and the render timeout.

## When a JAL agent uses it

Any comp that loads JSON/API data, a font, an image, a Lottie file, a model, a map tile, or computes something async. Also when a comp must behave differently in Studio, Player and render, and when a render emits extra files (SRT captions, thumbnail, credits).

## Preferred order

1. JSON-serialisable data: fetch in `calculateMetadata()` (runs once, no handles, can set duration). See `props-and-schemas.md`.
2. Binary or non-JSON assets (fonts, images, wasm, 3D models): `useDelayRender()` inside the component.
3. Never fetch inside the component with `frame` in the effect dependencies (fetches every frame). Never call `delayRender()` at module top level (blocks every other composition and the composition list).

## calculateMetadata data fetching

```tsx
import {Composition, type CalculateMetadataFunction} from 'remotion';
import {z} from 'zod';

const api = z.object({title: z.string(), description: z.string()});
export const schema = z.object({id: z.string(), data: z.nullable(api)});
type Props = z.infer<typeof schema>;

export const calc: CalculateMetadataFunction<Props> = async ({props, abortSignal}) => {
  const res = await fetch(`https://example.com/api/${props.id}`, {signal: abortSignal});
  return {props: {...props, data: api.parse(await res.json())}};
};

const Comp: React.FC<Props> = ({data}) => {
  if (data === null) throw new Error('Data was not fetched');   // nullable data type, throw in component
  return <h1>{data.title}</h1>;
};
// <Composition id="X" component={Comp} schema={schema} defaultProps={{id: '1', data: null}} calculateMetadata={calc} .../>
```
- Input and output props must be the same TS type, so model data as `T | null` and throw when null.
- Returned `props` are re-fetched when the Studio props editor changes `id`.
- `abortSignal` (an `AbortController` signal) cancels stale requests while typing in the Studio; debounce expensive APIs with a helper that skips waiting when `getRemotionEnvironment().isRendering` and rejects with `new Error('stale')` when aborted.
- Wrapped in a `delayRender()` with the default 30 s timeout. Set duration from data the same way: `return {durationInFrames: Math.ceil(props.seconds * 30), fps: 30}`.

## useDelayRender (preferred) and the global functions

```tsx
import {useEffect, useState} from 'react';
import {useDelayRender} from 'remotion';

export const WithData: React.FC = () => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();   // 4.0.342+, cancelRender 4.0.374+
  const [handle] = useState(() => delayRender('Fetching data...'));        // always inside useState initializer
  const [data, setData] = useState<unknown>(null);
  useEffect(() => {
    fetch('/data.json')
      .then((r) => r.json())
      .then((j) => { setData(j); continueRender(handle); })
      .catch((e) => cancelRender(e));
  }, [continueRender, cancelRender, handle]);
  return <pre>{data ? JSON.stringify(data) : null}</pre>;
};
```

Signature: `delayRender(label?: string, options?: {timeoutInMilliseconds?: number; retries?: number}): number` (options 4.0.140+); `continueRender(handle)`; `cancelRender(error: string | Error): never` (throws; cancels all pending handles, no retry).

Rules and gotchas:
- No effect in Studio or Player (use `useBufferState` there). Render only.
- The render waits while at least one handle is uncleared. Multiple handles are fine; all must be cleared.
- Default timeout about 30 s (error says "not cleared after 28000ms"). Label every handle to find the culprit. Raise it: `--timeout` flag, Studio render dialog (Advanced), `timeoutInMilliseconds` on `renderMedia/renderStill/renderFrames/getCompositions/renderMediaOnLambda/...`, `Config.setDelayRenderTimeoutInMilliseconds()`, per handle `{timeoutInMilliseconds}`, per tag `delayRenderTimeoutInMilliseconds` on `<Img>`, `<Audio>`, `<Html5Audio>`, `<Html5Video>`, `<IFrame>`.
- `retries` (default 0): when a handle times out the whole tab is closed and the frame retried. Tags have `delayRenderRetries`.
- Bugs to avoid: top-level `delayRender()`; `const handle = delayRender()` in the component body (new handle each React render); `useState(() => buffer.delayPlayback())` (strict mode leaks).
- `cancelRender` throws; in client-side rendering (`renderMediaOnWeb`) wrap it in `try/catch` or it becomes an unhandled error.
- `continueRender` compatibility: no-op in Node/Bun/Player/Studio; in client-side rendering use the hook form.
- Timeouts have other causes: forgetting `continueRender`, no network or firewall (cloud VPC), too-high concurrency with `<Html5Video>`, a large file behind `<OffthreadVideo>` (use `<Video>` from `@remotion/media`).
- Overfetching: every render tab (up to 200 on Lambda) runs your effect. Data must be identical across tabs or it flickers.

## useBufferState (Player/Studio buffering)

```tsx
const buffer = useBufferState();           // 4.0.111+
useEffect(() => {
  const h = buffer.delayPlayback();         // returns {unblock()}
  loadSomething().then(() => h.unblock());
  return () => h.unblock();                 // always clean up on unmount/seek
}, []);
```
Do not create the handle in `useState()`. Use `useBufferState` together with `useDelayRender` when data should block both preview playback and render screenshots. No-op in server and client-side render.

## Environment

```ts
import {useRemotionEnvironment, getRemotionEnvironment, VERSION} from 'remotion';
const {isStudio, isRendering, isPlayer, isReadOnlyStudio, isClientSideRendering} = useRemotionEnvironment(); // 4.0.342+
```
Prefer the hook (scoped, future-proof for browser rendering) over `getRemotionEnvironment()` (4.0.25+, global; all false in Node/Bun/serverless). `isClientSideRendering` 4.0.344+. `VERSION` is importable from `remotion` or `remotion/version` (no React import). Use the environment to swap a tag in preview vs render (`<Html5Video>` in preview, `<OffthreadVideo>`/`<Video>` in render), skip debounce during render, or show guides only in Studio. `bunx remotion versions` prints installed versions; all `remotion` and `@remotion/*` packages must be the exact same version (no `^`).

Detect a Remotion-made video: ffprobe `comment=Made with Remotion x.y.z`; `window.remotion_imported` in DevTools; remotion.dev/convert metadata.

## Artifacts (extra output files, 4.0.176+)

```tsx
import {Artifact, useCurrentFrame} from 'remotion';
const Meta: React.FC = () => {
  const frame = useCurrentFrame();
  return frame === 0 ? <Artifact filename="captions.srt" content={srtString} /> : null;   // emit on ONE frame only
};
// thumbnail: <Artifact filename="thumbnail.jpeg" content={Artifact.Thumbnail} />  (4.0.290+, format = imageFormat setting)
```
- `filename`: forward slashes only, charset `0-9a-zA-Z-!_.*'()/:&$@=;+,?`, unique per comp. `content`: `string | Uint8Array` (binary is serialised, not faster). `downloadBehavior` (4.0.296+, serverless): `{type:'play-in-browser'}` or `{type:'download', fileName}`.
- Rendered output goes to `out/<composition-id>/<filename>` (CLI/Studio). Node: `onArtifact(artifact)` on `renderMedia/renderStill/renderFrames` (`filename`, `content`, `frame`). Browser: `onArtifact` on `renderMediaOnWeb()` / `renderStillOnWeb()` from `@remotion/web-renderer` (type `EmittedArtifact`). Lambda: S3 `renders/<id>/artifacts/<filename>`, listed by `getRenderProgress().artifacts`. Cloud Run: not supported. No-op in Studio and Player.

## Combining with JAL

- Fonts are the most common asset to block on: see `assets-and-fonts.md` (`@remotion/fonts` and `@remotion/google-fonts` already handle the delay).
- Where the live page and the comp share a fetcher, put the fetch in the page (Hono route) and pass the JSON as `inputProps`; do not call JAL APIs with credentials from inside a bundle.
- Client-side/web rendering path: use `useDelayRender()` everywhere so the same comp works in `renderMediaOnWeb`.

From:
- https://www.remotion.dev/docs/data-fetching
- https://www.remotion.dev/docs/delay-render
- https://www.remotion.dev/docs/continue-render
- https://www.remotion.dev/docs/cancel-render
- https://www.remotion.dev/docs/use-delay-render
- https://www.remotion.dev/docs/timeout
- https://www.remotion.dev/docs/use-buffer-state
- https://www.remotion.dev/docs/artifact
- https://www.remotion.dev/docs/artifacts
- https://www.remotion.dev/docs/get-remotion-environment
- https://www.remotion.dev/docs/use-remotion-environment
- https://www.remotion.dev/docs/detect-remotion
- https://www.remotion.dev/docs/version
- https://www.remotion.dev/docs/version-mismatch
