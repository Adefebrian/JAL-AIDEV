# ElevenLabs (@remotion/elevenlabs) and optional paid voice services

From:
- https://www.remotion.dev/docs/elevenlabs/
- https://www.remotion.dev/docs/elevenlabs/elevenlabs-transcript-to-captions
- https://www.remotion.dev/docs/elevenlabs/detect-elevenlabs-transcript-format
- https://www.remotion.dev/docs/audio/sfx (ElevenLabs sound generation mention)
- https://www.remotion.dev/templates/prompt-to-video (ElevenLabs voice-over in the template)

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01). `@remotion/elevenlabs` first shipped 4.0.443, MIT.

## What it is

A converter, not a client. `@remotion/elevenlabs` turns the output of the ElevenLabs Speech to Text API (or a transcript JSON exported from the ElevenLabs app) into `Caption[]` so the normal caption tools work (`captions.md`). It never calls ElevenLabs itself.

## When a JAL agent uses it

Only when Brian has confirmed ElevenLabs for the project, or when a client hands over an ElevenLabs JSON export. Otherwise use the free offline engines in `whisper.md`.

## Policy

- ElevenLabs is a **paid third-party service**. It is optional and needs Brian's confirmation before the first call in any project.
- The key is `ELEVENLABS_API_KEY` in `.env` only. Read on the server. Never in client code, never in Studio, never logged or printed, never committed.
- The docs say it plainly: do not call the ElevenLabs API from the browser, the key would be exposed. The converter itself is safe in any JavaScript environment because it works on data you already have.
- Converting a JSON file that a person exported from the ElevenLabs app needs no key and no network, so it is allowed without a paid call.

## Convert a Speech to Text response

Request word-level timing, otherwise there are no word captions:

```ts
import {elevenLabsTranscriptToCaptions} from '@remotion/elevenlabs';
const form = new FormData();
form.append('file', new Blob([await Bun.file('audio.mp3').arrayBuffer()]));
form.append('model_id', 'scribe_v2');
form.append('timestamps_granularity', 'word');
const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
  method: 'POST',
  headers: {'xi-api-key': process.env.ELEVENLABS_API_KEY!},
  body: form,
});
const {captions} = elevenLabsTranscriptToCaptions({transcript: await res.json()});
```

(The docs example reads the file with `fs.readFileSync`; the Bun form above is the same call.)

Accepted shapes of `transcript`:

1. **Speech to Text response.** Must contain `words: [{text, type, start, end}]` (seconds from audio start) and `language_code`. Each `type: "word"` becomes one caption. `type: "audio_event"` entries are skipped. `type: "spacing"` entries make no caption but their start time becomes the start of the next word.
2. **JSON export** (4.0.530). Needs `language_code` (may be null) and `segments`. Each segment becomes one caption (`text`, `start_time`, `end_time`), unless it has a non-empty `words` array, then each word becomes a caption. All times are seconds from audio start, not from the segment start.

Invalid input throws: missing or invalid required fields, negative timestamps, an end earlier than its start.

## Recognise a format

`detectElevenLabsTranscriptFormat(input)` (4.0.530) returns `'speech-to-text'`, `'segmented'` or `null`. It never throws and does not validate: a malformed value can still be recognised. Use it to route an upload, then let `elevenLabsTranscriptToCaptions()` do the validation and show its error to the user.

## Other ElevenLabs touch points in the docs

- **Sound effects:** the audio docs list ElevenLabs as a way to generate SFX from a description. Same policy: paid, optional, Brian's confirmation. JAL default SFX are the CC0 set in `sfx.md`.
- **Voice-over in the Prompt to Video template:** that template uses OpenAI for the script and ElevenLabs for the voice (see `templates.md`). It stays a pattern reference until Brian approves both services.
- **Text to speech:** Remotion ships no TTS package. If a project needs spoken narration and Brian has not approved a service, record or request the voice track and caption it.

## Install

`bunx remotion add @remotion/elevenlabs` (docs: `npx remotion add @remotion/elevenlabs`), exact-pinned to the project's Remotion version.
