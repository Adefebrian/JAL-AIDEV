# Props, schemas, metadata and Studio interactivity (Remotion core)

Written against `remotion` 4.0.532 (docs read 2026-10-01).

## What it is

How data enters a composition and how the Studio edits it: `defaultProps`, input props, `calculateMetadata()`, Zod `schema`, inferred controls, `getInputProps()`, env variables, and the new `Interactive` / `InteractivitySchema` layer that makes elements selectable and keyframable in the Studio timeline.

## When a JAL agent uses it

Every parameterised video (brand name, copy, colours, dataset rows, user upload URL), every composition whose length depends on media or data, and every time the Brian-facing deliverable should be editable in the Studio (`bun run dev`) without touching code.

## Resolution order (memorise)

1. `defaultProps` on `<Composition>` (static, Studio-editable, define the data shape).
2. Input props override them (CLI `--props='{"a":1}'` or `--props=./file.json`; `renderMedia({inputProps})`; the Studio render dialog; Player `inputProps`). Merge, input wins. Must be a JSON-serialisable object.
3. `calculateMetadata()` may transform props and compute metadata (async OK).
4. Final props go to the component as ordinary React props.

Studio: edits in the right sidebar (Cmd/Ctrl+J, "Props" tab) change default props live; invalid edits get a red outline and do not apply. `--props` on `remotion studio` takes priority over default props and sidebar edits (not recommended). Pass the same `inputProps` to BOTH `selectComposition()` and `renderMedia()` in Node APIs.

## defaultProps rules

- JSON-serialisable only; `Date`, `Map`, `Set` and `staticFile()` results are allowed and restored correctly. Functions/classes are dropped (not in the Player, which can pass anything).
- Use a `type` alias, not an `interface`, for the props type (interfaces break the `Record<string, unknown>` constraint).
- Huge objects in `defaultProps` are slow; fetch the bulk in `calculateMetadata()` instead.
- Keep `defaultProps` as an inline object literal in `<Composition>` so the Studio can write edits back to the file (the save button). A variable reference loses that.
- Inference (4.0.516+): with `defaultProps` and no `schema` the Studio makes controls: string -> text, CSS-colour string -> colour picker (needs `@remotion/zod-types`; string is a colour if the prop name contains "color" and the value is valid, or uses `#`, `rgb()`, `hsl()`, `oklch()`), `staticFile()` value -> asset picker, number, boolean, `Date`, plain object -> nested, non-empty homogeneous array -> list editor. No control for `null`, `undefined`, empty arrays, mixed arrays, class instances. A prop literally named `type` becomes a read-only literal.

## Zod schema (`schema` prop)

```bash
bunx remotion add zod            # installs zod with the right version
bunx remotion add @remotion/zod-types   # zColor(), zTextarea(), zMatrix()
```

```tsx
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';
import {Composition} from 'remotion';

export const titleSchema = z.object({
  title: z.string().min(1),
  accent: zColor(),
  size: z.number().min(24).max(200).step(2),
  mode: z.enum(['light', 'dark']),
});

export const Root: React.FC = () => (
  <Composition
    id="Title"
    component={Title}
    schema={titleSchema}
    defaultProps={{title: 'Hello', accent: '#0b84ff', size: 96, mode: 'light'}}
    durationInFrames={90} fps={30} width={1920} height={1080}
  />
);
const Title: React.FC<z.infer<typeof titleSchema>> = ({title}) => <h1>{title}</h1>;
```

- Top level must be `z.object()`. All Zod types validate; Studio has controls for object, string, date, number, boolean, array, union of exactly (T | null/undefined), optional, nullable, enum, `zColor`, `zTextarea`, `zMatrix`, `.min() .max() .step()`, and `staticFile()` assets typed as `z.string()`.
- Define a schema only when you need runtime validation, enums/unions/optionals, number constraints, descriptions or special controls. An explicit schema overrides inference.
- Schema type must match `defaultProps` or TypeScript errors.
- Edit props as JSON via the "JSON" toggle; invalid JSON is rejected.

## calculateMetadata() (4.0.0+)

