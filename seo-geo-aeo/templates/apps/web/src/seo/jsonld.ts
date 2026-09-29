// apps/web/src/seo/jsonld.ts - BUILD TIME ONLY: the JSON-LD graph per page.
//
// Markup describes only what the page shows (hard law 2): the FAQPage is the
// rendered FAQ, the HowTo is the rendered steps, the offers are the rates
// table. No aggregateRating or Review about the business (hard law 5).
// Standard.md SEO-07, AEO-05, AEO-07, AEO-11, GEO-05.
import {
  BANDS,
  CURRENCY,
  bandHours,
  business,
  bylineAuthor,
  dayRange,
  priceRange,
  type Lang,
} from "@__APP_NAME__/facts";
import type { PageCopy } from "../content/types";

export type Node = Record<string, unknown>;

/** `@type` can be a string or an array: always test with this, never `===`. */
export function isType(node: unknown, type: string): boolean {
  if (!node || typeof node !== "object") return false;
  const t = (node as Node)["@type"];
  return Array.isArray(t) ? t.includes(type) : t === type;
}

const origin = business.website.replace(/\/+$/, "");
const abs = (path: string) => (path === "/" ? `${origin}/` : `${origin}${path}`);
export const IDS = { website: `${origin}/#website`, org: `${origin}/#organization`, place: `${origin}/#place` };

function orgNode(): Node {
  return {
    "@type": business.orgTypes,
    "@id": IDS.org,
    name: business.name,
    alternateName: business.alternateNames,
    url: `${origin}/`,
    email: business.email,
    telephone: business.phone,
    sameAs: business.sameAs,
    knowsAbout: { "@type": "Thing", name: business.topic.name, sameAs: business.topic.sameAs },
  };
}

function placeNode(lang: Lang): Node {
  const a = business.address;
  return {
    "@type": business.placeTypes,
    "@id": IDS.place,
    name: business.name,
    alternateName: business.alternateNames,
    url: `${origin}/`,
    telephone: business.phone,
    email: business.email,
    image: business.ogImage.startsWith("http") ? business.ogImage : `${origin}${business.ogImage}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: a.street,
      addressLocality: a.city,
      addressRegion: a.region,
      postalCode: a.postalCode,
      addressCountry: a.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: business.geo.lat, longitude: business.geo.lng },
    hasMap: [business.maps.shareUrl, business.maps.cidUrl],
    openingHoursSpecification: business.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    priceRange: priceRange(),
    amenityFeature: business.amenities.map((x) => ({ "@type": "LocationFeatureSpecification", name: x[lang], value: true })),
    sameAs: [...business.sameAs, business.bookingUrl, business.communityUrl, business.maps.cidUrl],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: business.name,
      itemListElement: BANDS.map((b) => ({
        "@type": "Offer",
        name: b.name[lang],
        description: `${dayRange(b.days, lang)} ${bandHours(b, lang)}`,
        price: b.pricePerHour,
        priceCurrency: CURRENCY,
      })),
    },
    parentOrganization: { "@id": IDS.org },
  };
}

function websiteNode(lang: Lang): Node {
  return { "@type": "WebSite", "@id": IDS.website, url: `${origin}/`, name: business.name, inLanguage: lang, publisher: { "@id": IDS.org } };
}

function breadcrumb(page: PageCopy, home: PageCopy | undefined): Node {
  const items = [{ name: home?.breadcrumb ?? business.name, url: abs(home?.path ?? "/") }];
  if (page.key !== "home") items.push({ name: page.breadcrumb, url: abs(page.path) });
  return {
    "@type": "BreadcrumbList",
    "@id": `${abs(page.path)}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function pageGraph(page: PageCopy, home: PageCopy | undefined): Node {
  const url = abs(page.path);
  const author = page.byline
    ? business.people.some((p) => p.publish && p.name === page.byline?.author)
      ? { "@type": "Person", name: bylineAuthor() }
      : { "@id": IDS.org }
    : undefined;
  const webPage: Node = {
    "@type": page.key === "contact" ? ["WebPage", "ContactPage"] : "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: page.lang,
    isPartOf: { "@id": IDS.website },
    about: { "@id": IDS.place },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    datePublished: page.published,
    dateModified: page.updated,
    publisher: { "@id": IDS.org },
    ...(author ? { author } : {}),
  };
  const graph: Node[] = [websiteNode(page.lang), orgNode(), placeNode(page.lang), webPage, breadcrumb(page, home)];
  if (page.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      isPartOf: { "@id": `${url}#webpage` },
      inLanguage: page.lang,
      mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  for (const s of page.sections) {
    if (!s.steps) continue;
    graph.push({
      "@type": "HowTo",
      "@id": `${url}#${s.id}`,
      name: s.heading,
      inLanguage: page.lang,
      step: s.steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
