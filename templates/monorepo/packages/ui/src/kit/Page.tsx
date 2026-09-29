// Page, Section, SectionHead, Figure: the frame every kit composition sits in.
//
// Page      the root. Carries data-direction (D1 to D13, or a project's own
//           derived identity) and paints the canvas. Wrap the AppShell with it,
//           or put data-direction on <html> and skip it.
// Section   one band of the page: a tone (base or layer) and a rhythm (tight,
//           default, generous) around the 4/8/12 column grid. Every
//           composition renders its own Section, so hand-written layout uses
//           Section directly and still lands on the grid.
// SectionHead  one heading plus one lead, split across the grid or stacked.
//           Never two stacked headings, never a kicker above the heading.
// Figure    a number with its unit: tabular mono value, meta-size unit,
//           joined by a no-break space.
import type { ReactNode } from "react";

export type DirectionId =
  | "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7"
  | "D8" | "D9" | "D10" | "D11" | "D12" | "D13";

/** The 13 JAL Core directions, by id (directions.md section 7). */
export const DIRECTIONS: Record<DirectionId, string> = {
  D1: "research_notebook",
  D2: "single_signal_ledger",
  D3: "blueprint_hairline",
  D4: "bone_white_gallery",
  D5: "calm_productivity",
  D6: "clean_docs",
  D7: "warm_paper_editorial",
  D8: "quiet_care",
  D9: "cinematic_hardware",
  D10: "industrial_catalogue",
  D11: "oversized_masthead",
  D12: "friendly_consumer",
  D13: "precision_dark",
};

export type SectionTone = "base" | "layer";
export type SectionRhythm = "tight" | "default" | "generous";

/** Props every section-level composition accepts. */
export interface SectionFrame {
  id?: string;
  tone?: SectionTone;
  rhythm?: SectionRhythm;
}

export interface PageProps {
  /** A direction id, or a project's derived identity name keyed in its own CSS. */
  direction?: DirectionId | (string & {});
  /** "dark" only for an explicit dark mode (D13). Never set from the OS. */
  theme?: "dark";
  children: ReactNode;
}

export function Page({ direction, theme, children }: PageProps) {
  return (
    <div className="kit-page" data-direction={direction} data-theme={theme}>
      {children}
    </div>
  );
}

export interface SectionProps extends SectionFrame {
  /** Accessible name when the section has no visible heading. */
  label?: string;
  /** Id of the visible heading that names the section. */
  labelledBy?: string;
  children: ReactNode;
}

export function Section({ id, tone = "base", rhythm = "default", label, labelledBy, children }: SectionProps) {
  return (
    <section
      id={id}
      className="kit-section"
      data-tone={tone}
      data-rhythm={rhythm}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
    >
      <div className="kit-grid">{children}</div>
    </section>
  );
}

export interface SectionHeadProps {
  /** Heading id, so the enclosing Section can be labelled by it. */
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /** split: heading columns 1 to 5, lead 7 to 12. stack: both on 1 to 8. */
  layout?: "split" | "stack";
  /** Semantic level. Visual size stays the heading role. */
  level?: 2 | 3;
}

export function SectionHead({ id, title, lead, action, layout = "split", level = 2 }: SectionHeadProps) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <div className="kit-head" data-layout={layout}>
      <Heading id={id} className="kit-heading">
        {title}
      </Heading>
      {lead ? <p className="kit-lead">{lead}</p> : null}
      {action ? <div className="kit-head-action">{action}</div> : null}
    </div>
  );
}

export interface FigureProps {
  value: ReactNode;
  unit?: string;
}

/** A value and its unit. The unit is optional; the value is always tabular mono.
 *  A no-break space (U+00A0) joins them so a unit never wraps from its value. */
export function Figure({ value, unit }: FigureProps) {
  return (
    <>
      <span className="kit-num">{value}</span>
      {unit ? <span className="kit-unit">{"\u00a0" + unit}</span> : null}
    </>
  );
}
