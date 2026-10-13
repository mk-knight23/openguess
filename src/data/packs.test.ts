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
      for (const c of pack.characters) {
        expect(c.id).toMatch(/^Q\d+$/);
        expect(Object.keys(c.facts ?? {}).length).toBeGreaterThan(0);
        expect(c.source?.license).toBe("CC0-1.0");
        expect(c.source?.url).toBe(`https://www.wikidata.org/wiki/${c.id}`);
        expect(
          Object.values(c.traits).filter((v) => v === true).length,
        ).toBeGreaterThan(0);
        expect(
          Object.entries(c.traits)
            .filter(([key]) => !key.startsWith("name_letter_"))
            .every(([, v]) => v === true || v === null),
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
      expect(
        Number(pack.quality.uniqueTraitSignatures) / pack.characters.length,
      ).toBeGreaterThanOrEqual(0.7);
    });
  }
});
