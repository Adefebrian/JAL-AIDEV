# Fonts (@remotion/fonts, @remotion/google-fonts)

From:
- https://www.remotion.dev/docs/fonts
- https://www.remotion.dev/docs/google-fonts/
- https://www.remotion.dev/docs/google-fonts/get-available-fonts
- https://www.remotion.dev/docs/google-fonts/get-info
- https://www.remotion.dev/docs/google-fonts/load-font
- https://www.remotion.dev/docs/google-fonts/load-font-from-info
- https://www.remotion.dev/docs/google-fonts/load-variable-font
- https://www.remotion.dev/docs/google-fonts/load-variable-font-from-info

Written from the Remotion docs read on 2026-10-01 (newest version tag seen on these pages: 4.0.530). A version tag in text means the first release that has the feature.

## JAL font policy (read first)

- Default: Geist Sans and Geist Mono, self-hosted under SIL OFL, vendored in the template. A pool of other OFL families is fetched into the client project with `scripts/assets/fonts.ts` (`list`, `get`). That script is the only route for pool fonts.
- In a Remotion project, load self-hosted fonts with `loadFont()` from `@remotion/fonts` and `staticFile()`.
- `@remotion/google-fonts` and Google CSS imports may be used only for video renders. Never load Google Fonts on a JAL website: no `fonts.googleapis.com` link, no runtime fetch from a visitor's browser. For a website Player, bundle the font file locally.
- Many Remotion Elements and prompts use Inter, Montserrat, Figtree, Lora, Caveat, Cormorant Garamond or Mona Sans through google-fonts. For JAL, swap to Geist (or a pool family) unless the brief fixes a face.

## What the docs say

- Four ways to get a font in: `@remotion/google-fonts` (type-safe, 3.2.40+), a Google CSS `@import` (Remotion waits for it), local files with `@remotion/fonts` (4.0.164+), or the browser `FontFace` API with `delayRender`.
- `loadFont(style, {weights, subsets})` blocks the render until the font is ready and returns `fontFamily` and `waitUntilDone()`. From v5.0 non-empty `weights` and `subsets` are required; calling it with no arguments loads every variant and can time out a render.
- `loadVariableFont()` (4.0.525+) loads one file with a weight range and returns `axes`. `getInfo()` returns metadata (including `variable?`), `loadFontFromInfo()` (4.0.279+) loads from that metadata (font pickers, lighter client bundle), `getAvailableFonts()` lists everything with a lazy `load()`.
- For several fonts, load them in one shared module and export a `waitForFonts()` helper; text measurement needs the font loaded first.
- Fonts in `<svg>` `<text>` run in another document under `@remotion/web-renderer`; both font packages keep an internal registry to compensate.
- Pages `docs/google-fonts/` (index) returns 404 on the site; its child pages were read.

Legend (full text in `recipe-index.md`): Tier T1 DOM/SVG/CSS math, T2 WebGL2 or canvas effects, T3 HTML-in-canvas or multi-sample or audio analysis, T4 3D, maps, Skia or custom shaders. Web: `live` plays in a Player on any browser and on mobile, `pre` ship as a pre-rendered video (a live Player only after a device test), `video` deliverable video only. Motion fallback: S nothing to remove, F1 freeze on the settled frame, F2 hard cut, F3 poster image and no autoplay, F4 opacity crossfade of 200 ms or less. Law: fine, canvas-only (only inside a canvas or video frame, never page chrome), brief-only (only when the brief asks for that style and JEV agrees).

## Recipes

| ID | Shows | Technique and package | Tier | Web | Motion fallback | Law |
|---|---|---|---|---|---|---|
| `rm.font.local` | Self-hosted font file loaded into a composition (the JAL default path). | loadFont({family, url: staticFile('x.woff2')}) from @remotion/fonts (4.0.164+); Geist Sans and Geist Mono (vendored OFL) default, pool fonts via scripts/assets/fonts.ts | T1 | live | S | fine |
| `rm.font.facefont-manual` | Manual FontFace loading with delayRender. | new FontFace(...) + document.fonts.add inside delayRender()/continueRender(); fallback when @remotion/fonts is not available | T1 | live | S | fine |
| `rm.font.svg-web-renderer` | Fonts inside SVG text for client-side rendering. | text, tspan, textPath in <svg> render in another document with @remotion/web-renderer; Remotion keeps an internal font registry in @remotion/fonts and @remotion/google-fonts | T2 | pre | S | fine |
| `rm.font.css-import` | Google Fonts through a CSS import. | @import of a Google CSS url; Remotion waits for it since v2.2; VIDEO RENDERS ONLY: never on a JAL website | T1 | video | S | fine |
| `rm.font.google-load` | Type-safe Google font loading for video renders. | loadFont(style, {weights, subsets}) from @remotion/google-fonts/<Name>; returns fontFamily and waitUntilDone(); from v5.0 non-empty weights and subsets are required; VIDEO RENDERS ONLY, never loads on a JAL website | T1 | video | S | fine |
| `rm.font.google-variable` | Variable Google font, one file with weight range and axes (4.0.525+). | loadVariableFont(style, {subsets}) returns fontFamily, axes, waitUntilDone; only for fonts Google ships as variable; video renders only | T1 | video | S | fine |
| `rm.font.google-from-info` | Load a Google font from metadata fetched on a server. | loadFontFromInfo(getInfo(), style, options) (4.0.279+); keeps the client bundle small; font pickers; video renders only | T1 | video | S | fine |
| `rm.font.google-variable-from-info` | Variable Google font loaded from server-side metadata (4.0.525+). | loadVariableFontFromInfo(info, style, {subsets}) from @remotion/google-fonts/from-info; returns axes, fontFamily, waitUntilDone; video renders only | T1 | video | S | fine |
| `rm.font.google-info` | Metadata of one Google font. | getInfo() returns fontFamily, importName, version, url, unicodeRanges, fonts, subsets, variable? (4.0.525+) | T1 | video | S | fine |
| `rm.font.google-list` | List all fonts available in @remotion/google-fonts. | getAvailableFonts() returns fontFamily, importName, load(); lazy load needs ESM | T1 | video | S | fine |