```ts
import type {CalculateMetadataFunction} from 'remotion';
const calculateMetadata: CalculateMetadataFunction<Props> = async ({props, defaultProps, abortSignal, compositionId, isRendering}) => ({
  durationInFrames, width, height, fps,          // all optional
  props,                                         // transformed props (same shape)
  defaultCodec: 'h264',                          // beats config file, loses to explicit renderMedia({codec})
  defaultOutName: 'out-name',                    // 4.0.268+, no extension
  defaultVideoImageFormat: 'png',                // 4.0.316+: 'png' | 'jpeg' | 'none'
  defaultPixelFormat: 'yuv420p',                 // 4.0.316+: yuv420p, yuva420p, yuv422p, yuv444p, yuv420p10le, yuv422p10le, yuv444p10le, yuva444p10le
  defaultProResProfile: 'hq',                    // 4.0.367+: 4444-xq, 4444, hq, standard, light, proxy
  defaultSampleRate: 44100,                      // 4.0.448+
});
```
- Runs once per render (inside `selectComposition()`, one tab), regardless of concurrency; re-runs in the Studio whenever props change, so use `abortSignal` to cancel stale fetches. Must resolve within the delayRender timeout. Not available in the Player (compute your own length and pass it to the Player).
- `compositionId` 4.0.98+, `isRendering` 4.0.342+.
- Returned fields beat the props passed to `<Composition>`. Override flags: `--width` and friends beat `calculateMetadata`; `--scale` is applied last and beats everything.
- True randomness (`Math.random`) is safe here.
- Use it for: duration from a media file or caption list, fps switching, data fetching (see `data-and-delayrender.md`), default codec/format per composition.
- Metadata from a media file: use Mediabunny (`Input`, `UrlSource`, `ALL_FORMATS`; `input.computeDuration()`, `getPrimaryVideoTrack()`, `computeFrameRateMetrics()`), in browser or Bun. The old `useEffect` + `delayRender` approach is discouraged since 4.0 (re-runs in every render worker).

```ts
calculateMetadata={async ({props}) => {
  const seconds = await getSeconds(props.src);           // your Mediabunny helper
  return {durationInFrames: Math.max(1, Math.floor(seconds * 30)), fps: 30};
}}
```

## getInputProps() and env variables

- `getInputProps()` returns the raw `--props` / `inputProps` object; only for the Root component. A composition component gets them as normal props. No-op (`{}`) in the Player, in client-side rendering, in Node and in serverless functions. Prefer typed props or `calculateMetadata`.
- Env: only variables prefixed `REMOTION_` are forwarded from the shell (`REMOTION_MY_VAR=x bun run dev`, read as `process.env.REMOTION_MY_VAR`). `.env` and `.env.local` in the Remotion root are read automatically by the CLI (4.0.110+; `--log=verbose` shows which file). With Node/Bun APIs (`renderMedia`, `renderMediaOnLambda`, `renderMediaOnVercel`) nothing is auto-read: pass `envVariables: {...}` (load `.env` yourself). `envVariables` is not for AWS credentials. Never put real secrets in props or env that ends up inside a public bundle; Remotion bundles are client-side.

## Interactive and visual editing (4.0.475+)

`Interactive.*` elements are selectable and draggable in the Studio preview and accept the 5 timing props plus `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted` (4.0.528+) and `cropLeft/Right/Top/Bottom` (4.0.506+).

- HTML: `A Article Aside Button Code Div Em Footer H1-H6 Header Label Li Main Nav Ol P Pre Section Small Span Strong Ul`. SVG: `Circle Ellipse G Line Path Rect Svg Text`. Example: `<Interactive.Div from={30} durationInFrames={90} style={{translate: '0 20px', opacity: 1}}>`.
- Keep editable values inline, use hardcoded `interpolate()` keyframe arrays, use `translate`/`scale`/`rotate`/`opacity` properties (not `transform` strings and not animated `top`/`left`) so keyframes stay visually editable.
- Schema fragments: `Interactive.baseSchema` (durationInFrames, from, trimBefore, playbackRate, freeze, hidden, name, showInTimeline), `transformSchema`, `cropSchema`, `textSchema` (color, fontFamily, fontSize, lineHeight, fontWeight, fontStyle, textAlign, letterSpacing), `backgroundSchema` (backgroundColor longhand), `borderSchema`, `borderRadiusSchema`, `svgPaintSchema`, `svgStrokeSchema`, `premountSchema`, `sequenceSchema`, `captionsSchema`. Types `InteractiveBaseProps`, `InteractiveTransformProps`, `InteractiveCropProps`, `InteractivePremountProps`.
- `Interactive.withSchema({Component, componentName, schema, wrapInSequence: true})` (4.0.530+) wraps a custom component. `Component` must accept `style` and apply it to its visual root; ref forwarding preserved.

