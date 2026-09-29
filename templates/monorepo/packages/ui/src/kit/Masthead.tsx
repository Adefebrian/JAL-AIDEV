// Masthead: the hero, and the only place the display role appears (one
// display element per page). Display headline (the page h1), one lead line,
// a primary action and at most one secondary, then the variant's proof or
// media. Nothing above the headline: no eyebrow, kicker, pill, or number.
//
// Variants:
//   left      type-led, start aligned, headline on columns 1 to 10.
//   centered  for a Marquee or wordmark opening where the headline is the
//             whole composition; pair it with a centered Quote.
//   split     text on 5 columns beside media on 7 (mediaSide flips it);
//             below 1024 the text leads and the media follows.
//   overlay   full-bleed media as a decorative backdrop band, the text on a
//             solid surface panel with a full hairline, never a translucent
//             scrim. Below 1024 the media and the panel stack, so no text ever
//             sits on the image. The media is aria-hidden: every fact it shows
//             must also be in the panel.
// The hero fills 70 to 90% of the first viewport, never 100, with bottom
// padding at least 1.3 times the top.
import { useId, type ReactNode } from "react";
import type { SectionTone } from "./Page";

export type MastheadVariant = "left" | "centered" | "split" | "overlay";

export interface MastheadProps {
  variant?: MastheadVariant;
  /** The page h1. Text, or an authored SVG wordmark with an accessible name. */
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  /** Required for split and overlay. */
  media?: ReactNode;
  mediaSide?: "start" | "end";
  /** Real proof below the actions: a SpecRail, a StatRow-sized fact, a live input. */
  proof?: ReactNode;
  id?: string;
  tone?: SectionTone;
}

export function Masthead({
  variant = "left",
  title,
  lead,
  actions,
  media,
  mediaSide = "end",
  proof,
  id,
  tone = "base",
}: MastheadProps) {
  const headingId = useId();
  if ((variant === "split" || variant === "overlay") && !media) {
    throw new Error(`Masthead: the ${variant} variant needs media`);
  }

  const text = (
    <>
      <h1 id={headingId} className="kit-display">
        {title}
      </h1>
      {lead ? <p className="kit-lead">{lead}</p> : null}
      {actions ? <div className="kit-actions">{actions}</div> : null}
    </>
  );

  if (variant === "overlay") {
    return (
      <section id={id} className="kit-masthead kit-section" data-variant="overlay" data-tone={tone} aria-labelledby={headingId}>
        <div className="kit-overlay">
          <div className="kit-overlay-media" aria-hidden="true">
            <div className="kit-overlay-backdrop">{media}</div>
          </div>
          <div className="kit-overlay-panel-row kit-grid">
            <div className="kit-overlay-panel">
              {text}
              {proof ? <div className="kit-masthead-proof">{proof}</div> : null}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={id}
      className="kit-masthead kit-section"
      data-variant={variant}
      data-media-side={variant === "split" ? mediaSide : undefined}
      data-tone={tone}
      aria-labelledby={headingId}
    >
      <div className="kit-grid">
        <div className="kit-masthead-text">{text}</div>
        {variant === "split" ? <div className="kit-masthead-media">{media}</div> : null}
        {proof ? <div className="kit-masthead-proof">{proof}</div> : null}
      </div>
    </section>
  );
}
