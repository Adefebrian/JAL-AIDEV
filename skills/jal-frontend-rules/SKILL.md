---
name: jal-frontend-rules
description: Bento Grid recipes, mobile app-shell layout, banned visual patterns (emdash, eyebrow, glow, neon), koboyo/reicon icon sourcing, feralui.dev gradients, spacing checklist. Use when building or reviewing any JAL frontend, React UI, or Bento layout.
---

# JAL Frontend Rules

Detail layer for the frontend law in `jal-standards`. Read that skill first; this file does not repeat its rules, it operationalizes them.

## Bento Grid recipes

Default layout system. A Bento layout is a CSS grid of unevenly sized cards that tile with zero leftover space, no exceptions for "it looked fine with a gap."

Base recipe:

```css
.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(160px, auto);
  gap: 16px;
}
.bento-lg { grid-column: span 2; grid-row: span 2; }
.bento-wide { grid-column: span 2; grid-row: span 1; }
.bento-tall { grid-column: span 1; grid-row: span 2; }
.bento-sm { grid-column: span 1; grid-row: span 1; }
```

Rules:
- Every row must be fully occupied. If the card count does not tile evenly, resize one card (span 2 instead of 1) rather than leave dead space.
- Use `grid-template-areas` for hero-style asymmetric layouts (one big feature card plus small utility cards) instead of manually counting spans when the layout is bespoke.
- Never mix gap sizes within one grid. One `gap` value per breakpoint.
- Card corner radius, padding, and border weight must be identical across every card in a given grid. Visual weight varies only by size and content, never by inconsistent chrome.
- Collapse to a single column on mobile (see app-shell below); do not shrink a 4-column grid down proportionally, it produces cramped unreadable cards.

```css
@media (max-width: 640px) {
  .bento { grid-template-columns: 1fr; }
  .bento-lg, .bento-wide, .bento-tall { grid-column: span 1; grid-row: span 1; }
}
```

## Mobile app-shell pattern

Mobile is not "the desktop site, but narrower." Ship a dedicated app-like shell:

```
┌─────────────────────┐
│  Status/header bar  │  <- sticky, safe-area-inset-top
├─────────────────────┤
│                      │
│   Scrollable content │
│                      │
├─────────────────────┤
│  Bottom tab bar      │  <- fixed, safe-area-inset-bottom
└─────────────────────┘
```

- Bottom tab bar (3 to 5 items max) replaces top nav on mobile. Fixed position, `padding-bottom: env(safe-area-inset-bottom)`, icon + label per tab, active state via color fill not underline.
- Content area scrolls independently of the shell; header and tab bar never scroll away unless the interaction explicitly calls for it (e.g. hide-on-scroll for a feed).
- Touch targets minimum 44x44px. No hover-only affordances on mobile, every interactive element needs a visible resting state.
- Use `100dvh` (dynamic viewport height), never bare `100vh`, to avoid mobile browser chrome jump.

## Banned looks

Hard rejects, no exceptions without Brian's sign-off:

- Emdash character anywhere in copy or code comments in frontend files. Use a comma, colon, or period.
- Eyebrow labels (small uppercase kicker text above a heading, e.g. "FEATURES" above "Everything you need"). Delete it, let the heading stand alone.
- Glow effects (`box-shadow` with large blur + saturated color, `filter: drop-shadow` halos).
- Neon color accents, oversaturated pinks/cyans/purples used as decoration rather than semantic state.
- Any other now-common AI-slop pattern: gratuitous blur blobs in the background, fake grain overlays, decorative squiggles with no meaning. If it does not communicate information or hierarchy, cut it.

## Icons

1. Query the koboyo MCP first for every icon need. It is bundled with the plugin and free to call.
2. Only if koboyo has no match for the concept, fall back to https://reicon.dev/.
3. Never hand-draw or hand-pick a third icon source. Consistency of icon family matters more than finding the "perfect" glyph.
4. Wrap icons in a shared `Icon` component (`packages/ui`) so size, stroke width, and color token are enforced centrally, not per usage.

## Gradients: feralui.dev/gradients is the only source

- Every gradient (static or animated) in a JAL project must come from https://feralui.dev/gradients. No hand-rolled `linear-gradient` stops, no generated-on-the-fly color math.
- Use a gradient only when it does real work: a hero background that needs depth, a CTA button that needs to stand out as the primary action, a data-viz accent. Never as default card chrome or default text fill.
- If a screen has more than one gradient, they must come from the same feralui.dev palette family so they read as one system.
- Default to solid brand colors. Reach for a gradient only when a reviewer would notice its absence.

## Spacing/sizing consistency checklist

Before shipping any screen, check:

- [ ] One spacing scale for the whole project (e.g. 4/8/12/16/24/32/48/64px), no arbitrary values like `13px` or `22px`.
- [ ] Card padding is identical across all cards of the same tier (bento-lg vs bento-sm may differ, but every bento-sm shares one padding value).
- [ ] Section vertical rhythm (space between major page sections) is a single repeated value, not ad hoc per section.
- [ ] No large empty gaps: every visible whitespace block should be intentional rhythm, not leftover grid dead space.
- [ ] Border radius uses one scale (e.g. 8/12/16/24px), matched to component tier, not randomly varied.
- [ ] Typography scale is a fixed set of sizes (no one-off font-size values inline).
- [ ] Mobile and desktop share the same spacing tokens, scaled by breakpoint variables, not hand-tuned per screen.
