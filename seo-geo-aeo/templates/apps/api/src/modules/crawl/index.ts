// The ONLY file another module or core/app.ts may import from this module.
// The crawler log's storage and summary (integrate.md, "the crawler log
// placement"): apps/web counts hits and flushes them here.
import { createCrawlRepo } from "./repo";
import { createCrawlRoutes, type CrawlAuth } from "./routes";
import { createCrawlService } from "./service";
import type { DbPort } from "./ports";

export type { CrawlRow } from "./repo";
export type { CrawlService } from "./service";
export { bearerMatches } from "./routes";

export interface CrawlModuleDeps extends CrawlAuth {
  db: DbPort;
  now?: () => Date;
}

export function createCrawlModule(deps: CrawlModuleDeps) {
  const service = createCrawlService({ repo: createCrawlRepo(deps.db), now: deps.now });
  return createCrawlRoutes(service, deps);
}
