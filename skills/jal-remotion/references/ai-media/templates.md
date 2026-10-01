# Official Remotion templates and how JAL starts from them

From:
- https://www.remotion.dev/templates/
- https://www.remotion.dev/templates/blank
- https://www.remotion.dev/templates/hello-world
- https://www.remotion.dev/templates/next
- https://www.remotion.dev/templates/vercel
- https://www.remotion.dev/templates/recorder
- https://www.remotion.dev/templates/prompt-to-motion-graphics
- https://www.remotion.dev/templates/render-server
- https://www.remotion.dev/templates/electron
- https://www.remotion.dev/templates/react-router
- https://www.remotion.dev/templates/three
- https://www.remotion.dev/templates/still
- https://www.remotion.dev/templates/audiogram
- https://www.remotion.dev/templates/music-visualization
- https://www.remotion.dev/templates/prompt-to-video
- https://www.remotion.dev/templates/skia
- https://www.remotion.dev/templates/overlay
- https://www.remotion.dev/templates/code-hike
- https://www.remotion.dev/templates/stargazer
- https://www.remotion.dev/templates/tiktok
- https://www.remotion.dev/templates/editor-starter (the page renders empty; facts from the blog post https://www.remotion.dev/blog/editor-starter and the templates index)
- https://www.remotion.dev/docs/ai/ai-saas-template
- https://www.remotion.dev/docs/ai/coding-agents

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01). The site lists "35 templates and examples" overall.

## How JAL starts a Remotion project

```
bun create video --<flag> my-video          # flag from the table; add --yes --no-tailwind for a non-interactive blank start
cd my-video && bun install                   # Bun only, commit bun.lock, delete any package-lock.json
bunx remotion skills add                     # official agent skills, see ai-authoring.md
bun run dev                                  # Studio
```

The docs show `npx create-video@latest --<flag>` and `pnpm create video --<flag>`; the Bun line is the same command through Bun and its flags are taken from the template pages. `--yes --blank --no-tailwind` is the exact combination the official coding-agent guide uses. If a flag misbehaves under Bun on first run, fall back to `bunx create-video@latest` with the same flags and tell Brian.

Rules that apply to every start:

