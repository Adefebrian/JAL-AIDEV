# Captions (@remotion/captions)

From:
- https://www.remotion.dev/docs/captions/
- https://www.remotion.dev/docs/captions/api
- https://www.remotion.dev/docs/captions/caption
- https://www.remotion.dev/docs/captions/transcribing
- https://www.remotion.dev/docs/captions/create-tiktok-style-captions
- https://www.remotion.dev/docs/captions/displaying
- https://www.remotion.dev/docs/captions/importing
- https://www.remotion.dev/docs/captions/parse-srt
- https://www.remotion.dev/docs/captions/exporting
- https://www.remotion.dev/docs/captions/serialize-srt
- https://www.remotion.dev/docs/captions/ensure-max-characters-per-line

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01). `@remotion/captions` is MIT, first shipped 4.0.216.

## What it is

One plain data type, `Caption`, that every transcription source can produce, plus helpers to import `.srt`, group words into display pages, and export `.srt`. Because all sources converge on `Caption`, the display code never changes when the speech-to-text engine does.

```ts
type Caption = {
  text: string;               // whitespace sensitive: put the space BEFORE each word
  startMs: number;
  endMs: number;
  timestampMs: number | null; // one point in time; whisper.cpp fills it with t_dtw, else null or the midpoint
  confidence: number | null;  // 0..1 or null
  pageBreakAfter?: boolean;   // 4.0.517: force a new page / new SRT cue after this caption
};
```

The type has no runtime requirement (plain TypeScript). It matches the format used by the Editor Starter and the caption elements.

## When a JAL agent uses it

Any video with speech or lyrics, any subtitle deliverable, any word-by-word (TikTok style) overlay. Install: `bunx remotion add @remotion/captions` (or `bun i @remotion/captions@4.0.532 --exact` and keep every Remotion package on the same version).

## Pick the transcription source

| Source | Where it runs | Speed | Cost | Offline | Needs server | Converter |
|---|---|---|---|---|---|---|
| `@remotion/whisper-webgpu` | Browser or Node with a GPU | Fast, GPU dependent | Free | Yes | No | `toCaptions()` |
| `@remotion/install-whisper-cpp` | Node-compatible server or dev machine | Fast, hardware dependent | Free | Yes | Yes | `toCaptions()` |
| `@remotion/whisper-web` (WASM) | Browser | Slow | Free | Yes | No | `toCaptions()` |
| `@remotion/openai-whisper` | OpenAI cloud | Fast | Paid per OpenAI pricing | No | No | `openAiWhisperApiToCaptions()` |
| `@remotion/elevenlabs` | ElevenLabs cloud | Fast | Paid per ElevenLabs pricing | No | No | `elevenLabsTranscriptToCaptions()` |

JAL order (decided 2026-10-01): a script or SRT the project already has needs no approval and is the default. Automatic transcription needs Brian's yes per project (transformers.js and ONNX, the OpenAI Whisper API, and ElevenLabs are off until he approves; whisper.cpp is a native toolchain); once approved, whisper-webgpu first, whisper.cpp for a server without a GPU, the two cloud options last with keys in env. Details and code are in `whisper.md` and `elevenlabs.md`. Studio can also transcribe a selected asset to `<asset>-captions.json` in its Jobs panel.

## Group words into pages

Safe in the browser, Node and Bun. Input words must carry their leading space; without spaces the whole text merges into one page.

```ts
import {createTikTokStyleCaptions} from '@remotion/captions';
const {pages} = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200,   // high = many words per page, low = word by word
  breakOnSilenceAfterMilliseconds: 400,    // optional, 4.0.514: a gap this long starts a new page
});
// page: {text, startMs, durationMs, tokens: [{text, fromMs, toMs}], ...}
```

- `combineTokensWithinMilliseconds` is the upper bound on page length. `breakOnSilenceAfterMilliseconds` only adds earlier breaks; `0` gives one word per page. It compares caption timestamps, it does not listen to the audio.
- A page's `durationMs` runs until the next page starts, so text stays on screen through pauses.
- A caption with `pageBreakAfter: true` ends its page; the token keeps the marker.

