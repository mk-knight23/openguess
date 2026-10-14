import { describe, expect, it } from "vitest";
import { themeManifest } from "./manifest";
import { loadTheme } from "./loadTheme";
describe("sourced theme packs", () => {
  for (const theme of [
    "people",
    "fictional",
    "animals",
    "objects",
    "movies",
  ] as const) {
    it(`${theme} has at least 1000 real sourced records and honest traits`, async () => {
      const pack = await loadTheme(theme);
      expect(pack.characters.length).toBeGreaterThanOrEqual(1000);
      expect(new Set(pack.characters.map((c) => c.id)).size).toBe(
        pack.characters.length,
      );
      expect(themeManifest.find((t) => t.id === theme)?.count).toBe(
        pack.characters.length,
      );
      expect(pack.questions.length).toBeGreaterThan(20);
      expect(
        pack.characters.filter((c) => c.featured).length,
      ).toBeGreaterThanOrEqual(20);
      expect(
        pack.questions.some(
          (q) => q.id.startsWith("name_") || q.property === "name",
        ),
      ).toBe(false);
      expect(
        pack.characters.some((c) =>
          Object.keys(c.traits).some((id) => id.startsWith("name_")),
        ),
      ).toBe(false);
      expect(
        pack.questions.every(
          (q) => !/letter|spelling|name contain/i.test(q.text),
        ),
      ).toBe(true);
      for (const c of pack.characters) {
        expect(c.id).toMatch(/^(Q\d+|authored:[a-z0-9:-]+)$/);
        expect(Object.keys(c.facts ?? {}).length).toBeGreaterThan(0);
        if (c.id.startsWith("Q")) {
          expect(c.source?.license).toBe("CC0-1.0");
          expect(c.source?.url).toBe(`https://www.wikidata.org/wiki/${c.id}`);
        } else {
          expect(c.source?.license).toContain("MIT");
          expect(c.featured).toBe(true);
          expect(c.annotationLicense).toBe("MIT");
          expect(c.annotationSources?.length).toBeGreaterThan(0);
        }
        expect(
          Object.values(c.traits).filter((v) => v === true).length,
        ).toBeGreaterThan(0);
        expect(
          Object.values(c.traits).every(
            (v) => v === true || v === false || v === null,
          ),
        ).toBe(true);
      }
      const signatures = new Set(
        pack.characters.map((c) =>
          JSON.stringify(
            Object.fromEntries(
              Object.entries(c.traits).sort(([a], [b]) => a.localeCompare(b)),
            ),
          ),
        ),
      );
      expect(pack.quality.uniqueTraitSignatures).toBe(signatures.size);
      expect(pack.quality.semanticUniqueTraitSignatures).toBe(signatures.size);
      if (theme === "people" || theme === "movies" || theme === "animals") {
        expect(
          pack.questions.some(
            (q) =>
              pack.characters.some((c) => c.traits[q.id] === true) &&
              pack.characters.some((c) => c.traits[q.id] === false),
          ),
        ).toBe(true);
      }
    });
  }
});
