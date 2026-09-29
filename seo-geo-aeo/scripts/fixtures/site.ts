// Fixture sites for audit.test.ts. A fictional padel club ("Rally Padel",
// Depok), bilingual EN and ID with one untranslated guide, built to pass every
// automatic check. The bad variant applies exactly the seven defects from
// acceptance criterion 6: a short title, a missing canonical, invalid JSON-LD,
// FAQ markup without a visible FAQ, a missing hreflang pair, a missing key
// file and an invalid robots directive (Content-Signal).

import { deflateSync } from "node:zlib";
import type { FixtureResponse, FixtureSite } from "./serve.ts";

export type Variant = "good" | "bad";
export type SiteOptions = { origin: string; press: string; key: string; variant: Variant };

const NAME = "Rally Padel Depok";
const BRAND = "Rally Padel";
const PHONE_LD = "+6281234567890";
const PHONE = "+62 812 3456 7890";
const STREET = "Jalan Margonda Raya 100";
const CID = "https://maps.google.com/?cid=1234567890123456789";
const SHARE = "https://maps.app.goo.gl/rallypadelexample";
const INSTAGRAM = "https://www.instagram.com/rallypadel.example";
const TIKTOK = "https://www.tiktok.com/@rallypadel.example";
const BOOKING = "https://booking.example.com/rally-padel";
const TOPIC = "https://en.wikipedia.org/wiki/Padel_(sport)";
export const QUOTE_OPEN = "The courts were full by seven in the morning.";
export const QUOTE_ACADEMY = "Beginners rallied within their first hour on court.";

type Lang = "en" | "id";
type Kind = "home" | "money" | "about" | "programme" | "guide" | "contact" | "privacy" | "terms";

