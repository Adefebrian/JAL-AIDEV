# AI authoring (how JAL agents write Remotion, and how a JAL product lets an LLM write it)

From:
- https://www.remotion.dev/ai
- https://www.remotion.dev/docs/ai/
- https://www.remotion.dev/docs/ai/coding-agents
- https://www.remotion.dev/docs/ai/skills
- https://www.remotion.dev/docs/ai/plugins
- https://www.remotion.dev/docs/ai/claude-code-plugin
- https://www.remotion.dev/docs/ai/codex-plugin
- https://www.remotion.dev/docs/ai/cursor-plugin
- https://www.remotion.dev/docs/ai/github-copilot-plugin
- https://www.remotion.dev/docs/ai/kimi-code-plugin
- https://www.remotion.dev/docs/ai/mcp
- https://www.remotion.dev/docs/ai/webmcp
- https://www.remotion.dev/docs/ai/chatbot
- https://www.remotion.dev/docs/ai/bolt
- https://www.remotion.dev/docs/ai/generate
- https://www.remotion.dev/docs/ai/dynamic-compilation
- https://www.remotion.dev/docs/ai/ai-saas-template
- https://www.remotion.dev/system-prompt.txt (the "System Prompt" the docs link to; fetched 2026-10-01, 11 KB, not in the URL list but it is the canonical prompt text)

Remotion version this was written against: `remotion` 4.0.532 (docs read 2026-10-01).

## Two jobs

1. **Authoring.** A JAL agent (Claude Code, the session model) writes or edits a Remotion project. The official skills, the docs-as-markdown trick and the system-prompt rules below apply.
2. **Runtime generation.** A JAL product lets an end user type a prompt and an LLM produces a video. The model is **OpenAI gpt-4o-mini** (jal-standards "AI Default"). Any other model is reported to Brian before use. The Remotion docs examples use `gpt-5.2` and `gpt-5-mini`; replace both with `gpt-4o-mini`. Keys live in `.env` only, are read on the server only, and are never printed or sent to the browser.

## Job 1: authoring workflow

1. Scaffold: `bun create video --yes --blank --no-tailwind my-video` (the docs show the same flags with `npx create-video`; the Bun form uses the same flags, confirm on first run). Blank is the official recommendation for AI-written code. See `templates.md` for every other starting point.
2. `cd my-video && bun install`. Pin `remotion` and every `@remotion/*` to the same exact version, no `^`.
3. Official skills (ask first, decided 2026-10-01): `bunx remotion skills add` (docs form: `npx remotion skills add`; alternative `npx skills add remotion-dev/skills`) installs third-party instructions, so ask the user before running it; `bun create video` offers it at scaffold time, answer no unless the user said yes. JAL's own rules in `skills/jal-remotion` cover authoring without it.
4. Start Studio: `bun run dev`. Open it in a browser tab so the agent can see the result.
5. Write the brief first (see "Brief before prompt"), then prompt, then look at frames in Studio, then iterate. Code is always the source of truth; Studio edits save back to code.

### Official Agent Skills

| Skill | What it gives the agent | JAL use |
|---|---|---|
| `/remotion-best-practices` | Umbrella over all the others | Default when unsure which skill |
| `/remotion-create` | Create a new project or composition | Step 1 above |
| `/remotion-markup` | Compositions, animation, layout, typography, media, effects, audio, fonts, timing | Every composition edit |
| `/remotion-studio` | Launch Studio for preview | Verification loop |
| `/remotion-render` | Render a video or still | Rendering follows the JAL rule: no headless Chrome by default, prefer the web renderer (WebCodecs); see `../rendering/render-paths.md` and JEV `video.render_path` |
| `/remotion-maps` | Map animations: Mapbox, MapLibre, MapTiler, GeoJSON, CesiumJS flyovers | Geographic explainers. Mapbox/MapTiler/Cesium Ion need tokens (third-party, ask Brian); MapLibre with open tiles is the free path |
| `/remotion-captions` | Captions and subtitles | Pairs with `captions.md` and `whisper.md` |
| `/remotion-saas` | Architecture for Remotion-powered apps | Product integrations; stack must stay Bun + Hono + React (no Next.js) |
| `/remotion-interactivity` | Make Remotion code editable in Studio (selectable, keyframe-editable elements) | Use when elements are not selectable in Studio |
| `/remotion-docs` | Search docs, fetch any page as Markdown | Always before using an API from memory |
| `/remotion-upgrade` | Upgrade Remotion, related packages, compatible Mediabunny packages, installed skills | Version bumps |
| `/remotion-multimedia` | Browser multimedia with Mediabunny (metadata, etc.) | Media probing; replaces the deprecated Media Parser |

Precedence: for API facts of the installed version, the official skill and `/remotion-docs` win. For policy (Bun only, license, rendering path, paid services, gpt-4o-mini, no-emoji, JAL UI law on any web UI) the JAL references win. If they disagree on policy, follow JAL and tell Brian.

### Official plugins

