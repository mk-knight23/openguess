import { describe, expect, it } from "vitest";
import { loadTheme } from "./loadTheme";
import { validateQuestionMetadata } from "../questionMetadata";
import { rankCandidates } from "../engine";

describe("reviewed featured clues", () => {
  for (const theme of [
    "people",
    "fictional",
    "animals",
    "objects",
    "movies",
  ] as const) {
    it(`${theme} has three recognizable sourced clues per featured profile`, async () => {
      const pack = await loadTheme(theme);
      expect(
        validateQuestionMetadata(pack.questions, theme, pack.characters),
      ).toEqual([]);
      const signatures = pack.questions.filter((q) => q.tier === "signature");
      expect(new Set(pack.questions.map((q) => q.id)).size).toBe(
        pack.questions.length,
      );
      for (const c of pack.characters.filter((c) => c.featured)) {
        const positive = signatures.filter((q) => c.traits[q.id] === true);
        expect(positive.length, c.name).toBeGreaterThanOrEqual(3);
        for (const q of positive) {
          expect(c.factSources?.[q.id]?.url).toMatch(/^https:\/\//);
          expect(c.factSources?.[q.id]?.scope.length).toBeGreaterThan(15);
          expect(
            pack.characters.some((r) => r.featured && r.traits[q.id] === false),
            q.id,
          ).toBe(true);
          expect(q.themes).toContain(theme);
        }
      }
    });
  }
});
it("distinguishes attending extra lessons from a one-off Time-Turner rescue", async () => {
  const pack = await loadTheme("fictional");
  const clue = pack.questions.find((q) =>
    /Time-Turner.*extra lessons/.test(q.text),
  )!;
  expect(
    pack.characters.find((c) => c.featured && c.name === "Hermione Granger")!
      .traits[clue.id],
  ).toBe(true);
  expect(
    pack.characters.find((c) => c.featured && c.name === "Harry Potter")!
      .traits[clue.id],
  ).toBe(false);
});
it("does not count a trunk and grasping with a trunk as independent discoveries", async () => {
  const pack = await loadTheme("animals");
  const characters = pack.characters.filter(
    (c) => c.featured && ["African bush elephant", "Giraffe"].includes(c.name),
  );
  const candidates = rankCandidates(
    characters,
    [
      { questionId: "core_trunk", answer: "yes" },
      { questionId: "sig_animals_african_bush_elephant_1", answer: "yes" },
    ],
    [],
    pack.questions,
  );
  expect(candidates[0].character.name).toBe("African bush elephant");
  expect(candidates[0].probability).toBeLessThan(0.997);
});
