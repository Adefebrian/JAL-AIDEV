# Mediabunny

Mediabunny is an independent multimedia library by Vanilagy for metadata, frame extraction, format conversion, trimming and cropping in the browser (and on servers). Remotion uses it inside `@remotion/media`, `@remotion/media-utils`, `@remotion/web-renderer`, the Studio and remotion.dev/convert. It **replaces** `@remotion/media-parser` and `@remotion/webcodecs`, which are deprecated (`media-parser.md`, `webcodecs.md`). For any media task on a JAL website, use Mediabunny.

From: https://www.remotion.dev/docs/mediabunny/ , https://www.remotion.dev/docs/mediabunny/can-decode , https://www.remotion.dev/docs/mediabunny/extract-frames , https://www.remotion.dev/docs/mediabunny/extract-thumbnail , https://www.remotion.dev/docs/mediabunny/formats , https://www.remotion.dev/docs/mediabunny/frame-rate , https://www.remotion.dev/docs/mediabunny/metadata , https://www.remotion.dev/docs/mediabunny/new-video , https://www.remotion.dev/docs/mediabunny/version , https://www.remotion.dev/docs/mediabunny/webcodecs-bugs

## 1. Status and relationship

- Mediabunny is a separate project. Remotion is a Gold Sponsor ($1000 per month). Report library bugs in Mediabunny's repo; report Remotion-usage issues in the Remotion repo.
- It runs on WebCodecs. WebCodecs is a browser API that exposes the platform's fast, GPU-capable encoders and decoders. It has nothing to do with WebAssembly or WebGPU (the misconceptions page, `webcodecs.md`).

## 2. Licensing

- Mediabunny itself is **MPL 2.0**, more permissive than Remotion. If a project uses only Mediabunny and not Remotion, no Remotion Company License is needed.
- Remotion packages that use it (`@remotion/media`, `@remotion/web-renderer`, `@remotion/player`, Studio) stay under the Remotion License. JAL (3 people or fewer) is covered by the free license; warn at 4 or more.
- Because MPL 2.0 is file-level copyleft, modifications to Mediabunny's own files must be shared; using it as a dependency unmodified has no such effect. Keep a line in `THIRD_PARTY_NOTICES.md` when it ships.

## 3. Install and version

```bash
bun add --exact mediabunny@<version Remotion expects>
# or: npx remotion add mediabunny (the Remotion helper), or npx remotion upgrade to move both together
```

Remotion pairs each of its versions with one Mediabunny version. The snapshot used for these files: Remotion 4.0.524 and later pairs with Mediabunny 1.56.1; 4.0.520 with 1.55.5; 4.0.513 with 1.55.1; 4.0.488 with 1.50.8; 4.0.487 with 1.50.7; 4.0.486 with 1.50.6; 4.0.485 with 1.50.3; 4.0.479 with 1.47.0. From Remotion 4.0.355 Mediabunny is loaded from `node_modules`, not bundled. Check with `npx remotion versions`. A mismatched Mediabunny can break `@remotion/media`, so pin it exactly.

## 4. Supported formats and codecs

- Containers: ISOBMFF (`.mp4`, `.m4v`, `.m4a`), QuickTime (`.mov`), Matroska (`.mkv`), WebM, Ogg, MP3, WAVE, ADTS (`.aac`), FLAC, MPEG-TS (`.ts`), HLS playlists (`.m3u8`, VOD only).
- Video codecs: AVC (H.264), HEVC (H.265), VP8, VP9, AV1, and ProRes (4.0.487, needs the `@mediabunny/prores` decoder, `videos.md` section 8).
- Audio codecs are listed on the formats page (AAC, Opus, MP3, Vorbis, FLAC and PCM variants).
- Note: Chrome Headless Shell cannot decode HEVC, so server renders of HEVC inputs through `<Video>` need a fallback (`media.md` section 4). In the user's real browser it depends on the device.
- Real browser support for decoding and encoding differs by device. Test on Safari and on a phone.

## 5. Recipes (copy into the project, from the Remotion docs, rewritten)

All use the same entry points: `Input` with `formats: ALL_FORMATS` and a `UrlSource` (or a `BlobSource` for a `File`), then ask the input for tracks.

**Metadata** (duration, size, frame rate):

