// apps/web/server/lib/prerender.ts - reads dist/seo.json ONCE at boot.
//
// A missing file is not an error: a fresh checkout, a dev server started
// before the first build, or a test run all boot fine. The shell then carries
// the head from metaCopy.ts with an empty #root, and the discovery routes that
// need the file answer 404. A file that exists but does not parse is logged
// and treated as missing, never thrown into boot.
import { existsSync, readFileSync } from "node:fs";
import type { SeoBundle, SeoPageBody } from "./seoTypes";

export function loadSeo(file: string, log: (msg: string) => void = console.warn): SeoBundle | null {
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as SeoBundle;
    if (parsed?.version !== 1 || !Array.isArray(parsed.pages)) {
      log(`seo: ${file} has an unknown shape, serving without prerendered bodies`);
      return null;
    }
    return parsed;
  } catch (err) {
    log(`seo: ${file} could not be read (${err instanceof Error ? err.message : String(err)})`);
    return null;
  }
}

export function pageBodies(seo: SeoBundle | null): Map<string, SeoPageBody> {
  return new Map((seo?.pages ?? []).map((p) => [p.path, p]));
}
