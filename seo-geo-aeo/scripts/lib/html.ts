// Small regex HTML helpers for served (prerendered) HTML. Not a full parser:
// they read the head, meta, links, JSON-LD, anchors and simple elements that
// a prerendered page carries, which is what the audit checks.

// Named references a prerenderer or CMS commonly emits. Names are case
// sensitive in HTML (&Eacute; is not &eacute;), so the lookup is exact first.
const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", ensp: "\u2002", emsp: "\u2003", thinsp: "\u2009",
  ldquo: "\u201c", rdquo: "\u201d", lsquo: "\u2018", rsquo: "\u2019", sbquo: "\u201a", bdquo: "\u201e", laquo: "\u00ab", raquo: "\u00bb",
  hellip: "\u2026", ndash: "\u2013", mdash: "\u2014", minus: "\u2212", bull: "\u2022", middot: "\u00b7", times: "\u00d7", divide: "\u00f7",
  copy: "\u00a9", reg: "\u00ae", trade: "\u2122", deg: "\u00b0", plusmn: "\u00b1", frac12: "\u00bd", frac14: "\u00bc", frac34: "\u00be",
  sup2: "\u00b2", sup3: "\u00b3", euro: "\u20ac", pound: "\u00a3", yen: "\u00a5", cent: "\u00a2", sect: "\u00a7", para: "\u00b6",
  aacute: "\u00e1", eacute: "\u00e9", iacute: "\u00ed", oacute: "\u00f3", uacute: "\u00fa", agrave: "\u00e0", egrave: "\u00e8",
  auml: "\u00e4", euml: "\u00eb", iuml: "\u00ef", ouml: "\u00f6", uuml: "\u00fc", ntilde: "\u00f1", ccedil: "\u00e7", szlig: "\u00df",
  Aacute: "\u00c1", Eacute: "\u00c9", Oacute: "\u00d3", Uacute: "\u00da", Ntilde: "\u00d1", Ouml: "\u00d6", Uuml: "\u00dc",
  zwj: "\u200d", zwnj: "\u200c", shy: "\u00ad",
};

/**
 * Decode character references exactly once: &amp;#x27; is the text "&#x27;",
 * not an apostrophe. Numeric references outside Unicode stay as written.
 */
export function decodeEntities(s: string): string {
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED[e] ?? NAMED[e.toLowerCase()] ?? m;
  });
}

// Elements that start a new line of text for a reader (innerText semantics).
const BLOCK_TAGS = /^(address|article|aside|blockquote|br|caption|dd|details|dialog|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|summary|table|tbody|td|tfoot|th|thead|tr|ul|option|legend|button|label)$/i;

/**
 * The text a reader sees: block boundaries become spaces, inline tags join
 * their neighbours ("<a>rates</a>." reads "rates."), entities decode once.
 */
export function readableText(fragment: string): string {
  const html = stripNonRendered(fragment);
  const text = html.replace(/<\/?([a-zA-Z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g, (_m, name: string) => (BLOCK_TAGS.test(name) ? " " : ""));
  return collapse(decodeEntities(text.replace(/<[^>]*>/g, " ")));
}

/** A comparison key: readable text, NFC, whitespace folded, no space before closing punctuation. */
export function textKey(s: string): string {
  return collapse(s.normalize("NFC").replace(/[\u00a0\u2002\u2003\u2009\u202f]/g, " ").replace(/[\u00ad\u200b\u200c\u200d]/g, ""))
    .replace(/\s+([.,;:!?)\]}\u2019\u201d%])/g, "$1")
    .replace(/([(\[{\u2018\u201c])\s+/g, "$1");
}

export type TagToken = { name: string; closing: boolean; selfClosing: boolean; index: number; end: number; raw: string };

const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;

/** Every start and end tag in document order (comments and non-rendered elements removed by the caller). */
export function tagTokens(html: string): TagToken[] {
  const out: TagToken[] = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const name = m[2].toLowerCase();
    out.push({ name, closing: m[1] === "/", selfClosing: VOID_TAGS.test(name) || m[0].endsWith("/>"), index: m.index, end: m.index + m[0].length, raw: m[0] });
  }
  return out;
}

/**
 * The index where the content that follows position `from` ends: the first end
 * tag that closes an element opened before `from` (the parent), or the first
 * token `stop` accepts at the same nesting level. Returns html.length at the end.
 */
export function siblingRunEnd(html: string, tokens: TagToken[], from: number, stop: (t: TagToken) => boolean): number {
  let depth = 0;
  for (const t of tokens) {
    if (t.index < from) continue;
    if (t.selfClosing && !t.closing) continue;
    if (t.closing) {
      if (depth === 0) return t.index;
      depth--;
      continue;
    }
    if (depth === 0 && stop(t)) return t.index;
    depth++;
  }
  return html.length;
}

export function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Remove comments and elements that never render as text. */
export function stripNonRendered(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[\s\S]*?<\/head\s*>/gi, " ")
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, " ");
}

/** Visible text with a space at every tag boundary (what a reader sees). */
export function visibleText(html: string): string {
  return collapse(decodeEntities(stripNonRendered(html).replace(/<[^>]+>/g, " ")));
}