```ts
import { Input, ALL_FORMATS, UrlSource } from "mediabunny";

export async function getMediaMetadata(src: string) {
  using input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src) });
  const durationInSeconds = await input.computeDuration();
  const video = await input.getPrimaryVideoTrack();
  const dimensions = video
    ? { width: await video.getDisplayWidth(), height: await video.getDisplayHeight() }
    : null;
  const metrics = video ? await video.computeFrameRateMetrics() : null;
  return { durationInSeconds, dimensions, fps: metrics?.bestGuessFrameRate ?? null,
           variableFrameRate: metrics ? !metrics.frameRateIsConstant : null };
}
```

Frame rate: constant (30 or 60 fps) or variable (typical for screen recordings that sample only on change). `computeFrameRateMetrics()` returns `bestGuessFrameRate`, `frameRateIsConstant`, and `probedPacketCount` (fewer than 2 means no answer). Use `bestGuessFrameRate` as the timeline recommendation. Page: `mediabunny/frame-rate`.

**Single thumbnail**:

```ts
import { ALL_FORMATS, Input, UrlSource, VideoSampleSink, type VideoSample } from "mediabunny";

export async function extractThumbnail(src: string, atSeconds: number, signal?: AbortSignal): Promise<VideoSample> {
  using input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src) });
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new Error("No video track");
  if (signal?.aborted) throw new Error("Aborted");
  const sample = await new VideoSampleSink(track).getSample(atSeconds);
  if (!sample) throw new Error(`No frame at ${atSeconds}s`);
  return sample;                                   // the caller closes it
}
// draw: canvas.width = s.displayWidth; canvas.height = s.displayHeight; s.draw(ctx, 0, 0); s.close();
```

A `VideoSample` holds a decoder frame: close it with `.close()` or `using` (garbage collection also closes it but warns). Pass an `AbortSignal` and add a timeout (abort after about 5 seconds) for remote files.

**Many frames (filmstrip)**: the docs' `extractFrames({ src, timestampsInSeconds | (options) => number[], onVideoSample, signal })` creates one `VideoSampleSink` and loops over timestamps, honoring the abort signal and closing each sample. Use it for a timeline strip or for turning a clip into key frames (a scroll-scrub `<Img>` sequence, `scroll-scrub.md` section 7).

**Can the browser decode this file?**: open the input, get the primary video and audio tracks, check `canDecode()` on each, and return false on any failure. Run it before offering a user-supplied file to a `<Video>`.

**Other tasks the docs link**: trimming, cropping and format conversion use Mediabunny's `Conversion` API (see the Mediabunny documentation; not on the fetched Remotion pages, **[verify]**). Replacements for the old `convertMedia()` flows are in `webcodecs.md`.

## 6. How the Remotion tags relate

`<Video>` and `<Audio>` from `@remotion/media` are "designed for frame-accurate video rendering, fast media extraction, minimal data fetching" (the `new-video` page), on top of Mediabunny and WebCodecs. See `media.md`.

## 7. Known WebCodecs bugs (tracker)

The Remotion team and community track browser bugs here. Examples open at the snapshot: software AVC decoder dropping initial B-frames (Chrome), rendering on a 144+ Hz monitor throttling the VideoDecoder by 5 to 10 times (Chrome), VideoEncoder not respecting `visibleRect` (Chrome), `AudioData.copyTo` with interleaved f32 (Firefox), AAC encoder producing a wrong decoder config description (Safari). Several others are marked fixed. Use the list when a decode or export looks wrong only in one browser. The 144 Hz item is relevant to scroll-scrub pages on high-refresh laptops: if a media-heavy scrub stutters there, suspect decoder throttling and cut the media. **[verify]** the live tracker page before filing a bug.

## 8. JAL rules

1. New media code uses Mediabunny. Do not add `@remotion/media-parser` or `@remotion/webcodecs`.
2. Pin Mediabunny to the version the installed Remotion expects.
3. Run heavy extraction in a Web Worker so the page stays responsive (Mediabunny works in workers; no JAL helper exists yet, **[verify]**).
4. Always close `VideoSample` and `AudioSample` objects and dispose the `Input` (`using`).
5. Handle `InputDisposedError` and aborts quietly.
6. Never send a visitor's file to a server just to read its metadata; read it in the browser.
