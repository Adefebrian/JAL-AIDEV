// packages/facts/src/lang.test.ts - language is a URL (hard law 4). Pure.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { DEFAULT_LANG, LANGS, PAGE_PATHS, TRANSLATED_PATHS, hasTranslation, pathForLang, splitLangPath } from "./lang";

const basePaths = Object.values(PAGE_PATHS) as string[];
const others = LANGS.filter((l) => l !== DEFAULT_LANG);

describe("lang", () => {
  test("hasTranslation is true only for translated paths", () => {
    for (const p of basePaths) expect(hasTranslation(p)).toBe(TRANSLATED_PATHS.includes(p));
    expect(hasTranslation("/no-such-page")).toBe(false);
    expect(hasTranslation("")).toBe(false);
  });

  test("every translated path is a real page", () => {
    for (const p of TRANSLATED_PATHS) expect(basePaths).toContain(p);
  });

  test("the default language lives at the bare path, every other language under its prefix", () => {
    for (const p of basePaths) expect(pathForLang(p, DEFAULT_LANG)).toBe(p);
    for (const lang of others) {
      for (const p of TRANSLATED_PATHS) expect(pathForLang(p, lang)).toBe(p === "/" ? `/${lang}` : `/${lang}${p}`);
    }
  });

  test("an untranslated page links to its default-language URL, never a dead prefixed one", () => {
    for (const lang of others) {
      for (const p of basePaths.filter((x) => !hasTranslation(x))) expect(pathForLang(p, lang)).toBe(p);
    }
  });

  test("splitLangPath inverts pathForLang", () => {
    for (const lang of LANGS) {
      for (const p of basePaths) {
        const path = pathForLang(p, lang);
        const expected = hasTranslation(p) ? lang : DEFAULT_LANG;
        expect(splitLangPath(path)).toEqual({ lang: expected, basePath: p });
      }
    }
  });

  test("a path that only starts like a prefix is not that language", () => {
    for (const lang of others) expect(splitLangPath(`/${lang}x`).lang).toBe(DEFAULT_LANG);
  });

  test("DEFAULT_LANG and LANGS agree with .jal/seo-geo-aeo.json", () => {
    const file = join(import.meta.dir, "..", "..", "..", ".jal", "seo-geo-aeo.json");
    expect(existsSync(file)).toBe(true);
    const config = JSON.parse(readFileSync(file, "utf8")) as { defaultLanguage?: string; languages?: string[] };
    expect(config.defaultLanguage).toBe(DEFAULT_LANG);
    expect([...(config.languages ?? [])].sort()).toEqual([...LANGS].sort());
  });
});
