// apps/web/src/pages/SitePage.tsx - one public content page.
//
// Rendered twice from the SAME props: by the build-time generator
// (renderToString, into dist/seo.json, then inside #root by the server) and by
// the browser (hydrateRoot over that body). So people and crawlers read one
// text (hard law 2). Rendered-text rules (integrate.md 8.2): real spaces
// between inline siblings, no split-letter spans, a sentence under every table.
import type { ReactNode } from "react";
import { AppShell, Byline, FaqList, InlineSource, KeyFacts, TimeStamp } from "@__APP_NAME__/ui";
import type { LinkItem, PageCopy, Section, SiteCopy } from "../content/types";

function Item({ item }: { item: LinkItem }) {
  return (
    <li>
      {item.href ? <a href={item.href}>{item.text}</a> : item.text}
      <InlineSource source={item.source} />
    </li>
  );
}

function SectionView({ section }: { section: Section }) {
  return (
    <section id={section.id} className="site-section" aria-labelledby={`${section.id}-h`}>
      <h2 id={`${section.id}-h`}>{section.heading}</h2>
      {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
      {section.table ? (
        <>
          <div className="site-table-wrap">
            <table className="site-table">
              <caption>{section.table.caption}</caption>
              <thead>
                <tr>
                  {section.table.head.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={i}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="site-table-sentence">{section.table.sentence}</p>
        </>
      ) : null}
      {section.steps ? (
        <ol className="site-steps">
          {section.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : null}
      {section.list ? (
        <ul className="site-list">
          {section.list.map((item) => (
            <Item key={item.text} item={item} />
          ))}
        </ul>
      ) : null}
      {section.quotes?.map((q) => (
        <figure key={q.id} className="site-quote" data-quote-id={q.id}>
          <blockquote cite={q.url}>
            <p>{q.text}</p>
          </blockquote>
          <figcaption>
            {`${q.speaker}, ${q.role}, `}
            <cite>{q.outlet}</cite>
            {", "}
            <TimeStamp date={q.date} />
          </figcaption>
        </figure>
      ))}
    </section>
  );
}

export function SiteFrame({ site, current, children }: { site: SiteCopy; current: string; children: ReactNode }) {
  return (
    <AppShell title={site.brand} destinations={site.nav.map((n) => ({ id: n.key, label: n.label, href: n.href }))} current={current}>
      <div className="site">
        {children}
        <footer className="site-footer">
          <p>{site.footerLine}</p>
          <ul className="site-footer-links">
            {site.footerLinks.map((l) => (
              <li key={l.key}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </AppShell>
  );
}

export function SitePage({ page, site }: { page: PageCopy; site: SiteCopy }) {
  return (
    <SiteFrame site={site} current={page.key}>
      <article className="site-article">
        <header className="site-hero">
          <h1>{page.h1}</h1>
          <p className="site-lead">{page.lead}</p>
          {page.byline ? <Byline byLabel={site.byLabel} author={page.byline.author} updatedLabel={site.updatedLabel} updated={page.updated} /> : null}
        </header>
        {page.keyFacts ? <KeyFacts heading={site.keyFactsHeading} facts={page.keyFacts} /> : null}
        {page.sections.map((s) => (
          <SectionView key={s.id} section={s} />
        ))}
        <FaqList heading={site.faqHeading} entries={page.faq} />
        <p className="site-updated">
          {`${site.updatedLabel} `}
          <TimeStamp date={page.updated} />
        </p>
      </article>
    </SiteFrame>
  );
}

export function NotFoundPage({ site }: { site: SiteCopy }) {
  const home = site.nav.find((n) => n.key === "home")?.href ?? "/";
  return (
    <SiteFrame site={site} current="">
      <article className="site-article">
        <header className="site-hero">
          <h1>{site.notFound.h1}</h1>
          <p className="site-lead">{site.notFound.body}</p>
        </header>
        <p>
          <a className="btn btn-secondary" href={home}>
            {site.notFound.homeLabel}
          </a>
        </p>
      </article>
    </SiteFrame>
  );
}
