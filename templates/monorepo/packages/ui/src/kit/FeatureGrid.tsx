// FeatureGrid: truly equivalent capabilities compared side by side, in the
// hairline cell grid (2, 3, or 4 columns at 1024 and up). One anatomy per
// item: an optional inline icon on the title row (never a tile above it),
// the title (the item's only heading), one or two sentences. The item count
// must fill every row, so no cell is dead; at 640 to 1023 the grid is 2
// columns when the count is even, else 1. Mixed capabilities belong in a
// BentoGrid instead, and this never repeats in the next section.
import { useId, type ReactNode } from "react";
import { Section, SectionHead, type SectionFrame } from "./Page";

export interface Feature {
  title: ReactNode;
  body: ReactNode;
  /** A koboyo or reicon glyph through <Icon>, 20px, on the title row. */
  icon?: ReactNode;
}

export interface FeatureGridProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  items: Feature[];
  columns?: 2 | 3 | 4;
}

export function FeatureGrid({ title, lead, items, columns = 3, id, tone, rhythm }: FeatureGridProps) {
  const headingId = useId();
  if (items.length < columns || items.length % columns !== 0) {
    throw new Error(`FeatureGrid: ${items.length} items do not fill ${columns} columns; use a multiple of ${columns}`);
  }
  const md = items.length % 2 === 0 ? 2 : 1;
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <SectionHead id={headingId} title={title} lead={lead} />
      <ul className="kit-cells" data-lg={columns} data-md={md}>
        {items.map((f, i) => (
          <li key={i} className="kit-cell">
            <h3 className="kit-title kit-feature-title">
              {f.icon ? (
                <span className="icon" aria-hidden="true">
                  {f.icon}
                </span>
              ) : null}
              <span>{f.title}</span>
            </h3>
            <p className="kit-body">{f.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
