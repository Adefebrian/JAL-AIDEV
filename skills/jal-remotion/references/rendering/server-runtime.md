# Server runtime for Remotion: Docker, Chrome, Linux, GPU, edge, formats

Written against `remotion` 4.0.532 (docs read 2026-10-01).

From:
- https://www.remotion.dev/docs/docker
- https://www.remotion.dev/docs/miscellaneous/changing-temp-dir
- https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell
- https://www.remotion.dev/docs/miscellaneous/cloud-gpu
- https://www.remotion.dev/docs/miscellaneous/cloud-gpu-docker
- https://www.remotion.dev/docs/miscellaneous/cross-origin-isolation
- https://www.remotion.dev/docs/miscellaneous/emojis
- https://www.remotion.dev/docs/miscellaneous/ffmpeg-license
- https://www.remotion.dev/docs/miscellaneous/linux-dependencies
- https://www.remotion.dev/docs/miscellaneous/linux-single-process
- https://www.remotion.dev/docs/miscellaneous/nextjs
- https://www.remotion.dev/docs/miscellaneous/render-on-edge
- https://www.remotion.dev/docs/miscellaneous/video-formats

## What it is

Everything that surrounds a server-side render: the container recipe, which Chrome Remotion runs, the Linux libraries it needs, memory and temp-disk behavior, why a GPU rarely helps, why edge runtimes cannot render, fonts and emoji on Linux, cross-origin isolation, the FFmpeg license, and which video formats work where. Applies to the local CLI fallback and the Coolify render service in render-paths.md. It does not apply to the in-browser default.

## When a JAL agent uses it

When building or debugging the Coolify render service image, a CI render, or a Linux machine that fails with "Failed to launch the browser process".

## Docker

### The recipe in Remotion's docs (Debian, Node)

1. Base image `node:22-bookworm-slim` (changed from Node 20 in Nov 2024 for LTS and a smaller image).
2. `apt-get update`, then install the Chrome shared libraries: `libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2`.
3. Copy `package.json`, lockfiles (the docs list `bun.lockb` and `bun.lock`), `tsconfig.json`, `remotion.config.*`, `src`, `public`.
4. Install dependencies. npm: `npm i`. Yarn or pnpm need `corepack enable` and a `packageManager` field.
5. `RUN npx remotion browser ensure` (installs Chrome Headless Shell into the image).
6. Copy the render script and run it (`CMD ["node", "render.mjs"]`).

The example script bundles, calls `selectComposition()`, then `renderMedia()` with `chromiumOptions: {enableMultiProcessOnLinux: true}` and writes `out/<id>.mp4`.

### Rules

