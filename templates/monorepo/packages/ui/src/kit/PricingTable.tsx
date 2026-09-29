// PricingTable: Carbon-structured pricing. Two to four plans in the
// hairline cell grid, one anatomy each: name (the plan's heading), price in
// tabular mono with its unit and period, one summary line, the included
// list, then the action pinned to one baseline across the row. The
// recommended plan is marked by its filled primary action and a surface
// cell (the others sit on layer-1), never by a colored edge or a badge.
// An optional comparison follows as a real table with row and column
// headers; included and not included are words, not color.
import { useId, type ReactNode } from "react";
import { CheckGlyph } from "./glyphs";
import { Figure, Section, SectionHead, type SectionFrame } from "./Page";

export interface Plan {
  name: ReactNode;
  price: ReactNode;
  /** Currency or unit, set small beside the price, for example "IDR". */
  unit?: string;
  period?: ReactNode;
  summary: ReactNode;
  features: ReactNode[];
  action: ReactNode;
  recommended?: boolean;
}

export interface CompareRow {
  label: ReactNode;
  /** One value per plan, in plan order. true and false read as Included and Not included. */
  values: (ReactNode | boolean)[];
}

export interface PricingTableProps extends SectionFrame {
  title: ReactNode;
  lead?: ReactNode;
  plans: Plan[];
  compare?: { caption: ReactNode; rows: CompareRow[] };
  /** Replacement check glyph from koboyo or reicon. */
  check?: ReactNode;
}

function CompareCell({ value, check }: { value: ReactNode | boolean; check: ReactNode }) {
  if (value === true) {
    return (
      <>
        <span className="kit-check" role="img" aria-label="Included">
          {check}
        </span>
      </>
    );
  }
  if (value === false) return <span className="kit-meta">Not included</span>;
  return <>{value}</>;
}

export function PricingTable({ title, lead, plans, compare, check, id, tone, rhythm }: PricingTableProps) {
  const headingId = useId();
  if (plans.length < 2 || plans.length > 4) throw new Error(`PricingTable: ${plans.length} plans; use 2 to 4`);
  if (compare) {
    compare.rows.forEach((r, i) => {
      if (r.values.length !== plans.length) {
        throw new Error(`PricingTable: compare row ${i + 1} has ${r.values.length} values for ${plans.length} plans`);
      }
    });
  }
  const glyph = check ?? <CheckGlyph />;
  const md = plans.length % 2 === 0 ? 2 : 1;
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={headingId}>
      <SectionHead id={headingId} title={title} lead={lead} />
      <ul className="kit-cells" data-plans="" data-lg={plans.length} data-md={md}>
        {plans.map((p, i) => (
          <li key={i} className="kit-cell kit-plan" data-recommended={p.recommended ? "" : undefined}>
            <h3 className="kit-title">{p.name}</h3>
            <p className="kit-plan-price">
              <Figure value={p.price} unit={p.unit} />
              {p.period ? <span className="kit-unit">{" "}{p.period}</span> : null}
            </p>
            <p className="kit-body">{p.summary}</p>
            <ul className="kit-plan-features">
              {p.features.map((f, fi) => (
                <li key={fi}>
                  <span className="kit-check" aria-hidden="true">
                    {glyph}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="kit-plan-action">{p.action}</div>
          </li>
        ))}
      </ul>
      {compare ? (
        <div className="kit-compare scroll-x">
          <table className="kit-compare-table">
            <caption className="kit-title">{compare.caption}</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {plans.map((p, i) => (
                  <th key={i} scope="col">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((r, ri) => (
                <tr key={ri}>
                  <th scope="row">{r.label}</th>
                  {r.values.map((v, vi) => (
                    <td key={vi}>
                      <CompareCell value={v} check={glyph} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Section>
  );
}
