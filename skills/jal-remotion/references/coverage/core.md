# Coverage ledger: core slice

Every URL listed in the core slice list (fundamentals, compositions, sequences, timing, interpolate, spring, easing, hooks, props and schemas, assets, fonts, data fetching, delayRender, the remotion package API, and the rest of that list), one row per URL, in list order. Docs read 2026-10-01 (Remotion 4.0.532). Locations are relative to `skills/jal-remotion/references/`.

Status values: integrated (API surface captured in a topic file), summarised (condensed, key facts only), not-applicable plus reason (no API content, removed or archived page).

Official agent skills repo and templates: see [core/official-skills.md](../core/official-skills.md) (licence decision: not redistributable, distilled in own words, nothing vendored).

Totals: 208 rows; 161 integrated, 36 summarised, 11 not-applicable.

| URL | What it covers | Where it lives in JAL | Status |
| --- | --- | --- | --- |
| https://www.remotion.dev/docs/ | Create a project: ChatGPT, agent prompt, CLI, wizard, templates, ESLint, system requirements | core/fundamentals.md#Create a project (Bun) | integrated |
| https://www.remotion.dev/docs/2-0-migration | Breaking changes in 2.0 | core/migrations-and-troubleshooting.md#Older migrations (only needed for old tutorials) | summarised |
| https://www.remotion.dev/docs/3-0-migration | Breaking changes in 3.0 | core/migrations-and-troubleshooting.md#Older migrations (only needed for old tutorials) | summarised |
| https://www.remotion.dev/docs/4-0-alpha | Archived 4.0 alpha notice | core/migrations-and-troubleshooting.md#Older migrations (only needed for old tutorials) | not-applicable: archived page, superseded by the 4.0 migration |
| https://www.remotion.dev/docs/4-0-migration | Breaking changes 3 to 4 (config, image format, FFmpeg, props rules) | core/migrations-and-troubleshooting.md#Older migrations (only needed for old tutorials) | summarised |
| https://www.remotion.dev/docs/5-0-migration | Planned 5.0 breaking changes, license changes | core/migrations-and-troubleshooting.md#Remotion 5.0 planned changes (make code 5.0-safe now) | integrated |
| https://www.remotion.dev/docs/absolute-fill | AbsoluteFill styles, timing inheritance, Tailwind detection | core/compositions.md#`<AbsoluteFill>` and layers | integrated |
| https://www.remotion.dev/docs/acknowledgements | Third-party software credits and licences | core/license-and-policy.md#Other pages in this slice | summarised |
| https://www.remotion.dev/docs/after-effects | Import After Effects via Bodymovin and Lottie | core/visuals-and-3d.md#Imported animation | integrated |
| https://www.remotion.dev/docs/angular | Angular integration with a React wrapper component | core/integrations.md#Frameworks | integrated |
| https://www.remotion.dev/docs/animatedimage | <AnimatedImage> props | core/assets-and-fonts.md#`<AnimatedImage>` (4.0.246+) | integrated |
| https://www.remotion.dev/docs/animating-properties | Animate with useCurrentFrame, interpolate, spring | core/timing-and-animation.md#Minimal Bun-ready example (React 19) | integrated |
| https://www.remotion.dev/docs/animation-math | Combine springs by arithmetic (enter minus exit) | core/timing-and-animation.md#spring() | integrated |
| https://www.remotion.dev/docs/api | API overview table of contents (no prose) | core/api-remotion.md#`remotion` exports | not-applicable: table-of-contents page rendered by the site, replaced by api-remotion.md |
| https://www.remotion.dev/docs/artifact | <Artifact> props and Artifact.Thumbnail | core/data-and-delayrender.md#Artifacts (extra output files, 4.0.176+) | integrated |
| https://www.remotion.dev/docs/artifacts | Emitting and receiving artifacts per renderer | core/data-and-delayrender.md#Artifacts (extra output files, 4.0.176+) | integrated |
| https://www.remotion.dev/docs/ask-in-public | Policy: ask support questions in public | core/license-and-policy.md#Support and community | summarised |
| https://www.remotion.dev/docs/assets | Importing assets: public/, staticFile, images, video, audio, CSS, import caveats | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/audio-buffer-to-data-url | audioBufferToDataUrl() | core/media.md#Audio | integrated |
| https://www.remotion.dev/docs/authoring-packages | Authoring a Remotion library, peer dependency, publishing | core/integrations.md#Bundler tweaks | summarised |
| https://www.remotion.dev/docs/azure-container-apps | Community guide: render server on Azure Container Apps | core/rendering-and-output.md#Ways to render (summary) | summarised |
| https://www.remotion.dev/docs/brownfield | Install Remotion in an existing project | core/integrations.md#Existing project install (brownfield) | integrated |
| https://www.remotion.dev/docs/building-a-timeline | Build a timeline editor around the Player | core/compositions.md#Timeline-based editors | summarised |
| https://www.remotion.dev/docs/bun | Bun support, remotionb, known issues | core/fundamentals.md#Create a project (Bun) | integrated |
| https://www.remotion.dev/docs/bundle | bundle() options | core/rendering-and-output.md#Server API pattern (Bun, only after Brian says yes) | integrated |
| https://www.remotion.dev/docs/bundlers | Webpack and Rspack, overrides, snippets | core/rendering-and-output.md#Bundlers | integrated |
| https://www.remotion.dev/docs/buy-a-video-editor | Commercial editor templates and timeline component | core/license-and-policy.md#Other pages in this slice | not-applicable: commercial product listing, no API |
| https://www.remotion.dev/docs/calculate-metadata | calculateMetadata() arguments and return fields | core/props-and-schemas.md#calculateMetadata() (4.0.0+) | integrated |
| https://www.remotion.dev/docs/cancel-render | cancelRender() | core/data-and-delayrender.md#useDelayRender (preferred) and the global functions | integrated |
| https://www.remotion.dev/docs/canvas-capture/ | Canvas Capture webpage recorder overview | core/visuals-and-3d.md#Remotion Canvas Capture | summarised |
| https://www.remotion.dev/docs/canvas-capture/installation | Canvas Capture extension install steps | core/visuals-and-3d.md#Remotion Canvas Capture | summarised |
| https://www.remotion.dev/docs/canvasimage | <CanvasImage> props | core/assets-and-fonts.md#`<CanvasImage>` (4.0.466+) | integrated |
| https://www.remotion.dev/docs/chromium-flags | Chromium flags: web security, certificates, headless, gl, user agent, dark mode | core/rendering-and-output.md#Hardware acceleration and GPU | integrated |
| https://www.remotion.dev/docs/clipper | Experimental.Clipper removed in 4.0.228 | core/api-remotion.md#`remotion` exports | not-applicable: removed experimental API, noted in api-remotion.md |
| https://www.remotion.dev/docs/cloudflare-containers | Cloudflare Containers demo for rendering (not production ready) | core/rendering-and-output.md#Ways to render (summary) | summarised |
| https://www.remotion.dev/docs/color-correction | colorCorrection() and lut() effects | core/media.md#Effects on media: greenscreen and colour | integrated |
| https://www.remotion.dev/docs/compare-ssr | Comparison of Lambda, Vercel Sandbox, Cloud Run, Node/Bun APIs | core/rendering-and-output.md#Ways to render (summary) | integrated |
| https://www.remotion.dev/docs/composition | <Composition> props, lazyComponent, defaultProps, folders | core/compositions.md#`<Composition>` props | integrated |
| https://www.remotion.dev/docs/continue-render | continueRender() compatibility | core/data-and-delayrender.md#useDelayRender (preferred) and the global functions | integrated |
| https://www.remotion.dev/docs/cors-issues | Debugging CORS errors | core/migrations-and-troubleshooting.md#Error guide | integrated |
| https://www.remotion.dev/docs/create-effect | createEffect() API | core/visuals-and-3d.md#`createEffect()` (4.0.479+) | integrated |
| https://www.remotion.dev/docs/data-fetching | Fetch before render with calculateMetadata, during render with delayRender | core/data-and-delayrender.md#calculateMetadata data fetching | integrated |
| https://www.remotion.dev/docs/dataset-render | Batch render videos from a dataset | core/props-and-schemas.md#Batch / dataset renders (Chrome-based, Brian confirms) | integrated |
| https://www.remotion.dev/docs/default-props-inference | Studio controls inferred from defaultProps | core/props-and-schemas.md#defaultProps rules | integrated |
| https://www.remotion.dev/docs/delay-render | delayRender(), timeouts, retries, labels | core/data-and-delayrender.md#useDelayRender (preferred) and the global functions | integrated |
| https://www.remotion.dev/docs/deno | Deno is unsupported, remotiond | core/fundamentals.md#Create a project (Bun) | integrated |
| https://www.remotion.dev/docs/design-systems | Motion design systems with Remotion | core/license-and-policy.md#Other pages in this slice | summarised |
| https://www.remotion.dev/docs/detect-remotion | Detect a Remotion-made video (metadata, DevTools) | core/data-and-delayrender.md#Environment | integrated |
| https://www.remotion.dev/docs/distributed-rendering | Blueprint for a custom distributed renderer | core/rendering-and-output.md#Ways to render (summary) | summarised |
| https://www.remotion.dev/docs/dpa | DPA transparency statement for the licensing platform | core/license-and-policy.md#Privacy and data protection (summary) | summarised |
| https://www.remotion.dev/docs/dpia | DPIA transparency statement for licensing telemetry | core/license-and-policy.md#Privacy and data protection (summary) | summarised |
| https://www.remotion.dev/docs/dynamic-metadata | Variable duration, fps, dimensions from data | core/props-and-schemas.md#calculateMetadata() (4.0.0+) | integrated |
| https://www.remotion.dev/docs/easing | Easing module | core/timing-and-animation.md#Easing | integrated |
| https://www.remotion.dev/docs/electron | Electron: main-process render, binaries, browser packaging | core/integrations.md#Frameworks | integrated |
| https://www.remotion.dev/docs/enable-scss/enable-scss | enableScss() function | core/integrations.md#Bundler tweaks | integrated |
| https://www.remotion.dev/docs/enable-scss/overview | @remotion/enable-scss install and usage | core/integrations.md#Bundler tweaks | integrated |
| https://www.remotion.dev/docs/enametoolong | ENAMETOOLONG on Windows with many audio layers | core/migrations-and-troubleshooting.md#Error guide | integrated |
| https://www.remotion.dev/docs/encoding | Codecs, CRF, bitrate, audio codecs, extensions | core/rendering-and-output.md#Codecs, quality and audio | integrated |
| https://www.remotion.dev/docs/env-variables | Environment variables and .env | core/props-and-schemas.md#getInputProps() and env variables | integrated |
| https://www.remotion.dev/docs/eslint-config | @remotion/eslint-config and flat config | core/fundamentals.md#Project shape | summarised |
| https://www.remotion.dev/docs/eslint-plugin | @remotion/eslint-plugin | core/integrations.md#Existing project install (brownfield) | summarised |
| https://www.remotion.dev/docs/export-opentimeline | Export to OpenTimelineIO with an agent skill | core/visuals-and-3d.md#GSAP and OpenTimelineIO | summarised |
| https://www.remotion.dev/docs/ffmpeg | Installing FFmpeg (bundled since 4.0) | core/migrations-and-troubleshooting.md#Older migrations (only needed for old tutorials) | not-applicable: archival v3 install page, FFmpeg is bundled since 4.0 |
| https://www.remotion.dev/docs/figma | Import from Figma | core/visuals-and-3d.md#Imported animation | integrated |
| https://www.remotion.dev/docs/flickering | Flicker causes: multithreading, assets not awaited | core/timing-and-animation.md#Flicker rules (what breaks a render) | integrated |
| https://www.remotion.dev/docs/folder | <Folder> | core/compositions.md#Entry and root | integrated |
| https://www.remotion.dev/docs/font-picker | Google Fonts picker with getAvailableFonts | core/assets-and-fonts.md#@remotion/google-fonts | summarised |
| https://www.remotion.dev/docs/fonts-api/ | @remotion/fonts package overview | core/assets-and-fonts.md#@remotion/fonts: loadFont (4.0.165+) | integrated |
| https://www.remotion.dev/docs/fonts-api/load-font | loadFont() options | core/assets-and-fonts.md#@remotion/fonts: loadFont (4.0.165+) | integrated |
| https://www.remotion.dev/docs/freeze | <Freeze> | core/compositions.md#`<Freeze>` | integrated |
| https://www.remotion.dev/docs/get-audio-data | getAudioData() | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | integrated |
| https://www.remotion.dev/docs/get-audio-duration-in-seconds | getAudioDurationInSeconds() (deprecated) | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | summarised |
| https://www.remotion.dev/docs/get-help | How to get help | core/license-and-policy.md#Support and community | summarised |
| https://www.remotion.dev/docs/get-image-dimensions | getImageDimensions() | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | integrated |
| https://www.remotion.dev/docs/get-input-props | getInputProps() | core/props-and-schemas.md#getInputProps() and env variables | integrated |
| https://www.remotion.dev/docs/get-remotion-environment | getRemotionEnvironment() | core/data-and-delayrender.md#Environment | integrated |
| https://www.remotion.dev/docs/get-video-metadata | getVideoMetadata() (deprecated) | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | summarised |
| https://www.remotion.dev/docs/get-waveform-portion | getWaveformPortion() | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | integrated |
| https://www.remotion.dev/docs/getstaticfiles | getStaticFiles() | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/gl-options | --gl renderer backends | core/rendering-and-output.md#Hardware acceleration and GPU | integrated |
| https://www.remotion.dev/docs/gpu | Using the GPU | core/rendering-and-output.md#Hardware acceleration and GPU | integrated |
| https://www.remotion.dev/docs/greenscreen | colorKey() greenscreen | core/media.md#Effects on media: greenscreen and colour | integrated |
| https://www.remotion.dev/docs/gsap | @remotion/gsap package | core/timing-and-animation.md#@remotion/gsap | integrated |
| https://www.remotion.dev/docs/gsap/use-gsap-timeline | useGsapTimeline() and builder rules | core/timing-and-animation.md#@remotion/gsap | integrated |
| https://www.remotion.dev/docs/hardware-acceleration | Hardware accelerated encoding | core/rendering-and-output.md#Hardware acceleration and GPU | integrated |
| https://www.remotion.dev/docs/hdr | HDR is not supported, tone mapping | core/media.md#HDR | integrated |
| https://www.remotion.dev/docs/hls | HLS support in <Video> | core/media.md#Which tag (decision table) | integrated |
| https://www.remotion.dev/docs/html-in-canvas | HTML-in-canvas overview, flag, rendering | core/visuals-and-3d.md#HTML-in-canvas (4.0.455+) | integrated |
| https://www.remotion.dev/docs/html5-audio | <Html5Audio> props | core/media.md#Common props (Html5Video / Html5Audio / OffthreadVideo) | integrated |
| https://www.remotion.dev/docs/html5-video | <Html5Video> props | core/media.md#Common props (Html5Video / Html5Audio / OffthreadVideo) | integrated |
| https://www.remotion.dev/docs/iframe | <IFrame> | core/assets-and-fonts.md#`<IFrame>` | integrated |
| https://www.remotion.dev/docs/img | <Img> props, effects, retries | core/assets-and-fonts.md#`<Img>` | integrated |
| https://www.remotion.dev/docs/interactive | Interactive elements and schema fragments | core/props-and-schemas.md#Interactive and visual editing (4.0.475+) | integrated |
| https://www.remotion.dev/docs/interactive-with-schema | Interactive.withSchema() | core/props-and-schemas.md#Interactive and visual editing (4.0.475+) | integrated |
| https://www.remotion.dev/docs/interactivity-schema | InteractivitySchema field types | core/props-and-schemas.md#Interactive and visual editing (4.0.475+) | integrated |
| https://www.remotion.dev/docs/interpolate | interpolate() options and value types | core/timing-and-animation.md#interpolate() | integrated |
| https://www.remotion.dev/docs/interpolate-colors | interpolateColors() | core/timing-and-animation.md#interpolateColors() | integrated |
| https://www.remotion.dev/docs/investors | Company funding summary for investors | core/license-and-policy.md#Other pages in this slice | not-applicable: company information, no API |
| https://www.remotion.dev/docs/javascript | Plain JavaScript opt-out | core/integrations.md#Bundler tweaks | summarised |
| https://www.remotion.dev/docs/layers | Layering with AbsoluteFill | core/compositions.md#`<AbsoluteFill>` and layers | integrated |
| https://www.remotion.dev/docs/legacy-babel | Legacy Babel transpilation | core/integrations.md#Bundler tweaks | summarised |
| https://www.remotion.dev/docs/legal | Legal documents table of contents (no prose) | core/license-and-policy.md#Other pages in this slice | not-applicable: table-of-contents page, targets are covered in license-and-policy.md |
| https://www.remotion.dev/docs/loop | <Loop>, useLoop() | core/compositions.md#`<Loop>` | integrated |
| https://www.remotion.dev/docs/lovable-for-motion-graphics | Position statement: Remotion is not building a consumer tool | core/license-and-policy.md#Other pages in this slice | not-applicable: company position, no API |
| https://www.remotion.dev/docs/mac-cursors | @remotion/mac-cursors package | core/visuals-and-3d.md#Noise, annotations, cursors | integrated |
| https://www.remotion.dev/docs/mac-cursors/mac-os-cursor | <MacOSCursor> | core/visuals-and-3d.md#Noise, annotations, cursors | integrated |
| https://www.remotion.dev/docs/maps | Map animations with MapLibre and Turf | core/visuals-and-3d.md#Maps | integrated |
| https://www.remotion.dev/docs/measure-spring | measureSpring() | core/timing-and-animation.md#spring() | integrated |
| https://www.remotion.dev/docs/measuring | Measuring DOM nodes with useCurrentScale | core/timing-and-animation.md#The hooks (the clock) | integrated |
| https://www.remotion.dev/docs/media-playback-error | Could not play video/audio errors | core/media.md#Common props (Html5Video / Html5Audio / OffthreadVideo) | integrated |
| https://www.remotion.dev/docs/metadata | Setting output file metadata | core/media.md#Metadata | integrated |
| https://www.remotion.dev/docs/multiple-fps | Support multiple frame rates | core/timing-and-animation.md#Multiple frame rates | integrated |
| https://www.remotion.dev/docs/noise-visualization | @remotion/noise dot grid | core/visuals-and-3d.md#Noise, annotations, cursors | integrated |
| https://www.remotion.dev/docs/non-seekable-media | Non-seekable media error | core/migrations-and-troubleshooting.md#Error guide | integrated |
| https://www.remotion.dev/docs/null | Experimental.Null removed in 4.0.228 | core/api-remotion.md#`remotion` exports | not-applicable: removed experimental API, noted in api-remotion.md |
| https://www.remotion.dev/docs/offthreadvideo | <OffthreadVideo> props | core/media.md#Common props (Html5Video / Html5Audio / OffthreadVideo) | integrated |
| https://www.remotion.dev/docs/overlay | Export overlays as transparent ProRes | core/media.md#Transparent output | integrated |
| https://www.remotion.dev/docs/parameterized-rendering | Parameterised videos overview | core/props-and-schemas.md#Resolution order (memorise) | integrated |
| https://www.remotion.dev/docs/passing-props | Passing props, default and input props | core/props-and-schemas.md#Resolution order (memorise) | integrated |
| https://www.remotion.dev/docs/performance | Render performance tips | core/rendering-and-output.md#Performance (render speed) | integrated |
| https://www.remotion.dev/docs/player-into-remotion-project | Turn a Player app into a Remotion project | core/integrations.md#Placement decision for JAL (JEV picks, defaults here) | integrated |
| https://www.remotion.dev/docs/posterization | Posterization of animation | core/timing-and-animation.md#interpolate() | integrated |
| https://www.remotion.dev/docs/prefetch | prefetch() | core/assets-and-fonts.md#Prefetch (Player only) | integrated |
| https://www.remotion.dev/docs/presigned-urls | Upload with a presigned URL | core/media.md#User uploads | summarised |
| https://www.remotion.dev/docs/preview | Preview with the Studio | core/fundamentals.md#Project shape | integrated |
| https://www.remotion.dev/docs/privacy | Privacy policy v5.0 | core/license-and-policy.md#Privacy and data protection (summary) | summarised |
| https://www.remotion.dev/docs/props-resolution | How props get resolved | core/props-and-schemas.md#Resolution order (memorise) | integrated |
| https://www.remotion.dev/docs/prores | Rendering ProRes and profiles | core/rendering-and-output.md#Codecs, quality and audio | integrated |
| https://www.remotion.dev/docs/quality | Quality guide: CRF, resolution, JPEG quality, colour | core/rendering-and-output.md#Codecs, quality and audio | integrated |
| https://www.remotion.dev/docs/random | random() | core/timing-and-animation.md#random() and determinism | integrated |
| https://www.remotion.dev/docs/react-18 | Upgrade to React 18 | core/fundamentals.md#React and versions | integrated |
| https://www.remotion.dev/docs/react-19 | React 19 support | core/fundamentals.md#React and versions | integrated |
| https://www.remotion.dev/docs/react-native | React Native is not planned | core/integrations.md#Frameworks | integrated |
| https://www.remotion.dev/docs/register-root | registerRoot() | core/compositions.md#Entry and root | integrated |
| https://www.remotion.dev/docs/remotion | remotion package page (table of contents) | core/api-remotion.md#`remotion` exports | integrated |
| https://www.remotion.dev/docs/remotion/html-in-canvas | <HtmlInCanvas> API | core/visuals-and-3d.md#HTML-in-canvas (4.0.455+) | integrated |
| https://www.remotion.dev/docs/render | Ways to render | core/rendering-and-output.md#Ways to render (summary) | integrated |
| https://www.remotion.dev/docs/render-all | Render all compositions | core/rendering-and-output.md#Server API pattern (Bun, only after Brian says yes) | integrated |
| https://www.remotion.dev/docs/render-as-gif | Render GIFs | core/rendering-and-output.md#Codecs, quality and audio | integrated |
| https://www.remotion.dev/docs/resources | Community resource catalogue | core/license-and-policy.md#Other pages in this slice | summarised |
| https://www.remotion.dev/docs/reusability | Reusable components with Sequence | core/compositions.md#Reuse and nesting | integrated |
| https://www.remotion.dev/docs/rive/ | @remotion/rive package overview | core/visuals-and-3d.md#Imported animation | integrated |
| https://www.remotion.dev/docs/rive/remotionrivecanvas | <RemotionRiveCanvas> | core/visuals-and-3d.md#Imported animation | integrated |
| https://www.remotion.dev/docs/sample-rate | Audio sample rate | core/media.md#Audio | integrated |
| https://www.remotion.dev/docs/scaling | Output scaling | core/rendering-and-output.md#Codecs, quality and audio | integrated |
| https://www.remotion.dev/docs/schemas | Zod schema for props | core/props-and-schemas.md#Zod schema (`schema` prop) | integrated |
| https://www.remotion.dev/docs/security | Security best practices | core/rendering-and-output.md#Security | integrated |
| https://www.remotion.dev/docs/sequence | <Sequence> props and timing | core/compositions.md#`<Sequence>` | integrated |
| https://www.remotion.dev/docs/series | <Series> | core/compositions.md#`<Series>` | integrated |
| https://www.remotion.dev/docs/shaders | Shaders via effects and HtmlInCanvas | core/visuals-and-3d.md#Effects and canvas components | integrated |
| https://www.remotion.dev/docs/slow-method-to-extract-frame | Slow frame extraction warning (pre-4.0) | core/migrations-and-troubleshooting.md#Error guide | not-applicable: only affects versions before 4.0 |
| https://www.remotion.dev/docs/solid | <Solid> | core/visuals-and-3d.md#`<Solid>` (4.0.464+) | integrated |
| https://www.remotion.dev/docs/spline | Import from Spline (flagged out of date) | core/visuals-and-3d.md#Three.js / R3F | summarised |
| https://www.remotion.dev/docs/spring | spring() | core/timing-and-animation.md#spring() | integrated |
| https://www.remotion.dev/docs/ssr-legacy | Server-side rendering in v1 and v2 | core/rendering-and-output.md#Server API pattern (Bun, only after Brian says yes) | not-applicable: archived v1/v2 flow, superseded by bundle and renderMedia (legacy note added) |
| https://www.remotion.dev/docs/standalone | Functions usable outside Remotion and their licences | core/license-and-policy.md#Licences of the packages | integrated |
| https://www.remotion.dev/docs/staticfile | staticFile() | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/staticfile-relative-paths | staticFile relative path error | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/staticfile-remote-urls | staticFile remote URL error | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/still | <Still> | core/compositions.md#`<Still>` and still images | integrated |
| https://www.remotion.dev/docs/stills | Still images: CLI, Node, browser, Lambda | core/compositions.md#`<Still>` and still images | integrated |
| https://www.remotion.dev/docs/studio-into-app | Convert a Studio project into an app | core/integrations.md#Placement decision for JAL (JEV picks, defaults here) | integrated |
| https://www.remotion.dev/docs/support | Support policy | core/license-and-policy.md#Support and community | integrated |
| https://www.remotion.dev/docs/svelte | Svelte integration | core/integrations.md#Frameworks | integrated |
| https://www.remotion.dev/docs/tailwind-legacy | TailwindCSS v2 legacy setup | core/integrations.md#Bundler tweaks | summarised |
| https://www.remotion.dev/docs/target-closed | Target closed error | core/migrations-and-troubleshooting.md#Error guide | integrated |
| https://www.remotion.dev/docs/telemetry | Telemetry and license key | core/license-and-policy.md#Telemetry (`@remotion/licensing`) | integrated |
| https://www.remotion.dev/docs/terms | Terms and conditions, licence tiers, pricing, restrictions | core/license-and-policy.md#Licence tiers | integrated |
| https://www.remotion.dev/docs/testing | Testing components with Bun and Happy DOM | core/compositions.md#Testing compositions | integrated |
| https://www.remotion.dev/docs/text-highlights | Text highlights with rough-notation | core/visuals-and-3d.md#Noise, annotations, cursors | summarised |
| https://www.remotion.dev/docs/the-fundamentals | Fundamentals: components, video properties, compositions | core/compositions.md#The video model | integrated |
| https://www.remotion.dev/docs/third-party | Third-party animation library status | core/timing-and-animation.md#Third-party animation libraries inside a comp | integrated |
| https://www.remotion.dev/docs/three-canvas | <ThreeCanvas> | core/visuals-and-3d.md#Three.js / R3F | integrated |
| https://www.remotion.dev/docs/three-webgpu-canvas | <ThreeWebGPUCanvas> | core/visuals-and-3d.md#Three.js / R3F | integrated |
| https://www.remotion.dev/docs/timeout | Debugging delayRender timeouts | core/data-and-delayrender.md#useDelayRender (preferred) and the global functions | integrated |
| https://www.remotion.dev/docs/timing | Timing props and order of operations | core/timing-and-animation.md#Timing props (the standard 5) | integrated |
| https://www.remotion.dev/docs/transforms | CSS transforms for animation, makeTransform | core/timing-and-animation.md#Transforms and CSS | integrated |
| https://www.remotion.dev/docs/transitioning | TransitionSeries, overlays, rules | core/compositions.md#Transitions (`@remotion/transitions`, 4.0.59+) | integrated |
| https://www.remotion.dev/docs/transparent-videos | Rendering transparent videos | core/media.md#Transparent output | integrated |
| https://www.remotion.dev/docs/typescript-aliases | TypeScript path aliases in the bundler | core/integrations.md#Bundler tweaks | integrated |
| https://www.remotion.dev/docs/upgrading | Upgrading Remotion | core/migrations-and-troubleshooting.md#Upgrade procedure | integrated |
| https://www.remotion.dev/docs/use-audio-data | useAudioData() | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | integrated |
| https://www.remotion.dev/docs/use-buffer-state | useBufferState() | core/data-and-delayrender.md#useBufferState (Player/Studio buffering) | integrated |
| https://www.remotion.dev/docs/use-current-frame | useCurrentFrame() | core/timing-and-animation.md#The hooks (the clock) | integrated |
| https://www.remotion.dev/docs/use-current-scale | useCurrentScale() | core/timing-and-animation.md#The hooks (the clock) | integrated |
| https://www.remotion.dev/docs/use-delay-render | useDelayRender() | core/data-and-delayrender.md#useDelayRender (preferred) and the global functions | integrated |
| https://www.remotion.dev/docs/use-img-and-iframe | Use Img, Video, Audio, IFrame instead of native tags | core/assets-and-fonts.md#Hard rule: use the Remotion tag, not the native one | integrated |
| https://www.remotion.dev/docs/use-offthread-video-texture | useOffthreadVideoTexture() (deprecated) | core/visuals-and-3d.md#Three.js / R3F | summarised |
| https://www.remotion.dev/docs/use-pixel-density | usePixelDensity() | core/timing-and-animation.md#The hooks (the clock) | integrated |
| https://www.remotion.dev/docs/use-remotion-environment | useRemotionEnvironment() | core/data-and-delayrender.md#Environment | integrated |
| https://www.remotion.dev/docs/use-video-config | useVideoConfig() | core/timing-and-animation.md#The hooks (the clock) | integrated |
| https://www.remotion.dev/docs/use-video-texture | useVideoTexture() (deprecated) | core/visuals-and-3d.md#Three.js / R3F | summarised |
| https://www.remotion.dev/docs/use-windowed-audio-data | useWindowedAudioData() | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | integrated |
| https://www.remotion.dev/docs/using-audio | Using audio table of contents | core/media.md#Audio | summarised |
| https://www.remotion.dev/docs/using-randomness | Why Math.random breaks renders | core/timing-and-animation.md#random() and determinism | integrated |
| https://www.remotion.dev/docs/validating-user-videos | Validate user videos with canDecode | core/media.md#User uploads | summarised |
| https://www.remotion.dev/docs/vercel-sandbox | Rendering with Vercel Sandbox | core/rendering-and-output.md#Ways to render (summary) | summarised |
| https://www.remotion.dev/docs/version | VERSION constant | core/data-and-delayrender.md#Environment | integrated |
| https://www.remotion.dev/docs/version-mismatch | Version mismatch and exact pins | core/migrations-and-troubleshooting.md#Error guide | integrated |
| https://www.remotion.dev/docs/video-tags | Comparison of video tags | core/media.md#Which tag (decision table) | integrated |
| https://www.remotion.dev/docs/video-uploads | Handling user video uploads in the Player | core/media.md#User uploads | summarised |
| https://www.remotion.dev/docs/visual-editing | Edit default props visually in the Studio | core/props-and-schemas.md#Interactive and visual editing (4.0.475+) | integrated |
| https://www.remotion.dev/docs/visualize-audio | visualizeAudio() | core/media.md#@remotion/media-utils (CORS needed for remote files except duration) | integrated |
| https://www.remotion.dev/docs/vue | Vue integration | core/integrations.md#Frameworks | integrated |
| https://www.remotion.dev/docs/watchstaticfile | watchStaticFile() | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/webgl | Using WebGL and WebGPU during renders | core/rendering-and-output.md#Hardware acceleration and GPU | integrated |
| https://www.remotion.dev/docs/webpack-dynamic-imports | Dynamic imports under Webpack | core/assets-and-fonts.md#staticFile and public/ | integrated |
| https://www.remotion.dev/docs/wrong-composition-mount | Composition mounted inside another composition | core/compositions.md#`<Composition>` props | integrated |
