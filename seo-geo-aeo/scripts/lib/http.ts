// fetch with a host allowlist, a timeout on every attempt, and backoff retries
// only on 429 and 5xx. Redirects are followed by hand so every hop is checked
// against the allowlist. Errors never carry a secret (Redactor).

import { normaliseHost, siteHosts, type SeoConfig } from "./config.ts";
import { Redactor } from "./redact.ts";

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class Allowlist {
  private set: Set<string>;
  constructor(hosts: Iterable<string>) {
    this.set = new Set([...hosts].map(normaliseHost).filter(Boolean));
  }
  allows(url: string | URL): boolean {
    try {
      const u = typeof url === "string" ? new URL(url) : url;
      if (u.protocol !== "https:" && u.protocol !== "http:") return false;
      return this.set.has(u.host.toLowerCase());
    } catch {
      return false;
    }
  }
  hosts(): string[] {
    return [...this.set];
  }
}

/** Site hosts and allowHosts from the config, plus fixed service hosts a script documents. */
export function allowlistFromConfig(config: SeoConfig, serviceHosts: string[] = []): Allowlist {
  return new Allowlist([...siteHosts(config), ...(config.allowHosts ?? []), ...serviceHosts]);
}

export class HostNotAllowedError extends Error {
  host: string;
  constructor(host: string) {
    super(`refused: host ${host} is not in the allowlist from .jal/seo-geo-aeo.json`);
    this.name = "HostNotAllowedError";
    this.host = host;
  }
}

export type HttpErrorKind = "status" | "timeout" | "network" | "redirect";

export class HttpError extends Error {
  kind: HttpErrorKind;
  status?: number;
  body?: string;
  constructor(kind: HttpErrorKind, message: string, status?: number, body?: string) {
    super(message);
    this.name = "HttpError";
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

export type HttpOptions = {
  allow: Allowlist;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxRedirects?: number;
  followRedirects?: boolean;
  sleep?: (ms: number) => Promise<void>;
  redactor?: Redactor;
  /** Veto a retry that the status allows (for example a daily quota error). */
  shouldRetry?: (res: Response) => boolean | Promise<boolean>;
};

export type Hop = { url: string; status: number; location: string };
export type HttpResult = { res: Response; url: string; redirects: Hop[]; attempts: number };

export const DEFAULT_TIMEOUT_MS = 15000;
export const DEFAULT_RETRIES = 3;
export const DEFAULT_BASE_DELAY_MS = 500;
export const DEFAULT_MAX_DELAY_MS = 30000;

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

export function backoffDelay(attempt: number, retryAfter: string | null, base: number, max: number): number {
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(max, Math.round(secs * 1000));
    const at = Date.parse(retryAfter);
    if (Number.isFinite(at)) return Math.min(max, Math.max(0, at - Date.now()));
  }
  return Math.min(max, base * Math.pow(2, attempt));
}

function describe(method: string, url: string): string {
  return `${method} ${url}`;
}

async function attemptLoop(url: string, init: RequestInit, opts: HttpOptions, redactor: Redactor): Promise<{ res: Response; attempts: number }> {
  const fetchImpl = opts.fetchImpl ?? (fetch as FetchLike);
  const retries = opts.retries ?? DEFAULT_RETRIES;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const base = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const max = opts.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const sleep = opts.sleep ?? realSleep;
  const method = (init.method ?? "GET").toUpperCase();

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetchImpl(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "TimeoutError" || name === "AbortError") {
        throw new HttpError("timeout", redactor.text(`${describe(method, url)} timed out after ${timeoutMs}ms`));
      }
      throw new HttpError("network", redactor.text(`${describe(method, url)} failed: ${err instanceof Error ? err.message : String(err)}`));
    }
    if (isRetryableStatus(res.status) && attempt < retries) {
      const veto = opts.shouldRetry ? !(await opts.shouldRetry(res.clone())) : false;
      if (!veto) {
        const delay = backoffDelay(attempt, res.headers.get("retry-after"), base, max);
        try {
          await res.body?.cancel();
        } catch {
          // ignore
        }
        await sleep(delay);
        continue;
      }
    }
    return { res, attempts: attempt + 1 };
  }
}

/**
 * One request. Returns the final response whatever its status; throws only for
 * a refused host, a timeout, a network failure or a redirect loop.
 */
export async function httpRequest(url: string, init: RequestInit = {}, opts: HttpOptions): Promise<HttpResult> {
  const redactor = opts.redactor ?? new Redactor();
  const follow = opts.followRedirects ?? true;
  const maxRedirects = opts.maxRedirects ?? 5;
  const redirects: Hop[] = [];
  let current = url;
  let currentInit = init;
  let attempts = 0;
  for (let hop = 0; ; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      throw new HttpError("network", redactor.text(`not a URL: ${current}`));
    }
    if (!opts.allow.allows(parsed)) throw new HostNotAllowedError(redactor.text(parsed.host));
    const { res, attempts: a } = await attemptLoop(parsed.href, currentInit, opts, redactor);
    attempts += a;
    const location = res.headers.get("location");
    if (follow && location && res.status >= 300 && res.status < 400) {
      if (hop >= maxRedirects) throw new HttpError("redirect", redactor.text(`too many redirects from ${url}`));
      const next = new URL(location, parsed).href;
      redirects.push({ url: parsed.href, status: res.status, location: next });
      try {
        await res.body?.cancel();
      } catch {
        // ignore
      }
      if (res.status === 303 || ((res.status === 301 || res.status === 302) && (currentInit.method ?? "GET").toUpperCase() === "POST")) {
        currentInit = { ...currentInit, method: "GET", body: undefined };
      }
      current = next;
      continue;
    }
    return { res, url: parsed.href, redirects, attempts };
  }
}

/** A JSON request that throws HttpError (with a redacted body snippet) on non-2xx. */
export async function httpJson<T = unknown>(url: string, init: RequestInit, opts: HttpOptions): Promise<{ data: T; status: number; result: HttpResult }> {
  const redactor = opts.redactor ?? new Redactor();
  const result = await httpRequest(url, init, opts);
  const text = await result.res.text();
  if (!result.res.ok) {
    const snippet = redactor.text(text.slice(0, 400));
    throw new HttpError(
      "status",
      redactor.text(`${(init.method ?? "GET").toUpperCase()} ${result.url} returned ${result.res.status}: ${snippet}`),
      result.res.status,
      snippet,
    );
  }
  let data: T;
  try {
    data = (text ? JSON.parse(text) : null) as T;
  } catch {
    data = text as unknown as T;
  }
  return { data, status: result.res.status, result };
}
