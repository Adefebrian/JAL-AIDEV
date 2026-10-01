# Remotion Timeline component

`<Timeline>` is a paid, customizable, layer-based timeline UI that plugs into the Remotion Player. It is the building block for a video editing app when you do not want the whole Editor Starter. It is not for ordinary marketing pages.

From: https://www.remotion.dev/docs/timeline/ , https://www.remotion.dev/docs/timeline/demo , https://www.remotion.dev/docs/timeline/faq , https://www.remotion.dev/docs/timeline/render , https://www.remotion.dev/docs/timeline/setup , https://www.remotion.dev/docs/timeline/usage

## 1. What it is

- Sold on remotion.pro as a one-time purchase for individuals and small companies (3 or fewer). Larger companies subscribe to the Company License. Its source is under the Remotion License **and its own specific license** (visible on the store page and in the GitHub repository after purchase). Read that license before adopting.
- You copy a `timeline/` folder into your app (source, not an npm package) and customize it.
- Features: multiple tracks with drag and drop between and within tracks, item selection and manipulation, keyboard shortcuts, a `CanvasComposition` that renders the timeline state in the Remotion Player, a zoomable timeline with a `<ZoomSlider>`, theming with CSS variables (Tailwind CSS v4 and v3), extensible state.
- Demo (a video walkthrough): copy the implementation into the main app, set up the Tailwind theme, then wire the Player.

## 2. Setup

1. Copy the `timeline/` folder into the app.
2. Install: `remotion`, `@remotion/player`, `@remotion/media-utils`, `tailwindcss` (use `bun add --exact` for the Remotion packages; Tailwind is a dependency of the template, not of a JAL site by default).
3. Tailwind v4: import `timeline/theme/timeline.css` in the global CSS, and edit the values in the `@theme` block to restyle. Tailwind v3: use `timeline-preset.mjs` as a preset.

JAL note: the kit styles with tokens, not Tailwind. If a project adopts the Timeline, either scope Tailwind to the editor subtree or port its theme variables to JAL tokens, and run `ui_audit`. Adoption of a Tailwind-dependent paid component is an extra stack choice that needs Brian's confirmation.

## 3. Usage structure

The docs' app shape (names from the demo code):

```
<TimelineProvider initialState={...} onChange={(state) => ...}>
  <TimelineZoomProvider initialZoom={1}>
    <PreviewContainer>  Player (with a playerRef) + action row  </PreviewContainer>
    <TimelineContainer timelineContainerRef={...}>
      <TimelineSizeProvider containerWidth={...}> <Timeline /> ...
```

- Keep the Player and the timeline as siblings; share the `playerRef` (the same sibling rule as `player.md` section 7, so the playhead does not re-render the Player).
- Get the container width with an element-size hook and pass it to the size provider once known.
- `onChange` receives the new timeline state; persist it however the product requires.
- State uses React Context, no Zustand or Redux; add one if performance needs it.

## 4. FAQ points

- Compatible with React 18 (it avoids `use()` and ref-as-prop). The Editor Starter, by contrast, needs React 19.
- No state management library is included, by design.

## 5. Rendering the timeline state

The Timeline sample is a frontend-only Vite project. To turn a timeline state into a video you need a render path: copy the Remotion composition files (the `CanvasComposition` and items) into a Remotion project and render it. Docs recommend a template that has both frontend and backend (Next.js or React Router with the Lambda boilerplate) and copying the timeline into its frontend. **JAL alternative:** render in the browser with `renderMediaOnWeb` using the same `CanvasComposition` (`web-renderer.md`), which avoids Lambda; the composition must fit the CSR subset (`client-side-rendering.md`). A server render needs a `render.engine` decision.

## 6. When JAL would use it

Only for a product feature such as "arrange clips on layers". For a fixed sequence the visitor cannot reorder, use a composition with `Series` and props. For a full editor, the Editor Starter (`editor-starter.md`) already includes a timeline.
