# Remotion CLI reference (`@remotion/cli`)

Written against `remotion` 4.0.532 (docs read 2026-10-01).

From:
- https://www.remotion.dev/docs/cli/
- https://www.remotion.dev/docs/cli/add
- https://www.remotion.dev/docs/cli/benchmark
- https://www.remotion.dev/docs/cli/browser/
- https://www.remotion.dev/docs/cli/browser/ensure
- https://www.remotion.dev/docs/cli/bundle
- https://www.remotion.dev/docs/cli/compositions
- https://www.remotion.dev/docs/cli/create-video
- https://www.remotion.dev/docs/cli/ffmpeg
- https://www.remotion.dev/docs/cli/ffprobe
- https://www.remotion.dev/docs/cli/gpu
- https://www.remotion.dev/docs/cli/help
- https://www.remotion.dev/docs/cli/install
- https://www.remotion.dev/docs/cli/render
- https://www.remotion.dev/docs/cli/skills
- https://www.remotion.dev/docs/cli/still
- https://www.remotion.dev/docs/cli/studio
- https://www.remotion.dev/docs/cli/upgrade
- https://www.remotion.dev/docs/cli/versions
- https://www.remotion.dev/docs/bun

## What it is

The `remotion` command: start the Studio, render, bundle, list compositions, benchmark, manage the browser, upgrade packages. Server-side commands (`render`, `still`, `benchmark`, `compositions`, `gpu`) start Chrome Headless Shell, so on JAL they follow render-paths.md (local fallback or service).

## When a JAL agent uses it

Daily: `studio` for preview, `add` and `upgrade` for versions, `bundle` for a static Studio or a Serve URL. Rarely: `render` and `still` (fallback path or inside the Coolify render service).

## Run it with Bun

By default `npx remotion` runs under Node, even `bunx remotion` does, unless you add `--bun`. To run under Bun replace `remotion` with `remotionb` (since 4.0.118), for example in package scripts: `"render": "remotionb render"`. `npx create-video` and `bun create video` set the scripts to `remotionb`. Deno is not supported; `remotiond` exists for experiments only.

Known Bun caveats (Remotion's Bun page, tested on Bun 1.0.24 and Remotion 4.0.88, so re-check on JAL's Bun version):

- The `lazyComponent` prop on `<Composition>` and `<Player>` does not work. Remotion disables it automatically, so import components normally.
- A server-side rendering script may not quit by itself after finishing. End the process explicitly (`process.exit(0)`) or run the render as a child process with a timeout.
- `remotion add` and `remotion upgrade` list npm, yarn and pnpm as supported package managers. With Bun, install with `bun add --exact` and verify with `remotionb versions`.

`bunx remotionb bundle` is allowed and a little faster than `npx` as a script runner for static deploys.

## Command index

| Command | Since | Purpose |
| --- | --- | --- |
| `remotion studio` (alias `preview`) | 1.x | Start the Studio |
| `remotion render [entry\|serve-url] [composition-id] [output]` | 1.x | Render video or audio |
| `remotion still [entry\|serve-url] [composition-id] [output]` | 2.3 | Render one frame |
| `remotion compositions [entry\|serve-url]` | 2.6.12 | Print composition ids |
| `remotion bundle [entry\|serve-url]` | 4.0.89 | Make a Remotion bundle (static Studio, Serve URL) |
| `remotion benchmark <entry> [ids,comma,separated]` | 3.2.28 | Time renders at several concurrency values |
| `remotion browser ensure` | 4.0.137 | Download Chrome Headless Shell if missing |
| `remotion gpu` | 4.0.52 | Print how Chrome uses the GPU |
| `remotion add <package...>` | 4.0.367 | Add Remotion packages at the matching version (also `zod`, `mediabunny`, `@huggingface/transformers` at recommended versions) |
| `remotion upgrade` | 3.2.33 | Upgrade all Remotion packages and auxiliary packages |
| `remotion versions` | 2.6.2 | Print installed versions, flag mismatches |
| `remotion skills add` / `update` | not stated | Install or update Agent Skills from `remotion-dev/skills` into `.agents/skills` (Claude Code compatibility through a `.claude/skills` symlink) |
| `remotion ffmpeg`, `remotion ffprobe` | 4.0 | Run the bundled FFmpeg 7.1-line and FFprobe, which only understand H.264, H.265, VP8, VP9 and ProRes |
| `remotion help` | 1.x | List commands |
| `remotion install ffmpeg\|ffprobe` | removed 4.0 | Historical |
| `npx create-video` | 1.x | Scaffold a project (see below) |

## `render` flags

Positional: entry point or Serve URL (optional), composition id (asked if missing), output location (default: `out` folder). Default codec is H.264. Inline JSON for `--props` does not work in Windows shells; pass a file path.

