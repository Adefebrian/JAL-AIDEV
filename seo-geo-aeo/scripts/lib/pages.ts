// Page-kind and language helpers shared by audit, density and render.
// Pure functions, no imports, so tests can load them without side effects.

export type PageKind =
  | "home"
  | "money"
  | "about"
  | "programme"
  | "guide"
  | "contact"
  | "privacy"
  | "terms"
  | "other";

export const PAGE_KINDS: PageKind[] = ["home", "money", "about", "programme", "guide", "contact", "privacy", "terms", "other"];

const KIND_PATTERNS: Array<[PageKind, RegExp]> = [
  ["money", /^(rates|prices|pricing|price-list|harga|tarif|biaya|daftar-harga)$/],
  ["about", /^(about|about-us|tentang|tentang-kami)$/],
  ["programme", /^(programme|programmes|program|programs|academy|akademi|classes|kelas|coaching|courses?|kursus)$/],
  ["guide", /^(guide|guides|panduan|how-to|beginner-guide|learn|belajar)(\/.*)?$/],
  ["contact", /^(contact|contact-us|kontak|hubungi-kami)$/],
  ["privacy", /^(privacy|privacy-policy|privasi|kebijakan-privasi)$/],
  ["terms", /^(terms|terms-of-service|terms-of-use|syarat|ketentuan|syarat-dan-ketentuan|syarat-ketentuan)$/],
];

/** Normalise a path: leading slash, no trailing slash (except root), no query. */
export function normPath(path: string): string {
  let p = path.split("#")[0].split("?")[0] || "/";
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "") || "/";
  return p;
}

/** The language of a path: a leading /xx segment when xx is a non-default language. */
export function langOfPath(path: string, languages: string[], defaultLanguage: string): string {
  const p = normPath(path);
  const first = p.split("/")[1] ?? "";
  if (first && first !== defaultLanguage && languages.includes(first)) return first;
  return defaultLanguage;
}

/** Remove the language prefix: /id/rates becomes /rates, /id becomes /. */
export function stripLang(path: string, languages: string[], defaultLanguage: string): string {
  const p = normPath(path);
  const lang = langOfPath(p, languages, defaultLanguage);
  if (lang === defaultLanguage) return p;
  const rest = p.slice(lang.length + 1);
  return rest === "" ? "/" : rest;
}

export function classifyPath(
  path: string,
  opts: { languages?: string[]; defaultLanguage?: string; overrides?: Record<string, string> } = {},
): PageKind {
  const languages = opts.languages ?? ["en"];
  const defaultLanguage = opts.defaultLanguage ?? languages[0] ?? "en";
  const p = normPath(path);
  const override = opts.overrides?.[p];
  if (override && (PAGE_KINDS as string[]).includes(override)) return override as PageKind;
  const bare = stripLang(p, languages, defaultLanguage);
  const overrideBare = opts.overrides?.[bare];
  if (overrideBare && (PAGE_KINDS as string[]).includes(overrideBare)) return overrideBare as PageKind;
  if (bare === "/") return "home";
  const slug = bare.slice(1).toLowerCase();
  for (const [kind, re] of KIND_PATTERNS) if (re.test(slug)) return kind;
  // A one-segment slug that ends with a kind word: /youth-academy, /padel-rates.
  if (!slug.includes("/")) {
    const last = slug.split(/[-_]/).pop() ?? "";
    for (const [kind, re] of KIND_PATTERNS) if (TOKEN_KINDS.has(kind) && last !== slug && re.test(last)) return kind;
  }
  return "other";
}

// Kinds whose word can close a longer slug without changing its meaning.
const TOKEN_KINDS = new Set<PageKind>(["money", "programme"]);

export function isTrustKind(kind: PageKind): boolean {
  return kind === "privacy" || kind === "terms";
}
