// CTABand: the page's close. Start aligned on the grid: the heading and
// lead on columns 1 to 6, the actions and proof from the page's own world
// (a price, a delivery promise, a SpecRail) on 8 to 12. Never a centered
// heading and one button on plain ground with nothing from the product.
import { useId, type ReactNode } from "react";
import { Section, type SectionFrame } from "./Page";

export interface CTABandProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  actions: ReactNode;
  /** Proof beside the actions: a SpecRail, a price line. */
  proof?: ReactNode;
}

export function CTABand({ title, lead, actions, proof, id, tone = "layer", rhythm }: CTABandProps) {
  const headingId = useId();
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <div className="kit-cta">
        <div className="kit-cta-text">
          <h2 id={headingId} className="kit-heading">
            {title}
          </h2>
          {lead ? <p className="kit-lead">{lead}</p> : null}
        </div>
        <div className="kit-cta-side">
          <div className="kit-actions">{actions}</div>
          {proof ? <div>{proof}</div> : null}
        </div>
      </div>
    </Section>
  );
}
