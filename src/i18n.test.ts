import { describe, it, expect } from "vitest";
import { languages, translate } from "./i18n";
describe("interface languages", () => {
  it("offers eighteen unique languages including RTL and Hindi", () => {
    expect(languages).toHaveLength(18);
    expect(new Set(languages.map((l) => l.code)).size).toBe(18);
    expect(languages.find((l) => l.code === "ar")?.dir).toBe("rtl");
    expect(languages.find((l) => l.code === "hi")).toBeDefined();
  });
  it("translates answer choices and falls back explicitly for unknown languages", () => {
    expect(translate("fr", "yes")).toBe("Oui");
    expect(translate("hi", "no")).toBe("नहीं");
    expect(translate("missing", "play")).toBe("Play");
    for (const l of languages)
      for (const key of [
        "ready",
        "yes",
        "no",
        "probably",
        "probablyNot",
        "dontKnow",
        "play",
        "characters",
        "people",
        "fictional",
        "animals",
        "objects",
        "movies",
        "collection",
        "daily",
        "settings",
        "back",
        "question",
        "correct",
        "wrong",
        "unknown",
        "start",
        "hint",
      ] as const)
        expect(translate(l.code, key).length).toBeGreaterThan(0);
  });
});