type PageDef = {
  path: string;
  lang: Lang;
  kind: Kind;
  pair?: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  content: string;
  faq: Array<[string, string]>;
  crumb: string;
  nodes?: (o: string, press: string) => Record<string, unknown>[];
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function keyFacts(lang: Lang, items: string[]): string {
  const label = lang === "en" ? "Key facts" : "Fakta utama";
  return `<section class="key-facts" aria-label="${label}"><h2>${label}</h2><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></section>`;
}

function quote(press: string, slug: string, text: string, who: string): string {
  return `<figure><blockquote cite="${press}/news/${slug}"><p>${text}</p></blockquote><figcaption>${who}, <cite>Kabar Depok</cite>, 12 September 2026</figcaption></figure>`;
}

function rateTable(lang: Lang): string {
  const h = lang === "en" ? ["Band", "Hours", "Price per hour"] : ["Waktu", "Jam", "Harga per jam"];
  const rows = lang === "en"
    ? [["Day", "06:00 to 16:00", "Rp 150.000"], ["Evening", "16:00 to 23:59", "Rp 250.000"], ["Weekend", "06:00 to 23:59", "Rp 300.000"]]
    : [["Siang", "06.00 sampai 16.00", "Rp 150.000"], ["Malam", "16.00 sampai 23.59", "Rp 250.000"], ["Akhir pekan", "06.00 sampai 23.59", "Rp 300.000"]];
  const sentence = lang === "en"
    ? "Day play costs Rp 150.000 per hour from 06:00 to 16:00, evening play costs Rp 250.000 per hour from 16:00 to 23:59, and weekends cost Rp 300.000 per hour."
    : "Main siang Rp 150.000 per jam pukul 06.00 sampai 16.00, main malam Rp 250.000 per jam pukul 16.00 sampai 23.59, dan akhir pekan Rp 300.000 per jam.";
  return `<h2>${lang === "en" ? "Rates by time band" : "Harga per waktu main"}</h2><table><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table><p>${sentence}</p>`;
}

function offerCatalog(o: string, lang: Lang): Record<string, unknown> {
  const names = lang === "en" ? ["Day court hour", "Evening court hour", "Weekend court hour", "Racket rental"] : ["Jam lapangan siang", "Jam lapangan malam", "Jam lapangan akhir pekan", "Sewa raket"];
  const prices = [150000, 250000, 300000, 25000];
  return {
    "@type": "OfferCatalog",
    "@id": `${o}${lang === "en" ? "" : "/id"}/rates#catalog`,
    name: lang === "en" ? "Court rates" : "Harga lapangan",
    itemListElement: names.map((n, i) => ({ "@type": "Offer", name: n, price: prices[i], priceCurrency: "IDR" })),
  };
}

function course(o: string, lang: Lang): Record<string, unknown> {
  return {
    "@type": "Course",
    "@id": `${o}${lang === "en" ? "" : "/id"}/programme#course`,
    name: lang === "en" ? "Beginner padel course" : "Kursus padel pemula",
    description: lang === "en" ? "An 8 week course for 4 players per group." : "Kursus 8 minggu untuk 4 pemain per grup.",
    provider: { "@id": `${o}/#org` },
    hasCourseInstance: [{ "@type": "CourseInstance", courseMode: "onsite", courseWorkload: "PT90M", courseSchedule: { "@type": "Schedule", repeatFrequency: "P1W", duration: "PT90M" } }],
  };
}

function pages(): PageDef[] {
  return [
    {
      path: "/", lang: "en", kind: "home", pair: "/id", crumb: "Home",
      title: "Rally Padel, the Padel Club in Depok on Jalan Margonda Raya",
      description: "Rally Padel in Depok has 4 padel courts open 06:00 to 23:59 daily, from Rp 150.000 per hour. See rates, classes, the beginner guide and how to book.",
      h1: "Padel courts in Depok, open every day",
      lead: "Rally Padel is a padel club on Jalan Margonda Raya 100 in Depok with 4 courts, open from 06:00 to 23:59 every day.",
      content: `<img src="/img/hero.webp" alt="Four padel courts at Rally Padel in Depok" width="1200" height="600"><h2>Courts, classes and a cafe</h2><p>Book a court from Rp 150.000 per hour, join the academy, or read the beginner guide before your first game.</p>`,
      faq: [
        ["Where can I play padel in Depok?", "You can play at Rally Padel on Jalan Margonda Raya 100, Depok. The club has 4 courts and opens at 06:00."],
        ["How much does a padel court cost in Depok?", "A court at Rally Padel costs Rp 150.000 per hour before 16:00. Evening hours cost Rp 250.000."],
      ],
    },
    {
      path: "/rates", lang: "en", kind: "money", pair: "/id/rates", crumb: "Rates",
      title: "Padel Prices in Depok, Court Rates at Rally Padel Margonda",
      description: "Padel court rates in Depok start at Rp 150.000 per hour from 06:00 to 16:00 and Rp 250.000 after 16:00. Racket rental costs Rp 25.000 per session.",
      h1: "Padel court rates in Depok",
      lead: "A court costs Rp 150.000 per hour from 06:00 to 16:00 and Rp 250.000 per hour from 16:00 to 23:59.",
      content: keyFacts("en", ["Rp 150.000 per hour, 06:00 to 16:00", "Rp 250.000 per hour, 16:00 to 23:59", "Rp 25.000 racket rental", "4 courts, 60 minute slots"]) + rateTable("en"),
      faq: [
        ["What is the cheapest time to play padel at Rally Padel?", "The cheapest time is 06:00 to 16:00 on weekdays, at Rp 150.000 per hour. Evenings cost Rp 250.000 per hour."],
        ["Can I rent a racket at Rally Padel?", "Yes, a racket costs Rp 25.000 per session. Balls are included with every court booking."],
      ],
      nodes: (o) => [offerCatalog(o, "en")],
    },
    {
      path: "/about", lang: "en", kind: "about", pair: "/id/about", crumb: "About",
      title: "About Rally Padel: Four Padel Courts in Depok, Margonda",
      description: "Rally Padel opened in Depok on 1 August 2026 with 4 courts, 6 coaches and a cafe. Read the story, the key facts and what the local press reported.",
      h1: "About Rally Padel",
      lead: "Rally Padel opened on 1 August 2026 in Depok with 4 padel courts, 6 coaches and a cafe beside the courts.",
      content: "",
      faq: [
        ["When did Rally Padel open?", "Rally Padel opened on 1 August 2026. It is on Jalan Margonda Raya 100 in Depok."],
        ["How many courts does Rally Padel have?", "Rally Padel has 4 panoramic courts. Each court is booked in 60 minute slots."],
      ],
    },
    {
      path: "/programme", lang: "en", kind: "programme", pair: "/id/programme", crumb: "Academy",
      title: "Padel Academy in Depok: Classes and Coaches at Rally Padel",
      description: "The Rally Padel academy in Depok runs beginner classes of 4 players for 8 weeks, Rp 1.200.000 per player, with 6 coaches. See levels, ages and dates.",
      h1: "Padel classes in Depok",
      lead: "The academy runs 8 week beginner classes for 4 players per group, at Rp 1.200.000 per player.",
      content: "",
      faq: [
        ["How long is a beginner padel course?", "A beginner course lasts 8 weeks with one 90 minute class per week. Groups have 4 players."],
        ["What age can children join the academy?", "Children can join from age 12. Younger players can book a private lesson."],
      ],
      nodes: (o) => [course(o, "en")],
    },
    {
      path: "/guide", lang: "en", kind: "guide", crumb: "Guide",
      title: "Play Padel in Depok: Beginner Guide at Rally Padel Margonda",
      description: "How to play padel in Depok for the first time: book a 60 minute court, rent a racket for Rp 25.000, learn the serve and the walls. A guide in 4 steps.",
      h1: "How to play padel for the first time",
      lead: "To play padel for the first time, book a 60 minute court, rent a racket and learn the underhand serve.",
      content: `<p class="byline">By Rina Kusuma, head coach. Updated <time datetime="2026-09-20">20 September 2026</time>.</p><h2>Four steps for your first game</h2><ol><li><strong>Book a 60 minute court.</strong> Book on WhatsApp or at the desk.</li><li><strong>Rent a racket.</strong> A racket costs Rp 25.000 per session.</li><li><strong>Learn the underhand serve.</strong> Bounce the ball and hit below the waist.</li><li><strong>Play the ball off the walls.</strong> Let it come back before you return it.</li></ol>`,
      faq: [
        ["Do I need experience to play padel?", "No, you do not need experience. A first session of 60 minutes is enough to learn the serve."],
        ["What should I wear to play padel?", "Wear sports shoes with flat soles and light clothes. The club lends rackets for Rp 25.000."],
      ],
      nodes: (o) => [
        {
          "@type": "HowTo",
          "@id": `${o}/guide#howto`,
          name: "How to play padel for the first time",
          step: ["Book a 60 minute court", "Rent a racket", "Learn the underhand serve", "Play the ball off the walls"].map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s })),
        },
        {
          "@type": "Article",
          "@id": `${o}/guide#article`,
          headline: "How to play padel for the first time",
          author: { "@type": "Person", name: "Rina Kusuma", jobTitle: "Head coach" },
          publisher: { "@id": `${o}/#org` },
          datePublished: "2026-09-01",
          dateModified: "2026-09-20",
        },
      ],
    },
    {
      path: "/contact", lang: "en", kind: "contact", pair: "/id/contact", crumb: "Contact",
      title: "Contact Rally Padel Depok: WhatsApp, Address and Hours",
      description: "Contact Rally Padel in Depok on WhatsApp +62 812 3456 7890, visit Jalan Margonda Raya 100, open 06:00 to 23:59 daily. Parking for 40 cars.",
      h1: "Contact Rally Padel",
      lead: `Message Rally Padel on WhatsApp at ${PHONE} or visit ${STREET}, Depok, from 06:00 to 23:59.`,
      content: `<h2>Address and hours</h2><address>${STREET}, Depok, Jawa Barat 16424. Open 06:00 to 23:59 every day.</address>`,
      faq: [
        ["Is there parking at Rally Padel?", "Yes, there is parking for 40 cars. Motorbike parking is beside the entrance."],
        ["How do I book a court at Rally Padel?", `Book a court on WhatsApp at ${PHONE}. Bookings open 14 days ahead.`],
      ],
      nodes: (o) => [{ "@type": "ContactPage", "@id": `${o}/contact#page`, name: "Contact Rally Padel", about: { "@id": `${o}/#place` } }],
    },
    {
      path: "/privacy", lang: "en", kind: "privacy", pair: "/id/privacy", crumb: "Privacy",
      title: "Privacy Policy of Rally Padel Depok, Data We Collect Online",
      description: "The Rally Padel Depok privacy policy lists the data the booking form collects, name and WhatsApp number, why we keep it for 12 months and your rights.",
      h1: "Privacy policy",
      lead: "Rally Padel collects your name and WhatsApp number when you book, and keeps them for 12 months.",
      content: "<h2>What the booking form collects</h2><p>The booking form asks for your name and WhatsApp number. We use them only to confirm your booking and delete them after 12 months.</p>",
      faq: [],
    },
    {
      path: "/terms", lang: "en", kind: "terms", pair: "/id/terms", crumb: "Terms",
      title: "Terms of Use for Rally Padel Depok Bookings and Court Visits",
      description: "Terms for booking and using Rally Padel courts in Depok: cancellation up to 24 hours ahead, 60 minute slots, sports shoes required on every court.",
      h1: "Terms of use",
      lead: "Bookings can be cancelled up to 24 hours ahead, and every slot lasts 60 minutes.",
      content: "<h2>Booking and cancellation</h2><p>Cancel up to 24 hours before your slot for a full refund. Sports shoes with flat soles are required on every court.</p>",
      faq: [],
    },
    {
      path: "/id", lang: "id", kind: "home", pair: "/", crumb: "Beranda",
      title: "Rally Padel, Klub Padel di Depok, di Jalan Margonda Raya",
      description: "Rally Padel di Depok punya 4 lapangan padel, buka 06.00 sampai 23.59 setiap hari, mulai Rp 150.000 per jam. Lihat harga, kelas dan cara booking.",
      h1: "Lapangan padel di Depok, buka setiap hari",
      lead: "Rally Padel adalah klub padel di Jalan Margonda Raya 100, Depok, dengan 4 lapangan, buka 06.00 sampai 23.59 setiap hari.",
      content: "<h2>Lapangan, kelas dan kafe</h2><p>Sewa lapangan mulai Rp 150.000 per jam, ikut akademi, atau baca panduan pemula sebelum main pertama.</p>",
      faq: [
        ["Di mana tempat main padel di Depok?", "Anda bisa main di Rally Padel, Jalan Margonda Raya 100, Depok. Klub ini punya 4 lapangan dan buka pukul 06.00."],
        ["Berapa harga sewa lapangan padel di Depok?", "Sewa lapangan di Rally Padel Rp 150.000 per jam sebelum 16.00. Malam hari Rp 250.000 per jam."],
      ],
    },
    {
      path: "/id/rates", lang: "id", kind: "money", pair: "/rates", crumb: "Harga",
      title: "Harga Padel di Depok, Tarif Lapangan Rally Padel Margonda",
      description: "Tarif lapangan padel di Depok mulai Rp 150.000 per jam pukul 06.00 sampai 16.00 dan Rp 250.000 setelah 16.00. Sewa raket Rp 25.000 per sesi.",
      h1: "Harga lapangan padel di Depok",
      lead: "Sewa lapangan Rp 150.000 per jam pukul 06.00 sampai 16.00 dan Rp 250.000 per jam pukul 16.00 sampai 23.59.",
      content: keyFacts("id", ["Rp 150.000 per jam, 06.00 sampai 16.00", "Rp 250.000 per jam, 16.00 sampai 23.59", "Rp 25.000 sewa raket", "4 lapangan, slot 60 menit"]) + rateTable("id"),
      faq: [
        ["Jam berapa main padel paling murah di Rally Padel?", "Paling murah pukul 06.00 sampai 16.00 pada hari kerja, Rp 150.000 per jam. Malam hari Rp 250.000 per jam."],
        ["Apakah bisa sewa raket di Rally Padel?", "Ya, sewa raket Rp 25.000 per sesi. Bola sudah termasuk dalam setiap booking."],
      ],
      nodes: (o) => [offerCatalog(o, "id")],
    },
    {
      path: "/id/about", lang: "id", kind: "about", pair: "/about", crumb: "Tentang",
      title: "Tentang Rally Padel: Empat Lapangan Padel di Depok Margonda",
      description: "Rally Padel dibuka di Depok pada 1 Agustus 2026 dengan 4 lapangan, 6 pelatih dan kafe. Baca kisahnya, fakta utama dan liputan media lokal tentang kami.",
      h1: "Tentang Rally Padel",
      lead: "Rally Padel dibuka pada 1 Agustus 2026 di Depok dengan 4 lapangan padel, 6 pelatih dan kafe di samping lapangan.",
      content: "",
      faq: [
        ["Kapan Rally Padel dibuka?", "Rally Padel dibuka pada 1 Agustus 2026. Lokasinya di Jalan Margonda Raya 100, Depok."],
        ["Berapa jumlah lapangan di Rally Padel?", "Rally Padel punya 4 lapangan panorama. Setiap lapangan dipesan per slot 60 menit."],
      ],
    },
    {
      path: "/id/programme", lang: "id", kind: "programme", pair: "/programme", crumb: "Akademi",
      title: "Akademi Padel di Depok: Kelas dan Pelatih di Rally Padel",
      description: "Akademi Rally Padel di Depok membuka kelas pemula 4 pemain selama 8 minggu, Rp 1.200.000 per pemain, dengan 6 pelatih. Lihat level, usia dan jadwal.",
      h1: "Kelas padel di Depok",
      lead: "Akademi membuka kelas pemula 8 minggu untuk 4 pemain per grup, Rp 1.200.000 per pemain.",
      content: "",
      faq: [
        ["Berapa lama kursus padel pemula?", "Kursus pemula berlangsung 8 minggu dengan satu kelas 90 menit per minggu. Setiap grup 4 pemain."],
        ["Mulai usia berapa anak bisa ikut akademi?", "Anak bisa ikut mulai usia 12 tahun. Pemain yang lebih muda bisa pesan kelas privat."],
      ],
      nodes: (o) => [course(o, "id")],
    },
    {
      path: "/id/contact", lang: "id", kind: "contact", pair: "/contact", crumb: "Kontak",
      title: "Kontak Rally Padel Depok: WhatsApp, Alamat dan Jam Buka",
      description: "Hubungi Rally Padel di Depok lewat WhatsApp +62 812 3456 7890, datang ke Jalan Margonda Raya 100, buka 06.00 sampai 23.59 setiap hari. Parkir 40 mobil.",
      h1: "Kontak Rally Padel",
      lead: `Kirim pesan ke Rally Padel lewat WhatsApp ${PHONE} atau datang ke ${STREET}, Depok, pukul 06.00 sampai 23.59.`,
      content: `<h2>Alamat dan jam buka</h2><address>${STREET}, Depok, Jawa Barat 16424. Buka 06.00 sampai 23.59 setiap hari.</address>`,
      faq: [
        ["Apakah ada parkir di Rally Padel?", "Ya, ada parkir untuk 40 mobil. Parkir motor ada di samping pintu masuk."],
        ["Bagaimana cara booking lapangan di Rally Padel?", `Booking lapangan lewat WhatsApp ${PHONE}. Booking dibuka 14 hari sebelumnya.`],
      ],
      nodes: (o) => [{ "@type": "ContactPage", "@id": `${o}/id/contact#page`, name: "Kontak Rally Padel", about: { "@id": `${o}/#place` } }],
    },
    {
      path: "/id/privacy", lang: "id", kind: "privacy", pair: "/privacy", crumb: "Privasi",
      title: "Kebijakan Privasi Rally Padel Depok, Data yang Kami Simpan",
      description: "Kebijakan privasi Rally Padel Depok menjelaskan data yang dikumpulkan formulir booking, nama dan nomor WhatsApp, masa simpan 12 bulan dan hak Anda.",
      h1: "Kebijakan privasi",
      lead: "Rally Padel mengumpulkan nama dan nomor WhatsApp Anda saat booking, dan menyimpannya selama 12 bulan.",
      content: "<h2>Data dari formulir booking</h2><p>Formulir booking meminta nama dan nomor WhatsApp. Data hanya dipakai untuk konfirmasi booking dan dihapus setelah 12 bulan.</p>",
      faq: [],
    },
    {
      path: "/id/terms", lang: "id", kind: "terms", pair: "/terms", crumb: "Syarat",
      title: "Syarat Penggunaan Rally Padel Depok untuk Booking Lapangan",
      description: "Syarat booking dan penggunaan lapangan Rally Padel di Depok: pembatalan paling lambat 24 jam sebelumnya, slot 60 menit, wajib sepatu olahraga.",
      h1: "Syarat penggunaan",
      lead: "Booking bisa dibatalkan paling lambat 24 jam sebelumnya, dan setiap slot berlangsung 60 menit.",
      content: "<h2>Booking dan pembatalan</h2><p>Batalkan paling lambat 24 jam sebelum slot untuk pengembalian dana penuh. Sepatu olahraga bersol datar wajib di setiap lapangan.</p>",
      faq: [],
    },
  ];
}