Remotion maintains plugins for Claude Code, Codex (ChatGPT desktop), Cursor, GitHub Copilot CLI and Kimi Code. Each bundles the same skills. Claude Code form:

```
claude plugin marketplace add remotion-dev/claude-code-plugin
claude plugin install remotion@remotion
```

Then restart Claude Code and invoke `/remotion-best-practices`. JAL does not install this plugin on its own: it adds a third-party marketplace to the user's Claude Code and duplicates what step 3 already installs project-locally. Only install it if Brian says yes. Codex, Cursor, Copilot and Kimi plugins are for other agents and are not used by JAL.

### Docs for agents

- Add `.md` to any docs URL: `https://www.remotion.dev/docs/captions/displaying.md` (verified 2026-10-01, returns `text/markdown`).
- Or send `Accept: text/markdown` to the normal URL (verified the same day).
- The site prompt text is at `https://www.remotion.dev/system-prompt.txt`.
- Prefer these over scraping HTML. `/remotion-docs` does the same.

### Deprecated and not used

- **Hosted MCP** (`remotion-documentation`): deprecated, the hosted server shuts down no earlier than 2026-08-31, so assume it is gone. Do not install. Use `/remotion-docs` or the `.md` URLs.
- **Chatbot** (CrawlChat, "Ask AI" button, remotion.ai, Cmd/Ctrl+I in Studio): human-facing help. Agents do not call it.
- **Bolt.new template**: hosted third-party prompt tool. Not used.

### WebMCP

Studio exposes tools over WebMCP (a draft browser standard) so an agent in the browser can inspect and steer it. At doc time only ChatGPT Codex supports it, Claude Code does not, and tool inputs and outputs are marked unstable. JAL therefore drives Studio with ordinary browser tools instead (open the Studio tab, read the page, click). Inventory, for when a client supports it:

