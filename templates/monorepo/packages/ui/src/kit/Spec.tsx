// SpecRail and SpecTable: Carbon-style label and value rows, the data
// identity of every JAL page.
//
// SpecRail   a compact definition list (label in meta ink-muted, value in
//            ink, numbers in tabular mono, units at meta size). Sits inside
//            another composition: a Masthead proof slot, a Split, a CTABand.
// SpecTable  a full section: one heading and lead, then groups of rows. At
//            1024 and up each group name takes columns 1 to 4 and its table
//            5 to 12, rows at the product density (ui.density). A real
//            <table> with row headers, so it reads as data to assistive tech.
import { useId, type ReactNode } from "react";
import { Figure, Section, SectionHead, type SectionFrame } from "./Page";

export interface SpecRow {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  /** A short qualifier under the value, meta size. */
  note?: ReactNode;
  /** Set the value in tabular mono. Default: true when a unit is given or the value is a number. */
  numeric?: boolean;
  /** Marks the one key figure (the direction's signal role). */
  signal?: boolean;
}

function SpecValue({ row }: { row: SpecRow }) {
  const numeric = row.numeric ?? (row.unit !== undefined || typeof row.value === "number");
  return (
    <>
      {numeric ? <Figure value={row.value} unit={row.unit} /> : row.value}
      {row.note ? <span className="kit-spec-note">{row.note}</span> : null}
    </>
  );
}

export interface SpecRailProps {
  rows: SpecRow[];
  /** Accessible name for the list. */
  label?: string;
}

export function SpecRail({ rows, label }: SpecRailProps) {
  return (
    <dl className="kit-spec-rail" aria-label={label}>
      {rows.map((row, i) => (
        <div key={i} className="kit-spec-row" data-signal={row.signal ? "" : undefined}>
          <dt>{row.label}</dt>
          <dd>
            <SpecValue row={row} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface SpecGroup {
  name: ReactNode;
  rows: SpecRow[];
}

export interface SpecTableProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  groups: SpecGroup[];
}

export function SpecTable({ title, lead, groups, id, tone, rhythm }: SpecTableProps) {
  const headingId = useId();
  const groupId = useId();
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <SectionHead id={headingId} title={title} lead={lead} />
      <div className="kit-spec-table">
        {groups.map((g, gi) => (
          <div key={gi} className="kit-spec-group">
            <h3 id={`${groupId}-${gi}`} className="kit-title">
              {g.name}
            </h3>
            <table className="kit-spec-grid" aria-labelledby={`${groupId}-${gi}`}>
              <tbody>
                {g.rows.map((row, ri) => (
                  <tr key={ri} data-signal={row.signal ? "" : undefined}>
                    <th scope="row">{row.label}</th>
                    <td>
                      <SpecValue row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Section>
  );
}