## Display

1. Load `captions.json` with `useDelayRender()` so the render waits for the fetch (pattern: `const {delayRender, continueRender, cancelRender} = useDelayRender()`, call `delayRender()` before `fetch(staticFile('captions.json'))`, `continueRender(handle)` after, `cancelRender(e)` on error).
2. `createTikTokStyleCaptions()` once, memoised.
3. One `<Sequence>` per page. Start frame = `page.startMs / 1000 * fps`; end frame = the smaller of next page start and start plus the switch window; skip pages with duration <= 0.
4. Inside a page, the Sequence resets the frame, so absolute time = `page.startMs + frame / fps * 1000`. A token is active when `fromMs <= absolute < toMs`. Color the active token.
5. Container style must include `whiteSpace: 'pre'` or the spaces collapse.

```tsx
const CaptionPage = ({page}: {page: TikTokPage}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontSize: 80, fontWeight: 'bold', textAlign: 'center', whiteSpace: 'pre'}}>
        {page.tokens.map((t, i) => (
          <span key={`${t.fromMs}-${i}`} style={{color: t.fromMs <= nowMs && t.toMs > nowMs ? ACTIVE : BASE}}>
            {t.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

Polish from the docs: `fitText()` from `@remotion/layout-utils` to fit width, enter and exit animations per page, and a legibility outline `WebkitTextStroke: '4px black'` with `paintOrder: 'stroke'`.

JAL: `ACTIVE` and `BASE` come from the brand tokens (the docs use a hard-coded bright green `#39E508` as a demo value, do not copy it). Keep contrast at WCAG AA against the footage, keep captions inside the safe area for the target platform, and never use emoji glyphs in caption styling.

## Import .srt

`parseSrt({input})` returns `{captions}` with `confidence: 1`. Load with `staticFile('subtitles.srt')` plus the same delayRender pattern, or `fetch()` a URL. `strict: true` (4.0.530, default false) rejects malformed or empty files, checks every timestamp and ordering, ignores positioning settings such as `align:start`; Studio imports use strict. JAL uses `strict: true` for client-supplied files and shows the error text.

## Export subtitles

- Burned in: just render the video after the display component is in place.
- Separate file: emit an `<Artifact>` on frame 0 only, using `serializeSrt({lines})`. `lines` is an array of cues, each cue an array of words (words concatenate with no added spaces; cue start = first word `startMs`, end = last word `endMs`; empty arrays ignored; `pageBreakAfter` starts a new cue; use a newline in `text` for two visual lines). The file lands at `out/<composition-id>/subtitles.srt` (the page only shows the CLI render; check that the renderer JAL picks, especially the browser renderer, emits artifacts, see the artifacts page in the rendering reference).
- Word-by-word captions to readable cues: run `createTikTokStyleCaptions({combineTokensWithinMilliseconds: 3000})` and map each page's tokens back to `Caption` objects (`startMs = fromMs`, `endMs = toMs`, `timestampMs = midpoint`).

```tsx
{frame === 0 ? <Artifact filename="subtitles.srt" content={srt} /> : null}
```

## ensureMaxCharactersPerLine

Internal and undocumented; it only honors `pageBreakAfter`. Do not use it. Write line wrapping with `fitText()` or CSS.

## JAL rules

- Store captions as `public/<asset>-captions.json` (same name Studio's transcribe job writes).
- Indonesian is the default product language. English-only models (`*.en`) cannot do Bahasa Indonesia; use a multilingual model and set the language (see `whisper.md`).
- Ship an `.srt` next to every captioned MP4 and keep captions as real text (not only burned in) wherever the player allows, for accessibility and SEO.
- Captions are text data: escape them when rendering outside React, and never put secrets or private transcripts in a public `public/` folder.
