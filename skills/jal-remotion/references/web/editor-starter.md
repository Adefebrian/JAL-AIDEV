# Remotion Editor Starter

A paid React template for building your own **video editor** (end users edit videos visually in the browser). It bundles a timeline, an interactive canvas, asset uploads, captions, fonts, undo and redo, copy and paste, cropping, snapping, and rendering through Lambda or in the browser. It is for products where the visitor is the editor, not for putting a composition on a marketing page.

From: https://www.remotion.dev/docs/editor-starter/ , https://www.remotion.dev/docs/editor-starter/asset-cleanup , https://www.remotion.dev/docs/editor-starter/asset-uploads , https://www.remotion.dev/docs/editor-starter/backend-routes , https://www.remotion.dev/docs/editor-starter/before-you-buy , https://www.remotion.dev/docs/editor-starter/buy , https://www.remotion.dev/docs/editor-starter/captioning , https://www.remotion.dev/docs/editor-starter/client-side-rendering , https://www.remotion.dev/docs/editor-starter/copy-paste , https://www.remotion.dev/docs/editor-starter/cropping , https://www.remotion.dev/docs/editor-starter/demo , https://www.remotion.dev/docs/editor-starter/dependencies , https://www.remotion.dev/docs/editor-starter/faq , https://www.remotion.dev/docs/editor-starter/features , https://www.remotion.dev/docs/editor-starter/features-not-included , https://www.remotion.dev/docs/editor-starter/fonts , https://www.remotion.dev/docs/editor-starter/persistance , https://www.remotion.dev/docs/editor-starter/production-checklist , https://www.remotion.dev/docs/editor-starter/rendering , https://www.remotion.dev/docs/editor-starter/setup , https://www.remotion.dev/docs/editor-starter/snapping , https://www.remotion.dev/docs/editor-starter/state-management , https://www.remotion.dev/docs/editor-starter/tracks-items-assets , https://www.remotion.dev/docs/editor-starter/undo-redo , https://www.remotion.dev/docs/editor-starter/vs-studio

## 1. Decision: not by default

The Editor Starter is a purchase ($600 one-time, from remotion.pro, private GitHub repository access; included in the Enterprise License; a customer who bought the Timeline gets a full refund on it) and its reference app uses a stack that conflicts with JAL rules. Adopting it is an extra complex stack, so **it needs Brian's confirmation and a JEV `product.editor` decision first.** Use it only when the requirement is "visitors edit videos". For "visitors tweak a few props and export", use the Player plus `renderMediaOnWeb` (`website-integration.md` sections 5 and 9).

| Starter choice | JAL rule | Resolution if adopted |
|---|---|---|
| React Router 7 reference app | Hono + Bun.build for websites, no framework server | Copy only `src/editor` into the Bun.build React app; the docs say it should work in any React framework |
| Tailwind CSS v4 required | JAL styles with the kit and tokens | Isolate the editor under its own scope or port its styling to tokens; check `ui_audit` |
| AWS S3 for asset uploads, Lambda for rendering | Self-hosted S3-compatible storage (JAL stack) and no AWS lock-in | Point uploads at the JAL S3-compatible store; render in the browser (below) |
| OpenAI Whisper API for captions (an OpenAI key) | AI default is gpt-4o-mini; keys never printed or committed | Treat captions as an optional feature behind a flag; key in server env only |
| Google Fonts fetched at runtime | | Fine; or self-host fonts per the site's font rules |
| `npm` commands in its docs | Bun is the package manager | Use `bun add` / `bun install`; verify the lockfile |
| Desktop-oriented editor (not optimized for phones) | Mobile-first law | Offer the editor on desktop only and say so; a mobile fallback is a read-only preview |

## 2. What it contains

