// Quote: one real, attributed quote, carried by type alone (the heading
// step, the direction's display face). No left rule, no quote-mark glyph
// as ornament, no card. Real people only: never a stock placeholder name.
import type { ReactNode } from "react";
import { Section, type SectionFrame } from "./Page";

export interface QuoteProps extends SectionFrame {
  quote: ReactNode;
  name: ReactNode;
  role?: ReactNode;
  /** start (default) or center, matching the page's one alignment. */
  align?: "start" | "center";
  /** Accessible name for the section. */
  label?: string;
}

export function Quote({ quote, name, role, align = "start", label = "Customer quote", id, tone, rhythm }: QuoteProps) {
  return (
    <Section id={id} tone={tone} rhythm={rhythm} label={label}>
      <figure className="kit-quote" data-align={align}>
        <blockquote>
          <p className="kit-quote-text">{quote}</p>
        </blockquote>
        <figcaption>
          <span className="kit-quote-name">{name}</span>
          {role ? <span className="kit-meta">{role}</span> : null}
        </figcaption>
      </figure>
    </Section>
  );
}
