import { describe, expect, test } from "bun:test";
import { collectSecrets } from "./mirror-clean";

describe("collectSecrets", () => {
  test("maps env values and bearer tokens to placeholders, across versions", () => {
    const v1 = JSON.stringify({ mcpServers: { "jal-design": { env: { JEV_API_KEY: "old-key-aaaaaaaaaaaa" } } } });
    const v2 = JSON.stringify({
      mcpServers: {
        "jal-design": { env: { JEV_API_KEY: "new-key-bbbbbbbbbbbb" } },
        originkit: { headers: { Authorization: "Bearer tok-cccccccccccc" } },
        "koboyo-icons": { headers: { Authorization: "Bearer tok-dddddddddddd" } },
        other: { headers: { Authorization: "Bearer ${ALREADY_SET}" } },
      },
    });
    const m = collectSecrets([v1, v2, "not json"]);
    expect(m.get("old-key-aaaaaaaaaaaa")).toBe("${JEV_API_KEY}");
    expect(m.get("new-key-bbbbbbbbbbbb")).toBe("${JEV_API_KEY}");
    expect(m.get("tok-cccccccccccc")).toBe("${ORIGINKIT_API_KEY}");
    expect(m.get("tok-dddddddddddd")).toBe("${KOBOYO_API_KEY}");
    expect(m.size).toBe(4);
  });

  test("ignores placeholders and short values", () => {
    const v = JSON.stringify({ mcpServers: { a: { env: { X: "${X}", Y: "short" } } } });
    expect(collectSecrets([v]).size).toBe(0);
  });
});
