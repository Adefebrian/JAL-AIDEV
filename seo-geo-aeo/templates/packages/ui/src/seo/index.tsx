// packages/ui/src/seo - the answer blocks every public content page shares:
// the FAQ, the key-facts block, the byline and the visible <time>.
//
// Markup rules they encode (standard.md AEO-04 to AEO-06, AEO-11):
// - the FAQ renders each entry as `.faq-item > h3 + p`, and content.test.ts
//   compares exactly that text with the page's FAQPage JSON-LD;
// - a third-party claim carries its source inline, as a link with
//   data-press-id, so the citation sits beside the claim (GEO-07);
// - every date the reader sees is a <time datetime> from the page-dates record.
// Real spaces between inline siblings, never letters split into spans.
// Styling lives in the consuming app on JAL Core tokens; no inline styles.

export interface Source {
  name: string;
  url: string;
  /** Set when the source is a press record; content.test.ts checks it. */
  pressId?: string;
}

export interface KeyFact {
  label: string;
  value: string;
  source?: Source;
}

export interface FaqEntry {
  /** The question as it is typed into an assistant. */
  q: string;
  /** The first sentence answers alone; the rest adds the next detail. */
  a: string;
}

export function SourceLink({ source }: { source: Source }) {
  return (
    <a className="seo-source" href={source.url} data-press-id={source.pressId}>
      {source.name}
    </a>
  );
}

/** " (Outlet)" after a claim; renders nothing without a source. */
export function InlineSource({ source }: { source?: Source }) {
  if (!source) return null;
  return (
    <>
      {" ("}
      <SourceLink source={source} />
      {")"}
    </>
  );
}

export function TimeStamp({ date }: { date: string }) {
  return <time dateTime={date}>{date}</time>;
}

export function Byline({ byLabel, author, updatedLabel, updated }: { byLabel: string; author: string; updatedLabel: string; updated: string }) {
  return (
    <p className="seo-byline">
      {`${byLabel} ${author}. ${updatedLabel} `}
      <TimeStamp date={updated} />
    </p>
  );
}

export function KeyFacts({ heading, facts }: { heading: string; facts: KeyFact[] }) {
  return (
    <section className="seo-keyfacts" aria-labelledby="key-facts-h">
      <h2 id="key-facts-h">{heading}</h2>
      <dl>
        {facts.map((f) => (
          <div key={f.label} className="seo-keyfact">
            <dt>{f.label}</dt>
            <dd>
              {f.value}
              <InlineSource source={f.source} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FaqList({ heading, entries }: { heading: string; entries: FaqEntry[] }) {
  return (
    <section id="faq" className="seo-faq" aria-labelledby="faq-h">
      <h2 id="faq-h">{heading}</h2>
      {entries.map((f) => (
        <div key={f.q} className="faq-item">
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </section>
  );
}
