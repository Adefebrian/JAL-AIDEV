// apps/web/src/seo/build-hook.ts - BUILD TIME ONLY: writes dist/seo.json.
//
// Called by apps/web/build.ts after Bun.build. Reads .jal/seo-geo-aeo.json
// from the repo root (the IndexNow host allowlist and the default language);
// a missing config builds fine with IndexNow off. Fails the build when a
// placeholder fact would ship, unless SEO_ALLOW_PLACEHOLDERS=1 (local draft).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateSeo, type SeoConfig } from "./content";

export function readSeoConfig(repoRoot: string): SeoConfig | null {
  const file = join(repoRoot, ".jal", "seo-geo-aeo.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as SeoConfig;
}

export async function writeSeoArtifacts(outdir: string, repoRoot: string): Promise<void> {
  const config = readSeoConfig(repoRoot);
  if (!config) console.warn("seo: .jal/seo-geo-aeo.json not found, IndexNow stays off");
  const { bundle, placeholders } = generateSeo(config);
  if (placeholders.length > 0) {
    const list = placeholders.map((h) => `  - ${h}`).join("\n");
    if (process.env.SEO_ALLOW_PLACEHOLDERS !== "1") {
      console.error(`seo: ${placeholders.length} placeholder fact(s) would reach served text. Ask the owner, fill packages/facts:\n${list}`);
      process.exit(1);
    }
    console.warn(`seo: SEO_ALLOW_PLACEHOLDERS=1, shipping a DRAFT with ${placeholders.length} placeholder fact(s)`);
  }
  await Bun.write(join(outdir, "seo.json"), JSON.stringify(bundle));
  console.log(`seo.json ok: ${bundle.pages.length} pages, IndexNow hosts [${bundle.indexNowHosts.join(", ")}]`);
}
