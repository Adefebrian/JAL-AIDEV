# Remotion Recorder

A free template and workflow for producing talking-head and screen-recording videos entirely in JavaScript: record a webcam and a display (up to 4 sources) as separate streams, then compose scenes with layouts, captions, transitions, music and an endcard in Remotion Studio, and render the result. It is a **content production tool**, not part of a website. It matters to JAL when a client wants video content produced and when a page shows such videos.

From: https://www.remotion.dev/docs/recorder/ , https://www.remotion.dev/docs/recorder/captions , https://www.remotion.dev/docs/recorder/create , https://www.remotion.dev/docs/recorder/demo , https://www.remotion.dev/docs/recorder/editing/ , https://www.remotion.dev/docs/recorder/editing/b-roll , https://www.remotion.dev/docs/recorder/editing/captions , https://www.remotion.dev/docs/recorder/editing/chapters , https://www.remotion.dev/docs/recorder/editing/cutting-clips , https://www.remotion.dev/docs/recorder/editing/endcard , https://www.remotion.dev/docs/recorder/editing/layout , https://www.remotion.dev/docs/recorder/editing/music , https://www.remotion.dev/docs/recorder/editing/normalizing-audio , https://www.remotion.dev/docs/recorder/editing/scenes , https://www.remotion.dev/docs/recorder/editing/silence-removal , https://www.remotion.dev/docs/recorder/editing/transitions , https://www.remotion.dev/docs/recorder/experiments , https://www.remotion.dev/docs/recorder/exporting , https://www.remotion.dev/docs/recorder/exporting-subtitles , https://www.remotion.dev/docs/recorder/external-recordings , https://www.remotion.dev/docs/recorder/gear , https://www.remotion.dev/docs/recorder/is-it-for-me , https://www.remotion.dev/docs/recorder/lambda-rendering , https://www.remotion.dev/docs/recorder/our-recorder , https://www.remotion.dev/docs/recorder/record/ , https://www.remotion.dev/docs/recorder/record/cropping , https://www.remotion.dev/docs/recorder/record/delete , https://www.remotion.dev/docs/recorder/record/manually , https://www.remotion.dev/docs/recorder/roadmap , https://www.remotion.dev/docs/recorder/setup , https://www.remotion.dev/docs/recorder/source-control , https://www.remotion.dev/docs/recorder/support , https://www.remotion.dev/docs/recorder/troubleshooting/cannot-read-properties-of-undefined

## 1. Decision for JAL

- The Recorder was once paid and is now a **free template**. It is a Remotion project, so it uses the Remotion Studio and the server renderer (an extra stack, and its rendering uses headless Chrome). It does not run inside a JAL website.
- Use it only when a JAL project's brief includes producing talking-head or tutorial videos, and then only with Brian's confirmation: the Recorder brings its own tooling and render path, a complex extra stack (Brian, 2026-10-01: Studio only in a separate video workspace, any CLI or server render per project with his yes). The output is MP4 files that a website then hosts or shows.
- Requirements: Bun 1.2 or newer (fits JAL), a laptop with a webcam and a microphone; optional better gear (the "gear" page lists the Remotion team's setup). Create with `bun create video --recorder`, then `bun i`, then optional `bun sub.ts` (installs Whisper.cpp and a model, default about 1.5 GB), then `bun run dev`.
- The license for the project is the Remotion License (free to 3 people).

## 2. Workflow

1. **Setup**: scaffold, install Bun, install dependencies, install Whisper.cpp (done automatically on the first finished clip if skipped). Troubleshooting entry: the error `Cannot read properties of undefined (reading 'decode')` on starting the Studio has its own page.
2. **Create a video** (a "Composition"): from the Recording interface in the browser or by duplicating a composition in the Studio.
3. **Record** in the built-in interface: webcam and display recorded separately and in sync (so the layout is decided later); several short clips, each becoming a scene; crop a source (a virtual camera or a display region, for example to hide the dock); delete a recording by removing its file in `public/<video>/`; add recordings from other devices by naming them `webcam<number>` or `display<number>` with a supported extension.
4. **Captions**: Whisper.cpp runs locally; captions are generated for files with the `webcam` prefix and saved beside the recordings; three ways to fix mistakes (in Studio click the faulty caption, edit the file, or the props); word-level timings; orphan words avoided.
5. **Edit** in Remotion Studio (`bun run dev`): scenes (title, video scene, endcard), layout (landscape 16x9 or square 1x1 through `canvasLayout`; a 9:16 format is planned), transitions (`transitionToNextScene`, only when the layout changes between two video scenes), b-roll (overlay extra footage or photos), chapters (`newChapter` text on a scene), cutting clips (prefer many short takes), silence removal (based on Whisper timestamps, generate captions first), music (three bundled tracks or your own), audio normalizing, an endcard configured in `config/endcard.ts`.
6. **Export**: Render in the Studio (files go to `out/`), or render on Lambda for long videos or several versions at once (needs the Lambda setup, a private site URL that must stay private, and a shell script with the deploy and render commands). Square layout burns subtitles in; landscape exports an `.srt` subtitle file (released 2024-06-23).
7. **Source control**: the `public` folder is git-ignored by default, so recordings are kept locally; only code changes are staged. Keep recordings in an artifact store if a team needs them.
8. **Experiments** page: community hacks such as automatically censoring words and replacing them with sound.
9. **Our Recorder**: the Remotion team's own instance of the Recorder is a public repository (`remotion-dev/our-recorder`), useful as a reference.
10. **Roadmap**: SRT export (done), 9:16 format with a different webcam and display layout and word-by-word animated captions, better editing experience, "edit once and feel native on each platform" (square, muted, burned captions for X and LinkedIn; 16:9 with `.srt` and an endcard for YouTube; 9:16 with a bottom safe area for TikTok, Reels and Shorts).
11. **Support**: the #recorder Discord channel, and issues in the Recorder repo.

## 3. Skills needed

Clone a Git repository, run commands, open a project in an editor. No coding is needed for the default style; coding unlocks customization. It is for people who want to own their workflow in source code.

## 4. Where it touches a JAL website

- A page that shows a Recorder video should host the MP4 in a normal `<video>` with a poster, captions track (`.vtt`; convert the `.srt`), and a transcript; or embed a Remotion Player of the composition if the viewer should be able to change props (rare).
- Captions produced by Whisper.cpp run locally, which keeps audio off third-party servers: a privacy plus when a client cares.
- Speed of production vs. cost: the first run downloads a model of about 1.5 GB; plan disk space.
- The Studio and the server renderer rely on a headless Chrome. For a JAL project that must avoid headless Chrome, produce the video in the Recorder as a separate content job outside the website repo, with Brian's confirmation, and only commit the output files.
