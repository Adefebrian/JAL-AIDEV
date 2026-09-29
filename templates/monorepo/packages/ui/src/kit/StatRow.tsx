// StatRow: two to four real figures read side by side. Each is a value in
// tabular mono at the heading step (never a giant display numeral, never a
// hero), its unit at meta size, and one short caption. A structural rule
// sits above each figure. Never the page's first section: a big-number
// hero is banned.
import { useId, type ReactNode } from "react";
import { Figure, Section, SectionHead, type SectionFrame } from "./Page";

export interface Stat {
  value: ReactNode;
  unit?: string;
  caption: ReactNode;
  /** Marks the one key figure (the direction's signal role). */
  signal?: boolean;
}

export interface StatRowProps extends SectionFrame {
  title?: ReactNode;
  lead?: ReactNode;
  /** Accessible name when there is no title. */
  label?: string;
  stats: Stat[];
}

export function StatRow({ title, lead, label, stats, id, tone, rhythm }: StatRowProps) {
  const headingId = useId();
  if (stats.length < 2 || stats.length > 4) {
    throw new Error(`StatRow: ${stats.length} stats; use 2 to 4`);
  }
  return (
    <Section id={id} tone={tone} rhythm={rhythm} labelledBy={title ? headingId : undefined} label={title ? undefined : label}>
      {title ? <SectionHead id={headingId} title={title} lead={lead} /> : null}
      <ul className="kit-stats" data-count={stats.length}>
        {stats.map((s, i) => (
          <li key={i} className="kit-stat" data-signal={s.signal ? "" : undefined}>
            <p className="kit-stat-value">
              <Figure value={s.value} unit={s.unit} />
            </p>
            <p className="kit-body">{s.caption}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