- Do not use Alpine. Chrome Headless Shell needs libc symbols Alpine lacks, the Rust parts can be more than 10 seconds slower per render, and old Chrome versions disappear from the Alpine registry so downgrades are impossible.
- Do not pin apt package versions. Debian and Alpine delete old versions, so pins break the build later.
- Docker does not give a container all CPUs and memory by default. Set `--cpus` and `--cpuset-cpus` (Docker), or the CPU and memory limits in Coolify.
- Emoji: no color emoji font is installed. Add `fonts-noto-color-emoji`. CJK text needs `fonts-noto-cjk`.
- Remotion below 4.0 needed `ffmpeg` and `chromium` from apt and `PUPPETEER_EXECUTABLE_PATH`; ignore on current versions.
- The Studio can run in the same kind of image (see studio.md#deploy).

### JAL sketch for the Coolify render worker (untested, verify tags)

```dockerfile
FROM oven/bun:1-debian
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev \
  libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
  fonts-noto-color-emoji && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock* tsconfig.json remotion.config.* ./
RUN bun install --frozen-lockfile
COPY src ./src
COPY public ./public
RUN bunx remotionb browser ensure
ENV TMPDIR=/render-tmp
COPY worker.ts ./worker.ts
CMD ["bun", "worker.ts"]
```

Mount a volume at `/render-tmp`. Run each render as a child process from `worker.ts` and exit it on completion because Bun SSR scripts may not quit by themselves.

## Chrome Headless Shell

- Remotion downloads Chrome Headless Shell into `node_modules/.remotion/chrome-headless-shell/<platform>/` on first render. Platforms: `mac-arm64`, `mac-x64`, `linux64`, `linux-arm64`, `win64`. Linux x64 needs the shared libraries; Linux arm64 is supported for Headless Shell only.
- Ensure it before the first request: `bunx remotionb browser ensure`, or `ensureBrowser()` in code. A `VERSION` file in the folder (since 4.0.415) tracks the installed version; a mismatch makes Remotion delete and re-download.
- Two modes (since 4.0.248): `headless-shell` (default, faster for CPU-bound rendering, fewer dependencies) and `chrome-for-testing` (emulates a display, faster for GPU-bound rendering, more dependencies). Use Chrome for Testing only for a GPU setup on Linux. Switch with `--chrome-mode`, `chromeMode`, `Config.setChromeMode()`, or the Studio Advanced tab. Not supported on Lambda or Cloud Run.
- Bring your own browser only if the platform is unsupported: `--browser-executable`, `browserExecutable`, `setBrowserExecutable()`. Full desktop Chrome renders less deterministically; Remotion advises against overriding the pinned shell.
- Best practice: use Remotion 4.0.208 or later (it no longer picks up a system Chrome), run `browser ensure`, do not install Chrome by apt, do not override the executable.
- Why it exists: Chrome 123 split headless into `--headless=old` (screenshots, what Remotion needs) and `--headless=new`; the old mode is leaving desktop Chrome and lives on as Headless Shell.

## Linux dependencies

| System | Install |
| --- | --- |
| Ubuntu 24.04 and 22.04 | `libnss3 libdbus-1-3 libatk1.0-0 libasound2t64 libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libgbm-dev libcups2 libcairo2 libpango-1.0-0 libatk-bridge2.0-0` |
| Older Ubuntu | same, with `libasound2` |
| Debian | same list as in the Docker recipe above |
| Amazon Linux 2023 | `yum install -y mesa-libgbm libX11 libXrandr libdrm libXdamage libXfixes libxkbcommon dbus-libs libXcomposite alsa-lib nss dbus pango cups-libs at-spi2-core atk at-spi2-atk` |
| Alpine | Not supported (libc symbols) |
| nixOS | Not supported (Remotion ships its own Chrome and FFmpeg binaries, conflicting with an immutable distro) |

## Multi-process Chrome on Linux

Remotion used to start Chromium with `--single-process` on Linux, which hurts high-core machines. Since 4.0.137 multi-process is the default and the setting `enableMultiProcessOnLinux` defaults to true (`chromiumOptions`, `--enable-multiprocess-on-linux`, `Config.setChromiumMultiProcessOnLinux()`, Studio Advanced toggle). Cloud Run turns it on automatically. Lambda keeps it off because Chrome on Amazon Linux crashes without `--single-process`; use more Lambdas instead of more concurrency per Lambda. The recommended Docker image is confirmed to work with it on.

## Temp directory

Renders write frames, uncompressed audio and other artifacts to the OS temp dir (Node `os.tmpdir()`). Change it with `TMPDIR` (Linux, macOS) or `TEMP` (Windows), for example `TMPDIR=/var/tmp bunx remotionb render`. Remotion makes its own subfolder.

## GPU in the cloud

Most renders do not get faster on a GPU. For content that does (heavy WebGL, shaders, large canvas), Remotion's guide uses an AWS EC2 `g4dn.xlarge` (about $375 a month in the default setup) with Ubuntu 22.04, NVIDIA driver 535, Node 20, Remotion 4.0.248 or later, and renders with `--chrome-mode="chrome-for-testing" --gl=vulkan`. Check with `remotion gpu`. EC2 needs a service quota increase for G and VT instances. The Docker-with-GPU variant (NVIDIA Container Toolkit) is marked outdated and no longer works, so follow the bare-instance guide. Lambda and Vercel Sandbox have no GPU, GPU on Cloud Run is untested. For JAL this is out of scope unless Brian asks.

## Edge runtimes and Next.js

- Edge functions cannot render: no `fs`, execution limits of 30 seconds (Vercel) or 10 ms CPU (Cloudflare Workers), code size limits of 4 MB and 5 MB against about 150 MB for Chrome plus FFmpeg, and 128 MB of RAM against the 2 GB or more that Remotion wants.
- `@remotion/renderer` in Next.js: officially use Lambda or Vercel Sandbox. Self-hosting is possible but unsupported: add `serverExternalPackages: ['@remotion/renderer']` to the Next config, never run `@remotion/bundler` inside an API route (it contains Webpack), bundle outside the route and use the folder, and make sure the compositor binary from `node_modules` is included in the route build.

## Emojis and fonts

Emojis come from the OS, so they differ between macOS, Windows and Linux. On Debian or Ubuntu install `fonts-noto-color-emoji`; on Amazon Linux 2023 install `google-noto-emoji-color-fonts`. Lambda ships Noto Color Emoji and can enable Apple Emoji through `runtimePreference` (Apple's IP, your responsibility). Some emojis are missing on Lambda because the layer is limited to 250 MB shared with Chrome. See lambda-ops.md#runtime-layers-fonts-and-emoji.

## Cross-origin isolation

Needed for `SharedArrayBuffer` features (for example `@remotion/whisper-web`) and a faster ProRes decode in `@mediabunny/prores`. Send `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin`. Use `require-corp` instead when cross-origin resources need credentials or when Safari must be supported (Safari lacks `credentialless`). Cross-origin `<video>`, `<audio>`, `<img>` need `crossorigin="anonymous"` and CORS on the asset; this affects `<Html5Video>`, `<Html5Audio>`, `<OffthreadVideo>`, `<Img>`. In the Studio use `--cross-site-isolation` or `Config.setEnableCrossSiteIsolation()`.

## FFmpeg license

Remotion distributes a compiled FFmpeg under GPLv2+ (x264 and x265 are GPL, so it cannot be LGPL). It uses the `fdk-aac-free` variant with no licensing concern. Source and build scripts are public. A copyright license is not a patent license: H.264, HEVC and AAC may need separate patent licenses depending on use and country. That is on the product owner, not covered by the Remotion license.

## Video formats

- Server output: H.264 (MP4), H.265, VP8 and VP9 (WebM), AV1 (not on Lambda or Linux ARM64 GNU), ProRes, GIF.
- Client output (`renderMediaOnWeb()`): MP4, WebM, MKV, MOV video; WAV, MP3, AAC, OGG, FLAC audio; codecs H.264, H.265, VP8, VP9, AV1 depending on the browser. Check with `canRenderMediaOnWeb()`.
- Input: `<Video>` from `@remotion/media` uses WebCodecs and Mediabunny; `<Html5Video>` inherits browser support (during render that means Chrome Headless Shell); `<OffthreadVideo>` can read more codecs because FFmpeg decodes them.

## Related

- render-paths.md, renderer-api.md, troubleshooting.md.