function withPress(defs: PageDef[], press: string): PageDef[] {
  for (const d of defs) {
    if (d.kind === "about") {
      const para = d.lang === "en"
        ? `<h2>The first month on Margonda</h2><p>The club filled its morning slots in its first month, as <a href="${press}/news/rally-padel-opens">Kabar Depok reported</a> on 12 September 2026.</p>`
        : `<h2>Bulan pertama di Margonda</h2><p>Slot pagi penuh pada bulan pertama, seperti <a href="${press}/news/rally-padel-opens">diberitakan Kabar Depok</a> pada 12 September 2026.</p>`;
      d.content = keyFacts(d.lang, d.lang === "en" ? ["Opened 1 August 2026", "4 courts", "6 coaches", "Open 06:00 to 23:59"] : ["Dibuka 1 Agustus 2026", "4 lapangan", "6 pelatih", "Buka 06.00 sampai 23.59"]) + para + quote(press, "rally-padel-opens", QUOTE_OPEN, "Sari Wulandari, reporter");
    }
    if (d.kind === "programme") {
      const para = d.lang === "en"
        ? `<h2>Levels and coaches</h2><p>Classes run for beginners and improvers, and <a href="${press}/news/academy">Kabar Depok visited a class</a> in September 2026.</p>`
        : `<h2>Level dan pelatih</h2><p>Kelas tersedia untuk pemula dan menengah, dan <a href="${press}/news/academy">Kabar Depok meliput satu kelas</a> pada September 2026.</p>`;
      d.content = keyFacts(d.lang, d.lang === "en" ? ["8 weeks per course", "4 players per group", "Rp 1.200.000 per player", "Ages 12 and up"] : ["8 minggu per kursus", "4 pemain per grup", "Rp 1.200.000 per pemain", "Usia 12 tahun ke atas"]) + para + quote(press, "academy", QUOTE_ACADEMY, "Sari Wulandari, reporter");
    }
  }
  return defs;
}

