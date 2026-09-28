import { describe, expect, test } from "bun:test";
import { listNoyzzi, noyzziUrl } from "./noyzzi";

describe("noyzzi index", () => {
  test("covers the whole catalogue: 30 sections, 22 effects, 26 elements", () => {
    expect(listNoyzzi("section").length).toBe(30);
    expect(listNoyzzi("effect").length).toBe(22);
    expect(listNoyzzi("element").length).toBe(26);
    expect(listNoyzzi().length).toBe(78);
  });

  test("every item has a slug, name, law note, and a trailing-slash source URL that matches its kind", () => {
    for (const item of listNoyzzi()) {
      expect(item.slug).toMatch(/^[a-z0-9-]+$/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(typeof item.law).toBe("string");
      expect(item.url).toBe(noyzziUrl(item.kind as "section" | "effect" | "element", item.slug));
      expect(item.url.endsWith("/")).toBe(true);
    }
  });

  test("slugs are unique per kind", () => {
    for (const kind of ["section", "effect", "element"] as const) {
      const slugs = listNoyzzi(kind).map((i) => i.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  test("Grimoire lives at /elements/book/", () => {
    const g = listNoyzzi("element").find((i) => i.name === "Grimoire");
    expect(g?.url).toBe("https://noyzzi.com/elements/book/");
  });
});
