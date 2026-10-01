# Audio (import, trim, delay, volume, mute, speed, pitch, export, visualize)

From:
- https://www.remotion.dev/docs/audio/importing
- https://www.remotion.dev/docs/audio/trimming
- https://www.remotion.dev/docs/audio/delaying
- https://www.remotion.dev/docs/audio/volume
- https://www.remotion.dev/docs/audio/muting
- https://www.remotion.dev/docs/audio/speed
- https://www.remotion.dev/docs/audio/pitch
- https://www.remotion.dev/docs/audio/from-video
- https://www.remotion.dev/docs/audio/exporting
- https://www.remotion.dev/docs/audio/visualization
- https://www.remotion.dev/docs/audio/sfx

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01).

## What it is

Audio in Remotion is declared, not edited. You place `<Audio>` (or the sound of a `<Video>`) in the composition, and the renderer mixes every active track into the output. Everything below is a prop on the tag.

## When a JAL agent uses it

Any video with music, voice-over, SFX, or footage that has its own sound. Pair with `sfx.md` (sound effects), `captions.md` and `whisper.md` (speech to text), and `elevenlabs.md` (optional cloud speech).

## Import

Put the file in `public/` and use `staticFile()`; a remote URL also works. Several `<Audio>` tags mix together.

```tsx
import {AbsoluteFill, staticFile} from 'remotion';
import {Audio} from '@remotion/media';

export const Scene = () => (
  <AbsoluteFill>
    <Audio src={staticFile('voice.mp3')} />
    <Audio src={staticFile('music.mp3')} volume={0.2} />
  </AbsoluteFill>
);
```

Always import `Audio` and `Video` from `@remotion/media` (the current tags). `Html5Audio`, `Html5Video` and `OffthreadVideo` are the older tags from `remotion`; see the support table under Pitch for why that matters for the web renderer. By default audio plays from its start, at full volume, full length.

## Trim, delay, speed, pitch

| Need | Prop | Notes |
|---|---|---|
| Cut the start | `trimBefore={frames}` | Together with `durationInFrames` selects a section (docs: `trimBefore={2*fps} durationInFrames={2*fps}` plays 00:02 to 00:04). |
| Limit length | `durationInFrames={n}` | |
| Start later in the composition | `from={frames}` | Trim alone does not delay: the audio still starts at composition start unless `from` is set. |
| Speed | `playbackRate={n}` | 1 default, 0.5 half speed (twice as long), 2 double speed. Chrome accepts 0.0625 to 16. |
| Pitch | `toneFrequency={0.01..2}` | 1 is original, 0.5 down by half, 1.5 up 50%. Must be constant per asset, cannot be animated. |
| Loop | `loop` | `loopVolumeCurveBehavior` (`'repeat'` or `'extend'`, 4.0.142+) decides whether a volume curve restarts each loop: see `../core/media.md` (Common props) and `../web/media.md`; frame timing in `../core/timing-and-animation.md`. |

Support table for `toneFrequency` (and the general tag behavior):

| Tag | Preview | Server-side render | Client-side (browser) render |
|---|---|---|---|
| `<Audio>` / `<Video>` from `@remotion/media` | 4.0.520 | 4.0.357 | 4.0.523 |
| `<Html5Audio>`, `<Html5Video>`, `<OffthreadVideo>` from `remotion` | no | 4.0.47 | no |

JAL prefers the browser (WebCodecs) renderer, so new code uses the `@remotion/media` tags only.

## Volume

- A number from 0 to 1: `volume={0.5}`.
- Over time with `interpolate()`, always `extrapolateLeft: 'clamp'` because negative volume is not allowed:

```tsx
const frame = useCurrentFrame();
const {fps} = useVideoConfig();
<Audio src={staticFile('music.mp3')}
  volume={interpolate(frame, [0, fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
```

  With Studio interactivity on, Studio reads these keyframes, draws the volume curve in the timeline and lets you edit them. Select an audio or video row and press `V` to pick its volume property (4.0.530).
- A callback `volume={(mediaFrame) => ...}` receives a frame that starts at 0 when the media starts playing (not `useCurrentFrame()`). Use it for media-relative or procedural curves. Callback curves are drawn but not editable as keyframes. For looped media, `loopVolumeCurveBehavior` controls whether the curve restarts each loop.

### Ducking pattern

Music at 0.2 normally, 0.08 while a voice track speaks, ramped over about 8 frames. Build the "speaking" windows from the caption pages (`captions.md`: `page.startMs` to next page start) and `interpolate` between the two levels, so the mix follows the words and stays deterministic.

## Mute

`muted` is a prop on `<Audio>`, `<Video>` and the older tags, and may change over time: `muted={frame >= 2*fps && frame <= 4*fps}` silences seconds 2 to 4.

## Audio from video

The sound of a `<Video>` tag is included in the output. The same trim, delay, mute, speed and volume props apply to it (docs example: `playbackRate={2} volume={0.5}`).

## Export

Audio is included in any video export automatically. Audio only and no audio:

- Audio only: codecs `mp3`, `aac`, `wav`. CLI: `bunx remotion render src/index.ts my-comp out/audio.mp3` or `--codec=mp3`. API: `renderMedia({composition, serveUrl, codec: 'mp3', outputLocation, inputProps})`.
- No audio: `--muted` on the CLI, `muted: true` in `renderMedia()`. Faster when the video has no sound.
- The docs also show Lambda and Vercel variants (`renderMediaOnLambda`, `renderMediaOnVercel`, `imageFormat: 'none'`) and `bunx remotion lambda render --codec=mp3`. Those are paid third-party clouds: not JAL defaults, ask Brian.

## Visualize

`@remotion/media-utils` (MIT) reads audio so visuals can react to it.

```tsx
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
const audioData = useAudioData(music);              // music = staticFile('music.mp3')
if (!audioData) return null;
const bars = visualizeAudio({fps, frame, audioData, numberOfSamples: 16}); // numbers 0..1, low to high frequency
```

- Bar visualization suits music (each value is a frequency band; map to bar length). Waveform variant: `visualizeAudioWaveform()`.
- `useAudioData()` loads the whole file into memory. For large files use `useWindowedAudioData()` which loads a window around the current frame, but it only works with `.wav` files.
- Templates that already do this: Audiogram and Music Visualization (see `templates.md`).

## Where to find sounds

Free libraries named in the docs: freesound.org (many CC0), kenney.nl (all CC0), soundcn.xyz (UI and interaction sounds, check each licence), and ElevenLabs sound generation (paid, optional, Brian's confirmation, key in env). Music: use only CC0 or client-supplied tracks; record the source and licence in the project README.

## JAL rules

- Audio assets live in `public/`; reference with `staticFile()`; never depend on a third-party CDN at render time (see `sfx.md`).
- No generated speech or paid audio API without Brian's confirmation; keys only in env.
- Every video with speech ships captions (`captions.md`).
- Check loudness by ear and by meters: voice clearly above music; SFX normalised by Remotion to a -3 dB peak.

## See also

- `../core/media.md`: volume curves, `loopVolumeCurveBehavior`, sample rate, and which media tag to use.
- `../web/media.md`: the `@remotion/media` `<Audio>` props and the `@remotion/media-utils` visualizers.
- `../core/timing-and-animation.md`: frame timing, `<Sequence>` offsets, and the 30 fps token map.
- `sfx.md` (CC0-only sound), `captions.md` (every video with speech ships captions), `../rendering/render-paths.md` (audio-only renders).