```tsx
import {Interactive, type InteractivitySchema} from 'remotion';
const schema = {
  radius: {type: 'number', min: 1, step: 1, default: 80, description: 'Radius', hiddenFromList: false},
  color: {type: 'color', default: '#0b84ff', description: 'Color'},
} as const satisfies InteractivitySchema;
const Dot: React.FC<{radius?: number; color?: string; style?: React.CSSProperties}> = ({radius = 80, color = '#0b84ff', style}) => (
  <div style={{...style, width: radius * 2, height: radius * 2, borderRadius: '50%', background: color}} />
);
export const InteractiveDot = Interactive.withSchema({Component: Dot, componentName: '<Dot>', schema, wrapInSequence: true});
```

`InteractivitySchema` (4.0.479+, NOT Zod; Zod is for `<Composition>` props; also used by `createEffect()`): dot-notation keys (`'style.opacity'`), field types `number boolean color text-content asset(assetType audio|video|image 4.0.521+) font-family(4.0.485+) font-weight enum(variants) array(item,newItemDefault,minLength,maxLength) remotion-captions(4.0.500+) rotation-css rotation-degrees translate transform-origin scale uv-coordinate(visual: line|ellipse) svg-path hidden`. Common props: `type`, `default`, `description`, `keyframable` (default true for numeric/colour/transform/path types; false for array, asset, font-family, text-content, captions; enum opt-in 4.0.509 with step1 hold; boolean hold keyframes 4.0.530), `defaultKeyframeOutput: 'linear' | 'perceptual-scale'` (4.0.490), `min`, `max`, `step`, `integer` (4.0.528), `hiddenFromList`.

Keyframes written by the Studio are `interpolate()` calls (colour: `interpolateColors`, font weight: `outputType: 'font-weight'`, paths: `interpolatePaths()` from `@remotion/paths`). Posterize in the source is respected by Studio.

## Reusing a composition as a plain component

A registered component is still a normal React component: `<MyComponent propOne="hi" />`. Concatenate scenes in a master composition with `<Series>` (see `compositions.md`) and register that as another `<Composition>`.

## Batch / dataset renders (Chrome-based, Brian confirms)

Loop `selectComposition({serveUrl, id, inputProps: row})` then `renderMedia({composition, serveUrl, codec: 'h264', outputLocation, inputProps: row})` after `bundle({entryPoint})` from `@remotion/bundler`. Do not run several renders at once (each uses all cores). Runs fine under `bun render.ts`. This path uses headless Chrome: it is optional in JAL and needs Brian's yes; the lighter path (client-side / web renderer) is in the rendering reference.

## Minimal Bun-ready example

```tsx
// src/Root.tsx
import {Composition} from 'remotion';
import {Card} from './Card';

type CardProps = {name: string; repo: string; seconds: number};
export const Root: React.FC = () => (
  <Composition
    id="Card"
    component={Card}
    width={1080} height={1080} fps={30} durationInFrames={90}
    defaultProps={{name: 'JAL', repo: 'jal/example', seconds: 3} satisfies CardProps}
    calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.seconds * 30))})}
  />
);
```

## Combining with the JAL kit

Props are the contract between JAL data and a video: pass JAL design tokens as props (colours, font family names, copy) instead of importing app CSS inside a comp. JEV picks the density; the Core design tokens are the source of colours and type unless the brief says otherwise.

From:
- https://www.remotion.dev/docs/passing-props
- https://www.remotion.dev/docs/parameterized-rendering
- https://www.remotion.dev/docs/schemas
- https://www.remotion.dev/docs/default-props-inference
- https://www.remotion.dev/docs/props-resolution
- https://www.remotion.dev/docs/calculate-metadata
- https://www.remotion.dev/docs/dynamic-metadata
- https://www.remotion.dev/docs/get-input-props
- https://www.remotion.dev/docs/env-variables
- https://www.remotion.dev/docs/interactive
- https://www.remotion.dev/docs/interactive-with-schema
- https://www.remotion.dev/docs/interactivity-schema
- https://www.remotion.dev/docs/visual-editing
- https://www.remotion.dev/docs/dataset-render
