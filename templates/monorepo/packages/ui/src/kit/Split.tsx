// Split: one statement beside one piece of proof, on asymmetric spans of
// the 12 columns (text/media: 5/7, 7/5, 4/8, 8/4). The media slot takes a
// MediaFrame, a live product fragment built from JAL components, or a
// SpecRail. Below 1024 the two stack; mobileMedia says which comes first.
// One heading, one lead, optional extra content (a SpecRail, a short list),
// optional actions.
import { useId, type ReactNode } from "react";
import { Section, type SectionFrame } from "./Page";

export type SplitRatio = "5/7" | "7/5" | "4/8" | "8/4";

export interface SplitProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  /** Extra content under the lead: a SpecRail, a short list, a paragraph. */
  children?: ReactNode;
  actions?: ReactNode;
  media: ReactNode;
  /** Text span / media span. Default 5/7. */
  ratio?: SplitRatio;
  /** Which side the media takes at 1024 and up. Default end. */
  mediaSide?: "start" | "end";
  /** Below 1024: media before or after the text. Default after. */
  mobileMedia?: "before" | "after";
}

export function Split({
  title,
  lead,
  children,
  actions,
  media,
  ratio = "5/7",
  mediaSide = "end",
  mobileMedia = "after",
  id,
  tone,
  rhythm,
}: SplitProps) {
  const headingId = useId();
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <div className="kit-split" data-ratio={ratio} data-media-side={mediaSide} data-mobile-media={mobileMedia}>
        <div className="kit-split-text">
          <h2 id={headingId} className="kit-heading">
            {title}
          </h2>
          {lead ? <p className="kit-lead">{lead}</p> : null}
          {children ? <div className="kit-split-extra">{children}</div> : null}
          {actions ? <div className="kit-actions">{actions}</div> : null}
        </div>
        <div className="kit-split-media">{media}</div>
      </div>
    </Section>
  );
}
