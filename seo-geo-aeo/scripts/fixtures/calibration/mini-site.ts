// A small bilingual fixture site for the calibration regressions found on
// padelparty.id (2026-09-29): a prerendered crawler view whose language switch
// and footer decide click depth, a venue node every page repeats by @id with
// its offers, a press section beside links to the site's own app subdomain and
// a booking platform, a /youth-academy programme slug, and an "In short" key
// facts block. Structure only; the copy is invented.

import type { FixtureSite } from "../serve.ts";

export type MiniOptions = { origin: string; press: string; variant: "good" | "bad" };

const html = (lang: string, title: string, head: string, body: string) =>
  `<!doctype html><html lang="${lang}"><head><title>${title}</title>${head}</head><body><div id="root">${body}<p>${FILLER}</p></div></body></html>`;

// Keeps every page above the 30-word prerender floor of F-03.
const FILLER = "Rally Padel is a fictional club used only by the audit tests; it has glass courts, a cafe, a small shop and a coaching team, and it is open every day of the week for members and guests alike.";

export function buildMiniSite(o: MiniOptions): FixtureSite {
  const { origin, press, variant } = o;
  const venue = {
    "@type": ["LocalBusiness", "SportsActivityLocation"],
    "@id": `${origin}/#venue`,
    name: "Rally Padel",
    makesOffer: [125000, 175000].map((price) => ({ "@type": "Offer", price, priceCurrency: "IDR" })),
  };
  const ld = (nodes: object[]) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [venue, ...nodes] })}</script>`;
  const footer = (base: string) =>
    variant === "good"
      ? `<footer><a href="${base}/contact">Contact</a> <a href="${base}/privacy">Privacy</a> <a href="${base}/terms">Terms</a></footer>`
      : "";
  const langSwitch = (to: string, lang: string) => (variant === "good" ? `<nav aria-label="Language"><a href="${to}" hreflang="${lang}">${lang.toUpperCase()}</a></nav>` : "");
  const prices = variant === "good" ? "Court hire from Rp 125.000 to Rp 175.000 an hour." : "Court hire from Rp 125.000 an hour.";

  const routes: FixtureSite["routes"] = {
    "/": {
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html("en", "Rally Padel Depok, six glass courts open until midnight", ld([]),
        `${langSwitch("/id", "id")}<h1>Rally Padel Depok</h1><p>${prices}</p>` +
        `<section><h2>In the press</h2><ul><li><a href="${press}/news/opening">Rally Padel opens in Depok</a>, Kabar Depok.</li></ul></section>` +
        `<section><h2>The app</h2><p>Scores live in the app at <a href="https://app.rally.example/">app.rally.example</a>; book on <a href="https://booking.example.org/rally">the booking site</a>.</p></section>` +
        `<nav><a href="/youth-academy">Youth Academy</a> <a href="/about">About</a></nav>${footer("")}`),
    },
    "/about": {
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html("en", "About Rally Padel Depok, the club and its courts", ld([{ "@type": "AboutPage", "@id": `${origin}/about` }]),
        `${langSwitch("/id/about", "id")}<h1>About Rally Padel</h1><p>Six glass courts in Depok since 2026.</p>${footer("")}`),
    },
    "/youth-academy": {
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html("en", "Rally Padel Youth Academy Depok, classes for ages 6 to 16", ld([]),
        `<h1>Youth Academy</h1><p>Weekly classes for ages 6 to 16.</p><section><h2>In short</h2><ul><li>4 classes.</li><li>120 minutes per session.</li></ul></section>${footer("")}`),
    },
    "/id": {
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html("id", "Rally Padel Depok, enam lapangan kaca buka sampai tengah malam", ld([]),
        `${langSwitch("/", "en")}<h1>Rally Padel Depok</h1><p>Sewa lapangan mulai Rp 125.000 per jam.</p><nav><a href="/id/about">Tentang</a></nav>${footer("/id")}`),
    },
    "/id/about": {
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html("id", "Tentang Rally Padel Depok, klub dan lapangannya", ld([]), `<h1>Tentang Rally Padel</h1><p>Enam lapangan kaca di Depok.</p>${footer("/id")}`),
    },
  };
  for (const [path, lang, title] of [["/contact", "en", "Contact"], ["/privacy", "en", "Privacy"], ["/terms", "en", "Terms"], ["/id/contact", "id", "Kontak"], ["/id/privacy", "id", "Privasi"], ["/id/terms", "id", "Ketentuan"]] as const) {
    routes[path] = { headers: { "content-type": "text/html; charset=utf-8" }, body: html(lang, `${title} Rally Padel Depok`, ld([]), `<h1>${title}</h1><p>${title} page.</p>${footer(lang === "id" ? "/id" : "")}`) };
  }
  const locs = ["/", "/about", "/youth-academy", "/id", "/id/about", "/contact", "/privacy", "/terms", "/id/contact", "/id/privacy", "/id/terms"];
  routes["/sitemap.xml"] = {
    headers: { "content-type": "application/xml" },
    body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs.map((l) => `<url><loc>${origin}${l}</loc><lastmod>2026-09-01</lastmod></url>`).join("")}</urlset>`,
  };
  return { routes, notFound: { status: 404, body: "not found" } };
}

export function buildMiniPress(): FixtureSite {
  return { routes: { "/news/opening": { headers: { "content-type": "text/html" }, body: "<html><body><p>Rally Padel opens in Depok.</p></body></html>" } }, notFound: { status: 404, body: "gone" } };
}
