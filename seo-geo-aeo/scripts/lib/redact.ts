// Redaction for every output and error of the seo-geo-aeo scripts.
// Two layers:
//   1. exact values: every env value whose name looks secret, plus secrets
//      registered at runtime (access tokens, decoded service-account fields);
//   2. key-shaped strings: the JAL jev.ts patterns (PEM blocks, bearer tokens,
//      JWTs, sk-/ghp_ keys, name=value and "name": "value" assignments) plus
//      the webmaster shapes (Google ya29 tokens, Yandex OAuth tokens, apikey=
//      query parameters, "OAuth <token>" headers).
// Zero dependencies.

import { redact as jevRedact } from "../../../mcp/jal-design/jev.ts";

export const REDACTED = "[REDACTED]";

export type Env = Record<string, string | undefined>;

const SECRET_ENV_NAME = /(KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|SERVICE_ACCOUNT)/i;
const NEVER_SECRET_ENV = new Set(["PWD", "OLDPWD", "SSH_AUTH_SOCK", "KEYCHAIN_PATH"]);
const MIN_SECRET_LENGTH = 6;

export function isSecretEnvName(name: string): boolean {
  if (NEVER_SECRET_ENV.has(name)) return false;
  return SECRET_ENV_NAME.test(name);
}

const EXTRA_PATTERNS: Array<[RegExp, string]> = [
  // Google OAuth access tokens.
  [/\bya29\.[A-Za-z0-9_\-.]+/g, REDACTED],
  // Yandex OAuth tokens (current y0_ style and the legacy AQAAAA style).
  [/\by[0-9]_[A-Za-z0-9_-]{20,}/g, REDACTED],
  [/\bAQAAAA[A-Za-z0-9_-]{20,}/g, REDACTED],
  // Authorization: OAuth <token>
  [/\bOAuth\s+[A-Za-z0-9._~+/-]{8,}=*/g, `OAuth ${REDACTED}`],
  // Key-bearing query parameters.
  [/([?&](?:api_?key|key|token|access_token|assertion)=)[^&\s"'#]+/gi, `$1${REDACTED}`],
  // A PEM private key cut off before its END line.
  [/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*$/g, REDACTED],
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class Redactor {
  private secrets = new Set<string>();

  constructor(env: Env = process.env) {
    for (const [name, value] of Object.entries(env)) {
      if (value && isSecretEnvName(name)) this.add(value);
    }
  }

  /** Register a secret learned at runtime (a token, a decoded private key). */
  add(secret?: string | null): void {
    if (!secret) return;
    const trimmed = secret.trim();
    for (const form of [secret, trimmed]) {
      if (form.length < MIN_SECRET_LENGTH) continue;
      this.secrets.add(form);
      const encoded = encodeURIComponent(form);
      if (encoded !== form) this.secrets.add(encoded);
      const jsonEscaped = JSON.stringify(form).slice(1, -1);
      if (jsonEscaped !== form) this.secrets.add(jsonEscaped);
    }
  }

  get size(): number {
    return this.secrets.size;
  }

  /** Replace exact secret values only. Safe on JSON text. */
  exact(input: string): string {
    if (!input || this.secrets.size === 0) return input;
    const ordered = [...this.secrets].sort((a, b) => b.length - a.length);
    let text = input;
    for (const secret of ordered) {
      if (text.includes(secret)) text = text.replace(new RegExp(escapeRegExp(secret), "g"), REDACTED);
    }
    return text;
  }

  /** Full redaction of free text: exact values, then key-shaped strings. */
  text(input: string): string {
    let text = this.exact(String(input));
    for (const [pattern, replacement] of EXTRA_PATTERNS) text = text.replace(pattern, replacement);
    return jevRedact(text) as string;
  }

  /** Deep-redact every string value. Object keys are left as they are. */
  value<T>(input: T): T {
    if (typeof input === "string") return this.text(input) as unknown as T;
    if (Array.isArray(input)) return input.map((v) => this.value(v)) as unknown as T;
    if (input && typeof input === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input as Record<string, unknown>)) out[k] = this.value(v);
      return out as T;
    }
    return input;
  }

  error(err: unknown): string {
    if (err instanceof Error) return this.text(err.message);
    return this.text(String(err));
  }

  /** JSON for stdout or files: values deep-redacted, then exact values again. */
  json(input: unknown, indent = 2): string {
    return this.exact(JSON.stringify(this.value(input), null, indent));
  }
}

export function redactText(input: string, env: Env = process.env): string {
  return new Redactor(env).text(input);
}

export function redactValue<T>(input: T, env: Env = process.env): T {
  return new Redactor(env).value(input);
}