| Flag | Meaning |
| --- | --- |
| `--props` | Input props as JSON string or file path |
| `--height`, `--width`, `--fps`, `--duration` | Override composition dimensions, rate, length (fps and duration since 4.0.424) |
| `--concurrency` | Tabs in parallel; number or percent; default half the CPU threads |
| `--codec` | `h264`, `h265`, `av1` (not on Linux ARM64 GNU), `vp8`, `vp9`, `prores`, `h264-mkv`, `gif`, `png` (sequence) and audio `mp3`, `aac`, `wav` |
| `--audio-codec`, `--audio-bitrate`, `--video-bitrate`, `--buffer-size`, `--max-rate`, `--crf`, `--x264-preset`, `--gop`, `--prores-profile`, `--pixel-format`, `--color-space`, `--number-of-gif-loops` | Encoding controls; use `--crf` or `--video-bitrate`, not both |
| `--image-format`, `--jpeg-quality`, `--scale`, `--sequence`, `--image-sequence-pattern` | Frame capture and image sequence output |
| `--frames` (since 2.0; a comma list like `0,30,60` since 4.0.502 renders an image sequence), `--every-nth-frame` | Subset of frames |
| `--muted`, `--enforce-audio-track`, `--sample-rate`, `--separate-audio-to`, `--for-seamless-aac-concatenation`, `--prefer-lossless` | Audio |
| `--hardware-acceleration` | Use hardware encoders if available |
| `--disallow-parallel-encoding` | Lower memory, slower |
| `--output`, `--overwrite` | Alternative output path; overwrite defaults to true, `--overwrite=false` to refuse |
| `--config`, `--env-file`, `--bundle-cache`, `--log` (`error`, `warn`, `info`, `verbose`), `--port`, `--public-dir`, `--timeout` | Project and run control; timeout is the per-frame `delayRender()` budget in ms |
| `--browser-executable`, `--chrome-mode`, `--gl`, `--ignore-certificate-errors`, `--disable-web-security`, `--disable-headless`, `--dark-mode`, `--user-agent`, `--enable-multiprocess-on-linux`, `--binaries-directory` | Browser |
| `--media-cache-size-in-bytes`, `--offthreadvideo-cache-size-in-bytes`, `--offthreadvideo-video-threads` | Decoder memory and threads |
| `--rspack` | Bundle with Rspack (4.0.502) |
| `--repro` | Make a reproduction zip |
| `--metadata` | Container metadata key and value |
| removed | `--quality` (now `--jpeg-quality`), `--ffmpeg-executable`, `--ffprobe-executable` |

## `still` flags

Same project and browser flags as `render`, plus `--frame` (default 0), `--image-format` (`png`, `jpeg`, `webp`, `pdf`), `--jpeg-quality`, `--scale`, `--output`, `--overwrite`. To render several stills use `render` with `--frames` (4.0.502).

## Other command flags

- `studio`: `--props`, `--config`, `--env-file`, `--log`, `--port`, `--public-dir`, `--disable-keyboard-shortcuts`, `--disable-canvas-tabs` (4.0.530), `--disable-interactivity` (4.0.487), `--allow-html-in-canvas` (4.0.447), `--editor` (4.0.503), `--coding-agent` (4.0.506), `--rspack`, `--webpack-poll`, `--no-open`, `--browser`, `--browser-args`, `--beep-on-finish`, `--ipv4` (needed on Fly.io), `--number-of-shared-audio-tags`, `--experimental-keep-audio-context-alive`, `--preview-sample-rate`, `--cross-site-isolation` (4.0.364), `--disable-ask-ai`, `--force-new`, `--public-license-key`. While it runs, press `s` in the terminal to reopen the Studio in the browser (4.0.487).
- `compositions`: `--props`, `--config`, `--env-file`, `--bundle-cache`, `--log`, `--port`, `--public-dir`, `--timeout`, browser flags, `--chrome-mode`.
- `bundle`: `--config`, `--log`, `--public-dir`, `--out-dir` (default `build`), `--public-path` (4.0.127), `--disable-git-source`, `--rspack`. Since 4.0.497 output is relocatable.
- `benchmark`: `--runs`, `--concurrencies`, plus inherited render flags (`--codec`, `--crf`, `--frames`, `--image-format`, `--pixel-format`, `--props`, `--prores-profile`, `--gop`, `--jpeg-quality`, `--log`, `--hardware-acceleration`, cache flags). Use it to size the Coolify worker.
- `browser ensure`: `--browser-executable`, `--log`, `--chrome-mode`.
- `gpu`: `--log`, `--gl`, `--chrome-mode`. Output is for humans, not parsing.
- `add`: `--package-manager`; extra arguments go to the package manager.
- `upgrade`: `--package-manager`, `--version`, `--skip-skills` (4.0.503); also updates Agent Skills in `.agents/skills`.

## `create-video`

`npx create-video` runs an interactive scaffold. Non-interactive (since 4.0.439): `npx create-video --yes --blank my-video`. Needs a template flag and a directory argument; `--no-tailwind` skips Tailwind; `--tmp` uses a temp directory; `-h` / `--help`. With `--yes` agent skills are not installed, the editor does not open, and the command fails if you are inside a git repository. Install skills later with `npx skills add remotion-dev/skills`. JAL uses `bun create video` (see the Bun notes above).

## Related

- config.md holds the same options as `remotion.config.ts` setters; a CLI flag always wins over the config file.
- renderer-api.md has the Node/Bun equivalents.