1. **Bun only.** No `node`, `npx`, `npm`, `tsx`. Rewrite any template script that calls them.
2. **JAL forbids Next.js, Vite, webpack as app frameworks and Express as the server.** Templates built on them are *pattern sources*: read them, copy the idea, rebuild on Bun + Hono + React (`Bun.build()`). Remotion's own Studio/bundler is a separate tool and is allowed to bundle compositions where it fits (Brian, 2026-10-01).
3. **Pin all Remotion packages** to one exact version (no `^`).
4. **License:** free for individuals and companies of up to 3 people (JAL is 3). The plugin warns when a fourth person joins: a Company License is then required (see `showcase-patterns.md#license-and-pricing`). Paid templates are separate purchases.
5. **Paid services** a template wires in (OpenAI images, ElevenLabs, AWS Lambda, Vercel Sandbox and Blob) are optional and need Brian's confirmation; keys only in `.env`.
6. **Extra stack** (native builds, Electron, Skia, Cesium, Recorder's tooling) needs Brian's confirmation before it enters a client project.
7. **Default start is Blank**, then add packages one at a time (`bunx remotion add @remotion/captions`, and so on).

## Free templates

Tailwind column: pages that show "Supports Tailwind". JAL default is no Tailwind inside a video project (inline style with JAL tokens); add it only to share class-based components with the web app.

| Template | Flag | Tailwind | What it is for | JAL start and fit |
|---|---|---|---|---|
| Blank | `--blank` | yes | Empty canvas. Recommended if you know Remotion or will write code with AI | **Default for everything**, especially agent-written work. Fit: full |
| Hello World | `--hello-world` | yes | Small playground animation; TypeScript, Prettier, ESLint preconfigured | Learning and demos only. Fit: full, not for delivery |
| Next.js | `--next` | no | SaaS starter with Player and rendering on Remotion Lambda; the official pick for apps that generate videos | **Pattern only**: Next.js and Lambda are not JAL stack. Rebuild Player + props form + render queue on Hono + React. Fit: pattern |
| Next.js (Vercel Sandbox) | `--vercel` | no | On-demand renders in ephemeral Linux VMs (Vercel Sandbox), output to Vercel Blob | Pattern only; paid third-party infra. Fit: no |
| Recorder | `--recorder` | no | Video production tool: record webcam and screen, generate captions, add music, all in JavaScript | Study for a self-serve recording product; own tooling means stack confirmation. Fit: ask Brian |
| Prompt to Motion Graphics SaaS | `--prompt-to-motion-graphics` | no | Next.js template: chat describes an animation, an LLM writes Remotion code, it streams to the browser and compiles for live preview; setup uses `OPENAI_API_KEY` in `.env`; optional Lambda export. Contributed by ASchwad | Pattern for runtime generation in `ai-authoring.md` (Pattern B needs Brian's yes). Swap the model to gpt-4o-mini. Fit: pattern |
| Render Server (Express.js) | `--render-server` | no | HTTP server that starts, tracks and cancels renders | Pattern for a render-job API; port to Hono. The renderer it uses is headless Chrome by default, so apply the JAL rendering rule. Fit: pattern |
| Electron | `--electron` | no | Electron Forge + Vite starter that renders from the Electron main process | **Do not use**: Vite and Electron are outside the stack. Fit: no |
| React Router 7 | `--react-router` | no | SaaS starter with Player and Lambda, on React Router 7 | Pattern only (SSR framework, Lambda). Fit: pattern |
| 3D (React Three Fiber) | `--three` | no | A React Three Fiber scene to play with, via `@remotion/three` | Start for 3D video renders; ties into the jal-immersive R3F stack and Poly Haven CC0 assets. Fit: full |
| Stills | `--still` | no | Dynamic PNG/JPEG images with a built-in HTTP server deployable to Heroku | Idea for OG/social cards: render stills per page, serve from Hono, wire to the SEO work (`og:image`). Fit: pattern |
| Audiogram | `--audiogram` | yes | Text + waveform visualisation that turns podcast snippets into social videos | Start for podcast/voice clips; add captions via `captions.md`. Fit: full |
| Music Visualization | `--music-visualization` | yes | Text + waveform visualisation for music snippets for social media (the index card repeats the Audiogram wording) | Start for music/audio-reactive pieces; see `audio.md#visualize`. Fit: full |
| Prompt to Video | `--prompt-to-video` | yes | Turns a prompt into a short video: script, images and voice-over, using OpenAI and ElevenLabs. Contributed by webmonch | Pattern; needs OpenAI image generation and ElevenLabs, both paid and optional (Brian). A gpt-4o-mini script + own assets + recorded voice is the free variant. Fit: pattern |
| Skia | `--skia` | no | React Native Skia already set up | Extra rendering stack; ask Brian. Fit: ask |
| Overlay | `--overlay` | yes | Overlays (transparent output) to use in conventional video editing software | Start when the deliverable is an overlay for an editor (alpha WebM/ProRes). Fit: full |
| Code Hike | `--code-hike` | no | Animate between code snippets with Code Hike: many languages, TypeScript error annotations, many themes | Start for developer-tutorial and docs videos (fits the JAL docs portal). Adds the Code Hike library. Fit: full |
| Stargazer | `--stargazer` | yes | Celebrate a repo's stars milestone with a video of stargazers. Contributed by pomber | Optional marketing for public repos; reads GitHub data, so check network access and tokens. Fit: full |
| TikTok | `--tiktok` | yes | Captions a video you choose, locally, with animated word-by-word captions; installs Whisper.cpp automatically; style customisable | Start for caption-first short video. It installs a native whisper.cpp build: Brian once per project; for GPU machines swap in whisper-webgpu (`whisper.md`). Fit: full with confirmation |

Count check: 19 rows. Preview links per page: Blank, Hello World, Code Hike, Stills, Audiogram, 3D have a Studio preview; Next.js and Vercel have live demos; most offer StackBlitz and Browser Studio try-online links (not needed by agents).

## Paid templates

| Template | What it is | JAL |
|---|---|---|
| Editor Starter | Boilerplate for building your own video editor; pieces include state management, tracks/items/assets, undo and redo, copy and paste, cropping, fonts, asset upload and cleanup, persistence, captioning (docs list from the launch post, 2025-08-21). Included in the Enterprise License | Do not buy without Brian. Free path: compose editor features from the Player + captions + Studio patterns |
| Watercolor Map | A 2D map for travel videos | Do not buy without Brian. Free path: `/remotion-maps` skill with MapLibre |
| Timeline | A copy-and-paste timeline-editing component | Do not buy without Brian |

## Choosing a start (decision list)

1. Plain motion graphics, explainer, promo: Blank.
2. Spoken content: Blank or TikTok/Audiogram, then captions.
3. Audio-reactive: Music Visualization.
4. Code walkthrough: Code Hike.
5. 3D: Three.
6. Overlay for an editor: Overlay.
7. Dynamic images (OG cards): Stills pattern on Hono.
8. A product where end users create videos: read Next.js, React Router, Render Server and Prompt to Motion Graphics as patterns, then build the app on JAL stack (Player in React, render job queue in Hono, Postgres/Redis/S3 as per jal-standards).
9. Prompt-to-video: scene-spec pattern first (`ai-authoring.md`), paid services only after Brian.