- Inspect: `get_current_error` (4.0.520, symbolicated stack), `get_compositions`, `select_composition`, `get_composition`, `get_sequences`, `select_sequence`, `get_selection`, `get_outlines` (geometry in composition pixels), `get_canvas_html` (rendered HTML at the current frame, capped at 100,000 characters, canvas/WebGL pixels not included), `get_playback_state`.
- Steer: `play`, `pause`, `seek_to_frame`, `set_playback_rate` (negative plays backward), `mute`, `unmute`, `set_timeline_zoom` (0 to 1), `get_guides`, `set_guides_visible`, `add_guide`, `remove_guide`.
- Project: `install_package` (4.0.523, exact versions only, uses Remotion's recommended version for auxiliaries such as `@huggingface/transformers`), `restart_studio` and `shut_down_studio` (4.0.521).
- Media jobs: `transcribe_asset` (4.0.523, default model `small.en`, output `<asset>-captions.json`, runs in the Jobs queue, installs `@remotion/whisper-webgpu` on request) and `remove_video_background` (4.0.523, default `ben2-base`, audio kept, quality `very-high`, output `<asset>-no-background.webm`). See `whisper.md` and `video-matting.md`.
- Tools that touch the timeline need a composition open. `install_package` changes dependencies: it counts as a stack change, so the "new dependency needs Brian" rule still applies.

## System prompt rules

Use these as the rule block when an agent or a runtime generator writes Remotion code (own words, checked against the prompt text):

- A project has an entry file that calls `registerRoot(Root)`, and a `Root` that renders `<Composition id component durationInFrames width height fps defaultProps>`. Defaults: 30 fps, 1920x1080, id `MyComp`. `defaultProps` must match the component props.
- Frame number comes from `useCurrentFrame()` and starts at 0. Size and timing come from `useVideoConfig()`.
- Video and audio use `<Video>` and `<Audio>` from `@remotion/media`; stills use `<Img>` from `remotion`; animated GIFs use `<Gif>` from `@remotion/gif`. Assets are a remote URL or a file in `public/` through `staticFile()`.
- Timing props on timed elements: `from`, `trimBefore`, `trimAfter`, `durationInFrames`, `loop`. A child that calls `useCurrentFrame()` counts from the first frame its parent appears.
- Stack layers with `<AbsoluteFill>`. Play things one after another with `<Series>` (`offset` shifts the start). Put transitions between scenes with `<TransitionSeries>` and its `<TransitionSeries.Transition timing presentation>`; the transition must sit between two sequences.
- Everything must be deterministic: never `Math.random()`, use `random('seed')`.
- `interpolate()` takes input range and output range; always set `extrapolateLeft: 'clamp'` and `extrapolateRight: 'clamp'` by default. Prefer `interpolate()` with `Easing` over `spring()` unless physical motion is asked for; `spring({fps, frame, config: {damping: 200}})` is the calm, no-bounce spring.
- Prefer scale, translate and rotate style props over transform strings.
- Render with `bunx remotion render <id>` and `bunx remotion still <id>`. The prompt also describes AWS Lambda deployment; JAL does not use Lambda by default (paid third-party cloud, ask Brian).
- Output only code, no markdown fences, one named export (docs use `MyComposition`). Fences still leak in practice, so sanitise (see below).

## Brief before prompt

An agent states these before the first prompt: purpose and audience, duration in seconds, fps (30 default), size and aspect (16:9, 9:16, 1:1), brand tokens (colors, type, no gradients/shadows/emoji on JAL surfaces), assets and where they live in `public/`, audio plan (voice, music, SFX from the CC0 set in `sfx.md`), captions (language, source, style), output (MP4, WebM with alpha, still, or in-site Player). Good prompts from the docs are short and concrete: "Make a promo video for a record store", "Create an animated title card using Inter", "Animate a route from A to B and make the camera follow it". Add the brief fields, not adjectives.

## Job 2: runtime generation

### Pattern A: scene spec

gpt-4o-mini writes weaker TSX than the models the docs assume, and executing model-written code is a security risk. So the model returns **JSON** that a fixed JAL composition renders:

```ts
import {z} from 'zod';
export const SceneSpec = z.object({
  title: z.string().max(80),
  fps: z.literal(30),
  scenes: z.array(z.object({
    kind: z.enum(['title', 'bullets', 'quote', 'stat', 'image']),
    text: z.string().max(200),
    seconds: z.number().min(1).max(12),
  })).min(1).max(12),
});
```

Ask for it with OpenAI structured output (JSON schema, strict), validate with zod, reject and retry on mismatch, then pass it as `inputProps` to a `<Composition>` whose `calculateMetadata()` sums `seconds * fps`. The Player previews it live. No eval, deterministic, brand-safe, testable. This covers most "prompt to video" asks.

### Pattern B: code generation

Only when the product truly needs arbitrary motion graphics. It adds `@babel/standalone`, a sandbox, and (if copied from the docs) the Vercel AI SDK `ai` + `@ai-sdk/openai` + `zod`. That is extra stack: only with Brian's yes (decided 2026-10-01; Pattern A is the default). The official flow, for reference:

1. System prompt = the rules above (the official system prompt is a good start; trim it, long contexts rot).
2. `generateText({model, system, prompt, output: Output.object({schema: z.object({code, title, durationInFrames, fps})}), maxRetries: 3})`. Structured output makes the model return fields instead of loose text; the docs note raw output often still wraps code in markdown fences, so strip fences in a sanitiser.
3. Optional skill routing: one cheap call picks skill names (docs example: charts, typography, transitions, spring-physics, 3d) and only those markdown modules are appended to the system prompt. JAL: both calls use gpt-4o-mini.
4. Compile in the browser (below), render in `<Player component durationInFrames fps compositionWidth compositionHeight controls />`.
5. The reference template (Prompt to Motion Graphics SaaS) adds: chat history for iterative refinement, live preview, "smart editing" (model picks targeted edits or full replacement), input validation against misuse, output sanitation of nondeterministic text, and self-correction (retry on compile errors by feeding the error back). Copy that list as the feature checklist.

Attach-vs-URL behaviour of that template: an attached image makes the model try to redraw it in code; an image URL in the prompt makes it embed that file.

### Just-in-time compilation

```ts
import * as Babel from '@babel/standalone';
const {code: js} = Babel.transform(source, {presets: ['react', 'typescript']});
const make = new Function('React', 'AbsoluteFill', 'useCurrentFrame', 'useVideoConfig',
  'spring', 'interpolate', 'Sequence', `${js}\nreturn DynamicComponent;`);
const Component = make(React, AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence);
```

The docs' hook strips `import` lines, extracts the component body, wraps it as `const DynamicComponent = () => {...}`, and returns `{Component, error}` so the UI can show errors and the model can retry. Every Remotion API the code uses must be passed in as a function argument; anything not injected does not exist.

### Security rules

The docs say the compiled code runs in the page's global scope and can reach every global. In JAL that is never acceptable in the app origin.

- Compile and run only inside an iframe with `sandbox="allow-scripts"` and no `allow-same-origin`, served from a separate origin, with a CSP that sets `connect-src 'none'`. Talk to it only through `postMessage`.
- Inject an allowlist of APIs; no `fetch`, no storage, no parent access.
- Treat the user's prompt, attached images and URLs as untrusted data. Validate input length and content before the model call. Allowlist image hosts or proxy images.
- Deny-list scan the generated source (imports, `eval`, `Function`, `import(`, `document.cookie`, network APIs) before compiling.
- Never put `OPENAI_API_KEY` in the iframe or the client bundle.
- Export to MP4 goes through JAL's own render path (`../rendering/render-paths.md`, JEV `video.render_path`). The template's AWS Lambda export needs AWS credentials in `.env` and is a paid third-party cloud: ask Brian.

## Other AI-adjacent items on the pages

- Code generation works with any provider through the AI SDK; JAL pins gpt-4o-mini (see top).
- The homepage frames three workflows (agentic, interactive, programmatic) that can be switched at any time because the code is always the source of truth. JAL follows that: agents write code, Studio is for interactive tweaks, data goes in through props.