function checkLengths(defs: PageDef[]): void {
  for (const d of defs) {
    const t = [...d.title].length;
    const ds = [...d.description].length;
    if (t < 50 || t > 60) throw new Error(`fixture title ${d.path} is ${t} characters`);
    if (ds < 120 || ds > 158) throw new Error(`fixture description ${d.path} is ${ds} characters`);
  }
}

const ENGLISH_NAV: Array<[string, string]> = [["/", "Home"], ["/rates", "Rates"], ["/about", "About"], ["/programme", "Academy"], ["/guide", "Guide"], ["/contact", "Contact"]];
const INDONESIAN_NAV: Array<[string, string]> = [["/id", "Beranda"], ["/id/rates", "Harga"], ["/id/about", "Tentang"], ["/id/programme", "Akademi"], ["/guide", "Panduan"], ["/id/contact", "Kontak"]];

function nav(d: PageDef): string {
  const items = d.lang === "en" ? ENGLISH_NAV : INDONESIAN_NAV;
  const switchTo = d.pair ?? (d.lang === "en" ? "/id" : "/");
  const switchLabel = d.lang === "en" ? "Bahasa Indonesia" : "English";
  return `<header><nav>${items.map(([h, l]) => `<a href="${h}">${l}</a>`).join(" ")} <a href="${switchTo}" hreflang="${d.lang === "en" ? "id" : "en"}">${switchLabel}</a></nav></header>`;
}

