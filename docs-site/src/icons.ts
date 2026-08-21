// docs-site/src/icons.ts
//
// Icon sourcing per skill jal-frontend-rules: koboyo first, reicon.dev only
// as a fallback when koboyo has no match for the concept. Every icon below
// was fetched from the koboyo MCP (mcp__koboyo-icons__get_icon_svg), not
// hand-drawn. Each markup string is monochrome (fill="currentColor", no
// width/height), so it inherits color and size entirely from CSS, exactly
// the "shared Icon" discipline the rules call for: one class controls size
// and stroke weight everywhere an icon is used, no per-usage tweaking.
//
// Remaining section markers use a numbered index badge instead of an icon
// (see render.ts), a deliberate choice, not a missing icon: koboyo's free
// icon allowance for this project is exhausted, and reicon is reserved for
// concepts koboyo cannot match at all, not as a top-up when the koboyo
// quota runs out.

export const ICONS = {
  home: {
    slug: "home-outline",
    viewBox: "0 0 160 149",
    path:
      "M74.3 8.3a1103 1103 0 0 0-50.1 45.1C7 69.3 5.6 71.2 8 75c.5.9 3.1 1.7 6.7 2l5.8.5.5 28.8.5 28.9 3.7 3.4L29 142h16.8c15.1 0 17.1-.2 18.5-1.8 1.5-1.6 1.7-4.7 1.7-22.3 0-14.6.3-20.8 1.2-21.7a60 60 0 0 1 24.6 0c.9.9 1.2 7.1 1.2 21.8 0 18.8.2 20.8 1.8 22.3 1.6 1.4 4.4 1.7 18.1 1.7 18.8 0 21.2-.7 24.2-7.3 1.7-3.8 1.9-6.8 1.9-30.9V77.1l5.7-.3c4.9-.3 5.9-.7 6.9-2.6 2.3-4.6 3.9-2.9-41.6-43.6C85.7 8.8 83.4 7 79.7 7c-1.8.1-4.2.6-5.4 1.3m8.3 6.9c3.1 2.4 21.2 18.5 46.6 41.5L145 71h-4.7c-8.5 0-8.3-.8-8.3 32.2 0 27.5-.1 28.9-2 30.8-1.8 1.8-3.3 2-16.5 2H99V95l-2.9-3.2c-2.9-3.3-3-3.3-13.7-3.6-12.3-.4-17.4.7-20.3 4.5-2 2.4-2.1 3.9-2.1 22.9V136H45.6c-20.1 0-18.6 2.8-18.6-34 0-22.1-.3-29-1.3-29.8a15 15 0 0 0-6.1-1.4l-4.8-.3 8.4-7.5L55 34.2A594 594 0 0 1 79 13c.4 0 2 1 3.6 2.2",
  },
  install: {
    slug: "package-download",
    viewBox: "0 0 95 193",
    path:
      "M45 9.7c-4.1.2-8 .9-8.7 1.5-1 .8-1.3 5.4-1.3 18.4V47h-7c-6 0-7.1.3-8 2.1-.9 1.5-.8 2.4.2 3.7 2.7 3.5 24.3 26.7 25.5 27.5.7.4 2.1.3 3.2-.2 2.3-1.3 24.3-25.5 25.5-28.1 1.5-3.4-.9-4.9-8.2-5.2l-6.7-.3-.5-17.7a177 177 0 0 0-1-18.1c-1-1-5.6-1.3-13-1m10.2 22.5.3 18.3 7.2.3 7.3.3-11.3 12.5L47.5 76l-9.3-9.7c-5.1-5.4-10.2-11-11.3-12.6l-2-2.7h6.3c3.7 0 6.9-.5 7.6-1.2.8-.8 1.2-6.4 1.2-18.5V14h15zM25.5 98.8a96 96 0 0 0-20.3 13.3c-1 1.8-1.2 7.8-.9 24.7.3 20.4.5 22.4 2.3 24.1 4.1 3.9 37.6 22.1 40.6 22.1 1.7 0 5.4-1.3 8.2-2.9a348 348 0 0 0 32.8-19.3c1.6-1.6 1.8-4 1.8-25.1 0-17.1-.3-23.7-1.2-24.9-.7-.9-8-5.4-16.3-10C52.7 89.6 49.5 88 46.8 88a147 147 0 0 0-21.3 10.8m26.8-4.2c2.9 1.5 5.8 3.1 6.4 3.6 1.7 1.4-33 22.2-35.5 21.3-.9-.3-4.1-2-7.1-3.9l-5.4-3.4 6.9-4A744 744 0 0 1 46.8 92zm21.7 12c5.6 3.1 10 5.8 9.8 5.9A703 703 0 0 1 47.4 133a66 66 0 0 1-17.7-11.1c.9-.8 33.5-20.9 34-20.9zM42.9 136c2.1 1.5 2.2 1.9 1.9 21.7l-.3 20.3-17.7-10.1-17.8-10v-41.8l15.8 9.2zm43.1 1.4v20.4l-17.2 9.7-18.1 10.2c-.4.3-.6-8.9-.5-20.3l.3-20.7 17-9.8c9.4-5.4 17.3-9.9 17.8-9.9s.7 9.2.7 20.4",
  },
  terminal: {
    slug: "terminal",
    viewBox: "0 0 190 151",
    path:
      "M18.4 8.9c-1.1.5-3.4 2.5-5.2 4.5L10 17.1v58.1c0 57.2 0 58.1 2.1 61.5 4.1 6.6 0 6.3 83.5 6.3h75.7l4.4-4.4 4.3-4.4-.2-59.1-.3-59.1-3.8-3.7-3.7-3.8-75.8-.2c-41.6-.1-76.6.2-77.8.6m151.5 5.6a9 9 0 0 1 4 4.6c.7 2.2 1.1 20.2 1.1 57.1 0 58.7 0 58.7-5.6 60.8-3.6 1.4-146.9 1.3-149.5 0-4.9-2.7-4.9-3.1-4.9-61.7.1-58.7 0-58.1 5.1-60.9 3.8-2.1 145.8-2 149.8.1M35.5 47.6c-1.9 2-3.1.7 14.3 16.6l7.3 6.7-7.3 6.8-11.7 10.9c-4 3.7-4.4 4.4-3.1 5.8.7.9 2 1.4 2.8 1.1a283 283 0 0 0 25.6-23.3c.9-2-.1-3.3-11.6-13.7-14.5-13.2-14.2-13-16.3-10.9m40.7 48.7c-2.8 3.3 0 3.7 20.9 3.5 19.6-.3 20.4-.4 20.4-2.3s-.8-2-20.1-2.3c-15.6-.2-20.4.1-21.2 1.1",
  },
  faq: {
    slug: "bubble-question",
    viewBox: "0 0 148 153",
    path:
      "M67.5 7.7a77 77 0 0 0-36.4 14.6A67 67 0 0 0 8.5 57.2a78 78 0 0 0 0 29.7 71 71 0 0 0 13.1 25.4c3.6 3.8 3.7 3.9 3.2 10.5-.3 3.9-1.7 9.5-3.3 13.5-3.3 8.1-2.9 10.2 1.8 9.3a65 65 0 0 0 20.4-10.2l4.2-3.5 7.3 2.3a58 58 0 0 0 20.8 2.3c12.5 0 14.1-.3 22.1-3.1a62 62 0 0 0 36.5-31.9 66 66 0 0 0-14.9-77A70 70 0 0 0 67.5 7.7M90.4 15c11.2 2.8 19 7.3 27.7 16a54 54 0 0 1 17.2 42.5 56 56 0 0 1-39.5 54.9 66 66 0 0 1-43.1-.6l-6.7-2.2-4.3 4.1a50 50 0 0 1-15 9.3c-.2 0 .5-2.6 1.6-5.8a48 48 0 0 0 2.1-12.2c.1-6.4 0-6.6-4.8-12.5A62 62 0 0 1 12 72c0-14.4 6.7-29.9 17.5-40.6A64 64 0 0 1 90.4 15M67.8 38A20 20 0 0 0 56 47.1c-2.4 4.6-2.6 10.7-.5 11.5 2.3.9 4.5-1.5 4.5-4.7q0-2.9 3.4-6.7c3.3-3.6 3.7-3.7 10-3.7 6 0 6.8.3 9.6 3.1a16 16 0 0 1 3.9 6.5c1.3 6-.3 9.2-8.4 16.4s-10 10.9-9.3 17.5c.3 3 .7 3.5 2.8 3.5 2.2 0 2.6-.5 3-4.5.8-6.1 2.1-8.2 8-12.5 9.5-7 12.7-17.4 8-26.5-4-7.8-14.1-11.7-23.2-9m.8 63.3c-2.1 1.6-2.4 6-.6 8.2s6.3 1.9 8.3-.3c4.7-5.2-2.1-12-7.7-7.9",
  },
} as const;

export type IconName = keyof typeof ICONS;

/** Renders one icon as an inline <svg>. Size and color come from the
 * .icon class in styles.css, never from an inline style here, so every
 * usage across the page shares one stroke weight and one sizing rule. */
export function iconSvg(name: IconName, extraClass = ""): string {
  const icon = ICONS[name];
  const cls = extraClass ? `icon icon-${name} ${extraClass}` : `icon icon-${name}`;
  return `<svg class="${cls}" viewBox="${icon.viewBox}" fill="currentColor" aria-hidden="true"><path d="${icon.path}"/></svg>`;
}
