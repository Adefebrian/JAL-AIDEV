import { describe, expect, test } from "bun:test";
import { isSecretEnvName, REDACTED, Redactor, redactText } from "./redact.ts";

describe("Redactor", () => {
  test("redacts every env value whose name looks secret", () => {
    const env = { INDEXNOW_KEY: "abc123indexnowkey", BING_WEBMASTER_API_KEY: "bing-key-0987654321", YANDEX_WEBMASTER_TOKEN: "yandextoken123456", HOME: "/Users/someone" };
    const r = new Redactor(env);
    const out = r.text("key abc123indexnowkey, bing bing-key-0987654321, yandex yandextoken123456, home /Users/someone");
    expect(out).not.toContain("abc123indexnowkey");
    expect(out).not.toContain("bing-key-0987654321");
    expect(out).not.toContain("yandextoken123456");
    expect(out).toContain("/Users/someone");
  });

  test("redacts the URL-encoded form of a secret", () => {
    const r = new Redactor({ SOME_SECRET: "a b/c+d=secret" });
    expect(r.text(`https://x.test/?q=${encodeURIComponent("a b/c+d=secret")}`)).not.toContain(encodeURIComponent("a b/c+d=secret"));
  });

  test("never treats PWD or short values as secrets", () => {
    expect(isSecretEnvName("PWD")).toBe(false);
    expect(isSecretEnvName("GSC_SERVICE_ACCOUNT_JSON")).toBe(true);
    const r = new Redactor({ PWD: "/Users/me/project", TINY_KEY: "abc" });
    expect(r.text("/Users/me/project abc")).toBe("/Users/me/project abc");
  });

  test("redacts secrets registered at runtime", () => {
    const r = new Redactor({});
    r.add("runtime-access-token-xyz");
    expect(r.text("got runtime-access-token-xyz back")).toBe(`got ${REDACTED} back`);
  });

  test("redacts key-shaped strings with no env entry", () => {
    const r = new Redactor({});
    const text = [
      "Authorization: Bearer abcdefghijklmnop.qrstu",
      "token ya29.a0AfH6SMBexampleexample",
      "https://ssl.bing.com/x?siteUrl=a&apikey=0123456789abcdef",
      "OAuth y0_AgAAAAAexampleexampleexample1234",
      "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADAN\n-----END PRIVATE KEY-----",
      '"private_key": "-----BEGIN PRIVATE KEY-----\\nMIIE"',
    ].join("\n");
    const out = r.text(text);
    for (const s of ["abcdefghijklmnop", "ya29.a0AfH6", "0123456789abcdef", "y0_AgAAAA", "MIIEvQIBADAN", "MIIE\""]) expect(out).not.toContain(s);
  });

  test("value() walks objects and arrays but keeps keys", () => {
    const r = new Redactor({ INDEXNOW_KEY: "deep-secret-value-1" });
    const v = r.value({ keyPresent: true, list: ["deep-secret-value-1", 3], nested: { msg: "x deep-secret-value-1 y" } });
    expect(v).toEqual({ keyPresent: true, list: [REDACTED, 3], nested: { msg: `x ${REDACTED} y` } });
  });

  test("json() output never contains the secret and keeps JSON keys intact", () => {
    const r = new Redactor({ INDEXNOW_KEY: "json-secret-abcdef" });
    const out = r.json({ keyEnv: "INDEXNOW_KEY", keyLocation: "https://x.test/json-secret-abcdef.txt" });
    expect(out).not.toContain("json-secret-abcdef");
    expect(JSON.parse(out).keyEnv).toBe("INDEXNOW_KEY");
  });

  test("error() redacts error messages", () => {
    const r = new Redactor({ BING_WEBMASTER_API_KEY: "error-secret-123456" });
    expect(r.error(new Error("failed with apikey error-secret-123456"))).not.toContain("error-secret-123456");
  });

  test("redactText uses the given env", () => {
    expect(redactText("value topsecret-777", { MY_TOKEN: "topsecret-777" })).toBe(`value ${REDACTED}`);
  });
});