function footer(d: PageDef): string {
  const base = d.lang === "en" ? "" : "/id";
  const labels = d.lang === "en" ? ["Contact", "Privacy", "Terms"] : ["Kontak", "Privasi", "Syarat"];
  return `<footer><p>${BRAND}, ${STREET}, Depok. WhatsApp ${PHONE}.</p><a href="${base}/contact">${labels[0]}</a> <a href="${base}/privacy">${labels[1]}</a> <a href="${base}/terms">${labels[2]}</a> <a href="${INSTAGRAM}">Instagram</a></footer>`;
}

function faqHtml(d: PageDef): string {
  if (d.faq.length === 0) return "";
  const heading = d.lang === "en" ? "Frequently asked questions" : "Pertanyaan yang sering diajukan";
  return `<section class="faq"><h2>${heading}</h2>${d.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>`;
}

function placeNode(o: string): Record<string, unknown> {
  return {
    "@type": ["LocalBusiness", "SportsActivityLocation"],
    "@id": `${o}/#place`,
    name: NAME,
    alternateName: ["Rally Padel Margonda", "Rally Padel Club"],
    url: `${o}/`,
    telephone: PHONE_LD,
    image: `${o}/og.png`,
    address: { "@type": "PostalAddress", streetAddress: STREET, addressLocality: "Depok", addressRegion: "Jawa Barat", postalCode: "16424", addressCountry: "ID" },
    geo: { "@type": "GeoCoordinates", latitude: -6.3701, longitude: 106.8326 },
    hasMap: [SHARE, CID],
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "06:00", closes: "23:59" }],
    priceRange: "Rp 150.000 to Rp 300.000",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Parking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Cafe", value: true },
    ],
    sameAs: [INSTAGRAM, TIKTOK, BOOKING, CID],
    knowsAbout: [TOPIC],
  };
}