/** Text with no space at tag boundaries (DOM textContent semantics). */
export function textContent(fragment: string): string {
  return collapse(decodeEntities(fragment.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "").replace(/<[^>]+>/g, "")));
}

export function parseAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const inner = tag.replace(/^<\/?[a-zA-Z][\w:-]*/, "").replace(/\/?>$/, "");
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const name = m[1].toLowerCase();
    if (name in out) continue;
    out[name] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

export type Tag = { attrs: Record<string, string>; index: number; raw: string };
export type Element = { attrs: Record<string, string>; inner: string; index: number; end: number; outer: string };

export function findTags(html: string, name: string): Tag[] {
  const re = new RegExp(`<${name}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, "gi");
  const out: Tag[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push({ attrs: parseAttrs(m[0]), index: m.index, raw: m[0] });
  return out;
}

/** Non-nested elements of one tag name, with their inner HTML. */
export function findElements(html: string, name: string): Element[] {
  const re = new RegExp(`<${name}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\\s\\S]*?)<\\/${name}\\s*>`, "gi");
  const out: Element[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({ attrs: parseAttrs(`<${name}${m[1]}>`), inner: m[2], index: m.index, end: m.index + m[0].length, outer: m[0] });
  }
  return out;
}

export function removeElements(html: string, names: string[]): string {
  let out = html;
  for (const n of names) out = out.replace(new RegExp(`<${n}\\b[\\s\\S]*?<\\/${n}\\s*>`, "gi"), " ");
  return out;
}

export function headHtml(html: string): string {
  const m = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  return m ? m[1] : "";
}

export function bodyHtml(html: string): string {
  const m = html.match(/<body\b[^>]*>([\s\S]*?)(<\/body\s*>|$)/i);
  return m ? m[1] : html;
}

export function htmlLang(html: string): string | null {
  const tag = findTags(html, "html")[0];
  return tag?.attrs.lang ?? null;
}

export function pageTitle(html: string): string | null {
  const el = findElements(headHtml(html) || html, "title")[0];
  return el ? collapse(decodeEntities(el.inner)) : null;
}

/** Content of <meta name=key> or <meta property=key>; every match. */
export function metaAll(html: string, key: string): string[] {
  const k = key.toLowerCase();
  return findTags(headHtml(html) || html, "meta")
    .filter((t) => (t.attrs.name ?? t.attrs.property ?? "").toLowerCase() === k)
    .map((t) => t.attrs.content ?? "");
}

export function meta(html: string, key: string): string | null {
  return metaAll(html, key)[0] ?? null;
}

export function linkTags(html: string): Record<string, string>[] {
  return findTags(headHtml(html) || html, "link").map((t) => t.attrs);
}

export function relIncludes(attrs: Record<string, string>, rel: string): boolean {
  return (attrs.rel ?? "").toLowerCase().split(/\s+/).includes(rel.toLowerCase());
}

export function hasNoindex(html: string, headers?: Headers | Record<string, string>): boolean {
  const header = headers instanceof Headers ? headers.get("x-robots-tag") : headers?.["x-robots-tag"];
  if (header && /noindex/i.test(header)) return true;
  return metaAll(html, "robots").some((c) => /noindex/i.test(c)) || metaAll(html, "googlebot").some((c) => /noindex/i.test(c));
}

export type LdBlock = { raw: string; data?: unknown; error?: string };

export function jsonLdBlocks(html: string): LdBlock[] {
  return findElements(html, "script")
    .filter((e) => (e.attrs.type ?? "").toLowerCase() === "application/ld+json")
    .map((e) => {
      const raw = e.inner.trim();
      try {
        return { raw, data: JSON.parse(raw) };
      } catch (err) {
        return { raw, error: err instanceof Error ? err.message : String(err) };
      }
    });
}

export type LdNode = Record<string, any>;

/** Every object with an @type, walking @graph, arrays and nested values. */
export function ldNodes(data: unknown): LdNode[] {
  const out: LdNode[] = [];
  const seen = new Set<unknown>();
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    const o = v as LdNode;
    if (o["@type"] !== undefined) out.push(o);
    for (const [k, child] of Object.entries(o)) if (k !== "@context") walk(child);
  };
  walk(data);
  return out;
}

export function ldTypes(node: LdNode): string[] {
  const t = node["@type"];
  return (Array.isArray(t) ? t : [t]).filter((x): x is string => typeof x === "string");
}

/** @type can be a string or an array; never compare with ===. */
export function isType(node: LdNode, type: string): boolean {
  return ldTypes(node).includes(type);
}

export type Anchor = { href: string; text: string; attrs: Record<string, string>; index: number };

export function anchors(html: string): Anchor[] {
  return findElements(html, "a")
    .filter((e) => e.attrs.href !== undefined)
    .map((e) => ({ href: e.attrs.href, text: collapse(decodeEntities(e.inner.replace(/<[^>]+>/g, " "))), attrs: e.attrs, index: e.index }));
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Normalise text for exact comparison (markup against visible text). */
export function normText(s: string): string {
  return collapse(decodeEntities(String(s).replace(/<[^>]+>/g, " ")));
}

export function digitsOnly(s: string): string {
  return s.replace(/\D+/g, "");
}

/** Width and height from a PNG IHDR chunk, or null if the bytes are not a PNG. */
export function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || !sig.every((b, i) => bytes[i] === b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
