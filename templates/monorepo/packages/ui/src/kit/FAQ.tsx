// FAQ: real questions answered plainly, as native details and summary rows
// in one bordered container (the Rows recipe). Keyboard and screen reader
// behavior come from the platform: Enter or Space toggles, the open state
// is announced. Each summary is a 44px target with the JAL state layer and
// the focus outline; the chevron turns with transform only and stops under
// reduced motion. The heading and lead sit on columns 1 to 4, the rows on
// 6 to 12 at 1024 and up.
import { useId, type ReactNode } from "react";
import { ChevronGlyph } from "./glyphs";
import { Section, SectionHead, type SectionFrame } from "./Page";

export interface FAQItem {
  q: ReactNode;
  a: ReactNode;
}

export interface FAQProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  items: FAQItem[];
  /** Replacement chevron from koboyo or reicon. */
  chevron?: ReactNode;
}

export function FAQ({ title, lead, items, chevron, id, tone, rhythm }: FAQProps) {
  const headingId = useId();
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <div className="kit-faq">
        <SectionHead id={headingId} title={title} lead={lead} layout="stack" />
        <div className="kit-faq-list">
          {items.map((item, i) => (
            <details key={i} className="kit-faq-item">
              <summary>
                <span className="kit-title">{item.q}</span>
                <span className="kit-faq-chevron" aria-hidden="true">
                  {chevron ?? <ChevronGlyph />}
                </span>
              </summary>
              <div className="kit-faq-answer">
                <p className="kit-body">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