function graph(d: PageDef, o: string, press: string): Record<string, unknown> {
  const url = `${o}${d.path}`;
  const home = d.lang === "en" ? `${o}/` : `${o}/id`;
  const crumbs = d.kind === "home"
    ? [{ "@type": "ListItem", position: 1, name: d.crumb, item: home }]
    : [{ "@type": "ListItem", position: 1, name: d.lang === "en" ? "Home" : "Beranda", item: home }, { "@type": "ListItem", position: 2, name: d.crumb, item: url }];
  const nodes: Record<string, unknown>[] = [
    { "@type": "WebSite", "@id": `${o}/#website`, url: `${o}/`, name: NAME, inLanguage: d.lang, publisher: { "@id": `${o}/#org` } },
    { "@type": ["Organization", "SportsOrganization"], "@id": `${o}/#org`, name: BRAND, url: `${o}/`, logo: `${o}/icon-192.png`, sameAs: [INSTAGRAM, TIKTOK], sport: TOPIC },
    placeNode(o),
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: crumbs },
  ];
  if (d.faq.length) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: d.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    });
  }
  nodes.push(...(d.nodes?.(o, press) ?? []));
  return { "@context": "https://schema.org", "@graph": nodes };
}

type Defect = {
  shortTitle?: boolean;
  noCanonical?: boolean;
  invalidLd?: boolean;
  hiddenFaq?: boolean;
  noReturnHreflang?: boolean;
};

function renderPage(d: PageDef, o: string, press: string, defect: Defect): string {
  const url = `${o}${d.path}`;
  const pairUrl = d.pair ? `${o}${d.pair}` : undefined;
  const enUrl = d.lang === "en" ? url : pairUrl;
  const idUrl = d.lang === "id" ? url : pairUrl;
  const hreflang = pairUrl && !defect.noReturnHreflang
    ? `<link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="id" href="${idUrl}"><link rel="alternate" hreflang="x-default" href="${enUrl}">`
    : "";
  const locale = d.lang === "en" ? "en_US" : "id_ID";
  const altLocale = pairUrl ? `<meta property="og:locale:alternate" content="${d.lang === "en" ? "id_ID" : "en_US"}">` : "";
  const title = defect.shortTitle ? "About" : d.title;
  const ldText = JSON.stringify(graph(d, o, press));
  const ld = defect.invalidLd ? ldText.replace(/\}$/, ",}") : ldText;
  const canonical = defect.noCanonical ? "" : `<link rel="canonical" href="${url}">`;
  const preload = d.kind === "home" && d.lang === "en" ? `<link rel="preload" as="image" href="/img/hero.webp" fetchpriority="high">` : "";
  const faq = defect.hiddenFaq ? "" : faqHtml(d);
  return `<!doctype html>
<html lang="${d.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(d.description)}">
${canonical}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${esc(d.title)}">
<meta property="og:description" content="${esc(d.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${o}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${locale}">
${altLocale}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(d.title)}">
<meta name="twitter:description" content="${esc(d.description)}">
<meta name="twitter:image" content="${o}/og.png">
${hreflang}
<link rel="alternate" type="text/markdown" title="llms.txt" href="/llms.txt">
<link rel="alternate" type="application/rss+xml" title="${NAME}" href="/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
${preload}
<link rel="stylesheet" href="/assets/index-b5c6d7e8.css">
<script type="module" src="/assets/index-a1b2c3d4.js"></script>
<script type="application/ld+json">${ld}</script>
</head>
<body>
<div id="root">
${nav(d)}
<main>
<h1>${esc(d.h1)}</h1>
<p>${esc(d.lead)}</p>
${d.content}
${faq}
</main>
${footer(d)}
</div>
</body>
</html>`;
}