- **Item types**: images, videos, audio, GIFs, text, solids, captions. Add a type by copying an existing item and extending the `EditorStarterItem` union (the typechecker then lists every place to update).
- **Model**: Assets (media files, captions), Items (what the timeline and canvas show; an item refers to at most one asset; many items can share an asset; items on a track may not overlap), Tracks (stack order; the top track renders in front). State is one object (`EditorState`) held with plain React `useState` and `useContext`.
- **Toolbar**: draw solid, add text, import assets, undo, redo, save, download state, load state (each a feature flag in `src/editor/flags.ts`; the starter has 80+ flags).
- **Timeline**: tracks, draggable playhead (scrolls at the edge), drop assets onto the timeline (types detected by Media Parser, since replaced in the concept by Mediabunny), filmstrip thumbnails, automatic durations, multi-select drag, extend handles, max-trim indicators, snapping (timeline snapping and canvas snapping, toggled by a magnet button).
- **Canvas**: interactive selection and transform, cropping on four sides (items gain crop fields), copy and paste (clipboard types `text/plain`, `text/html`, `image/png`), fonts through `@remotion/google-fonts`.
- **Undo and redo**: arrays of state snapshots in memory (an undo stack and a redo stack).
- **Persistence**: three kinds: saving editor state (local storage by default through `saveState()`/`loadState()`), caching assets in IndexedDB, and the loop setting. Auto-save is left to you (use `useFullState()` in an effect).
- **Captions**: a backend route sends audio to the OpenAI Audio API; the result becomes caption items.
- **Rendering**: Remotion Lambda by default; or set `ENABLE_CLIENT_SIDE_RENDERING = true` to render in the browser with `@remotion/web-renderer` (see section 4).
- **Backend routes**: fonts metadata, captions, asset upload presign, Lambda render and progress. None are protected by auth or rate limits.
- **Dependencies**: React 19, Remotion (pinned, 4.0.499 in the snapshot; a different version than the 4.0.532 of the other packages, so align versions), `@remotion/captions`, `@remotion/cli`, `@remotion/gif`, `@remotion/google-fonts`, `@remotion/lambda`, `@remotion/layout-utils`, Radix UI primitives, `@aws-sdk/s3-request-presigner`, React Router 7, Tailwind 4.
- **Demo**: an online demo with an empty project and an announcement video.

## 3. Not included (plan for these)

Keyframing and animation of layer properties (suggested: store arrays of keyframes and use `interpolate` with easing), transitions (render affected items in a `<TransitionSeries>`), project management UI (each `<Editor />` is one isolated project; you build the project list and the load/save by project id), auto-save, mobile support, multiple frame rates (fixed at 30 fps by `DEFAULT_FPS`; changing it means converting every item), and other items the page lists. Budget these as separate features.

## 4. Client-side rendering in the starter

Set `ENABLE_CLIENT_SIDE_RENDERING = true` (also keep `FEATURE_NEW_MEDIA_TAGS` on, the default). On Render it collects tracks, items, assets, composition settings and font metadata, calls `renderMediaOnWeb()`, encodes in the browser through WebCodecs, and offers the finished file as a temporary download. No AWS render setup needed. Other features still need their routes: fonts metadata (`/api/fonts/:name`), S3 uploads, captions.

Production checklist for CSR in the starter: supported browsers have WebCodecs; compositions fit the CSR limits (`client-side-rendering.md` section 4); the user keeps the page open until done; a temporary download is acceptable or you persist the output; page responsiveness suits the app; deleted assets still need cleanup in S3.

## 5. Production checklist (from the docs, plus JAL)

1. Protect the backend routes with authentication and rate limits (the template has none). Use JAL hardening (`jal-security-hardening`).
2. Implement asset cleanup (deleted assets remain in the bucket and in the browser's IndexedDB cache until you remove them).
3. Separate production and development infrastructure if Lambda is used (not the JAL default).
4. CSR checks above.
5. Review "features not included" against the product plan.
6. Accessibility: the starter tries for keyboard navigation, focus indicators, labels and contrast, but once its code is in your repository it is **your** responsibility (`accessibility.md`).
7. Keep API keys server-side; never print them.
8. Tests: unit-test the state functions (undo, snapping), and E2E a basic edit and export.

## 6. Editor Starter versus Remotion Studio

Studio is a free developer preview tool whose video is React code written by a developer; the Editor Starter is a $600 boilerplate whose video is JSON-serializable state edited by end users. The licensing difference: Remotion is free for individuals and small companies (3 or fewer); the Editor Starter purchase does not remove the Remotion Company License need for teams of 4 or more (the FAQ says so).

## 7. Related paid pieces

`<Timeline>` alone (`timeline.md`) and the Recorder (`recorder.md`, free template). A Remotion-based editor can also be built from scratch with Remotion primitives.
