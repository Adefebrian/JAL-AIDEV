// apps/web/server/lib/redirects.ts - retired paths, 301 to the live page that
// answers the same question (standard.md SEO-03). redirects.test.ts proves
// every target is a live indexable route and no retired path is still live.
// Import-free.

export const RETIRED: Record<string, string> = {
  // "/free-trial": "/rates",
  // "/harga": "/id/rates",
};

export function retiredTarget(path: string, map: Record<string, string> = RETIRED): string | undefined {
  return map[path];
}