export function makePng(width: number, height: number): Uint8Array {
  const crcTable = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf: Uint8Array) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunkBytes = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out.set(new TextEncoder().encode(type), 4);
    out.set(data, 8);
    view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
    return out;
  };
  const ihdr = new Uint8Array(13);
  const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, width);
  iv.setUint32(4, height);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const raw = new Uint8Array((width * 3 + 1) * height).fill(255);
  for (let y = 0; y < height; y++) raw[y * (width * 3 + 1)] = 0;
  const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunkBytes("IHDR", ihdr), chunkBytes("IDAT", new Uint8Array(deflateSync(raw))), chunkBytes("IEND", new Uint8Array())];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    png.set(p, off);
    off += p.length;
  }
  return png;
}

const ROBOTS_NAMED = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Googlebot", "Google-Extended", "GoogleOther", "bingbot", "Applebot", "Applebot-Extended", "meta-externalagent", "meta-externalfetcher", "FacebookBot", "Amazonbot", "Bytespider", "DuckAssistBot", "YouBot", "cohere-ai", "MistralAI-User", "CCBot", "Baiduspider", "YandexBot", "PetalBot"];

function robotsTxt(o: string, invalid: boolean): string {
  return [
    `# ${BRAND}, ${new URL(o).host}. Every crawler is welcome on the public pages; the named groups`,
    "# exist so a reader can see the answer without inferring it.",
    "",
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    ...(invalid ? ["Content-Signal: search=yes, ai-input=yes, ai-train=no"] : []),
    "",
    ...ROBOTS_NAMED.map((n) => `User-agent: ${n}`),
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "",
    "# AI use policy: /.well-known/ai.txt (not a robots directive; parsers reject unknown ones)",
    `Sitemap: ${o}/sitemap.xml`,
    "# For assistants: /llms.txt, /llms-full.txt, /ai/summary.json, /ai/faq.json, /feed.xml",
    "",
  ].join("\n");
}

function sitemapXml(defs: PageDef[], o: string, dropPairOn?: string): string {
  const entries = defs.map((d) => {
    const url = `${o}${d.path}`;
    let alts = "";
    if (d.pair && d.path !== dropPairOn) {
      const en = d.lang === "en" ? url : `${o}${d.pair}`;
      const id = d.lang === "id" ? url : `${o}${d.pair}`;
      alts = `<xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="id" href="${id}"/><xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>`;
    }
    return `<url><loc>${url}</loc><lastmod>2026-09-20</lastmod>${alts}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
}

function llmsTxt(o: string, full: boolean): string {
  const lines = [
    `# ${BRAND}`,
    "",
    `> Padel club in Depok with 4 courts. At ${STREET}, Depok. Open 06:00 to 23:59. From Rp 150.000 per hour.`,
    "> Officially opened 1 August 2026.",
    "",
    "Also known as: Rally Padel Margonda, Rally Padel Club.",
    `Languages: English (default, ${o}/) and Indonesian (${o}/id).`,
    "",
    "## Quick facts",
    `- Name: ${NAME}`,
    `- Address: ${STREET}, Depok, Jawa Barat 16424`,
    `- WhatsApp: ${PHONE}`,
    "- Hours: 06:00 to 23:59 every day",
    "",
    "## Rates (with the clock hours of each band)",
    "- Day, 06:00 to 16:00: Rp 150.000 per hour",
    "- Evening, 16:00 to 23:59: Rp 250.000 per hour",
    "",
    "## Pages (English) / Halaman berbahasa Indonesia",
    `- ${o}/rates`,
    `- ${o}/id/rates`,
    "",
    "## How to cite",
    `Cite ${NAME} with ${o}/.`,
  ];
  if (full) lines.push("", "## Programmes", "- Beginner course: 8 weeks, 4 players per group, Rp 1.200.000 per player");
  return lines.join("\n") + "\n";
}

export function buildSite(opts: SiteOptions): FixtureSite {
  const o = opts.origin;
  const bad = opts.variant === "bad";
  const defs = withPress(pages(), opts.press);
  checkLengths(defs);
  const html = { "content-type": "text/html; charset=utf-8" };
  const text = { "content-type": "text/plain; charset=utf-8" };
  const json = { "content-type": "application/json; charset=utf-8" };
  const routes: Record<string, FixtureResponse> = {};
  for (const d of defs) {
    const defect: Defect = bad
      ? {
          shortTitle: d.path === "/about",
          noCanonical: d.path === "/rates",
          invalidLd: d.path === "/programme",
          hiddenFaq: d.path === "/contact",
          noReturnHreflang: d.path === "/id/rates",
        }
      : {};
    routes[d.path] = { headers: html, body: renderPage(d, o, opts.press, defect) };
  }
  routes["/robots.txt"] = { headers: text, body: robotsTxt(o, bad) };
  routes["/sitemap.xml"] = { headers: { "content-type": "application/xml; charset=utf-8" }, body: sitemapXml(defs, o, bad ? "/id/rates" : undefined) };
  routes["/llms.txt"] = { headers: text, body: llmsTxt(o, false) };
  routes["/.well-known/llms.txt"] = { headers: text, body: llmsTxt(o, false) };
  routes["/llms-full.txt"] = { headers: text, body: llmsTxt(o, true) };
  routes["/.well-known/ai.txt"] = { headers: text, body: `# AI use policy for ${NAME}\nContent-Signal: search=yes, ai-input=yes, ai-train=no\n` };
  routes["/ai/summary.json"] = { headers: json, body: JSON.stringify({ name: NAME, url: `${o}/`, telephone: PHONE_LD, address: STREET, hours: "06:00 to 23:59" }) };
  routes["/ai/faq.json"] = {
    headers: json,
    body: JSON.stringify({ questions: defs.flatMap((d) => d.faq.map(([q, a]) => ({ url: `${o}${d.path}`, question: q, answer: a }))) }),
  };
  routes["/feed.xml"] = {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
    body: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${NAME}</title><link>${o}/</link><description>Updates from ${NAME}</description><item><title>How to play padel for the first time</title><link>${o}/guide</link><pubDate>Sun, 20 Sep 2026 08:00:00 GMT</pubDate></item></channel></rss>`,
  };
  if (!bad) routes[`/${opts.key}.txt`] = { headers: text, body: opts.key };
  routes["/manifest.webmanifest"] = {
    headers: { "content-type": "application/manifest+json" },
    body: JSON.stringify({ name: NAME, short_name: BRAND, start_url: "/", display: "browser", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] }),
  };
  const png = makePng(1200, 630);
  routes["/og.png"] = { headers: { "content-type": "image/png" }, body: png };
  routes["/icon-192.png"] = { headers: { "content-type": "image/png" }, body: makePng(192, 192) };
  routes["/apple-touch-icon.png"] = { headers: { "content-type": "image/png" }, body: makePng(180, 180) };
  routes["/favicon.ico"] = { headers: { "content-type": "image/x-icon" }, body: new Uint8Array([0, 0, 1, 0]) };
  routes["/img/hero.webp"] = { headers: { "content-type": "image/webp" }, body: new Uint8Array([0x52, 0x49, 0x46, 0x46]) };
  routes["/assets/index-a1b2c3d4.js"] = {
    headers: { "content-type": "text/javascript; charset=utf-8", "x-robots-tag": "noindex" },
    body: 'document.documentElement.dataset.ready="1";\n',
  };
  routes["/assets/index-b5c6d7e8.css"] = { headers: { "content-type": "text/css; charset=utf-8", "x-robots-tag": "noindex" }, body: "body{margin:0}\n" };
  routes["/admin"] = {
    headers: { ...html, "x-robots-tag": "noindex, nofollow" },
    body: `<!doctype html><html lang="en"><head><meta name="robots" content="noindex, nofollow"><title>Rally Padel staff sign in</title></head><body><div id="root"></div></body></html>`,
  };
  const notFound: FixtureResponse = {
    status: 404,
    headers: html,
    body: `<!doctype html><html lang="en"><head><meta name="robots" content="noindex"><title>Page not found at ${NAME}</title></head><body><h1>Page not found</h1><p><a href="/">Back to ${BRAND}</a></p></body></html>`,
  };
  return { routes, notFound };
}

/** The independent outlet the site cites (served on its own port). */
export function buildPress(): FixtureSite {
  const page = (title: string, body: string) => ({
    headers: { "content-type": "text/html; charset=utf-8" },
    body: `<!doctype html><html lang="en"><head><title>${title}</title></head><body><article><h1>${title}</h1>${body}</article></body></html>`,
  });
  return {
    routes: {
      "/news/rally-padel-opens": page("Rally Padel opens on Margonda", `<p>By Sari Wulandari, reporter. ${QUOTE_OPEN} The club has four courts and a cafe.</p>`),
      "/news/academy": page("A morning at the Rally Padel academy", `<p>By Sari Wulandari, reporter. ${QUOTE_ACADEMY} Groups have four players.</p>`),
    },
    notFound: { status: 404, body: "not found" },
  };
}
