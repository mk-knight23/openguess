import { describe, expect, it } from "vitest";
import { loadTheme } from "./data/loadTheme";
import { featuredPack } from "./data/featuredPack";
import { rankCandidates, selectQuestion, shouldGuess } from "./engine";
import type { AnswerRecord } from "./types";
describe("featured semantic gameplay", () => {
  for (const theme of [
    "people",
    "fictional",
    "animals",
    "objects",
    "movies",
  ] as const) {
    it(`${theme} identifies every featured profile without spelling or exact dates`, async () => {
      const pack = featuredPack(await loadTheme(theme));
      const pool = pack.characters.filter((c) => c.featured);
      expect(pool.length).toBeGreaterThanOrEqual(20);
      for (const seed of [1, 17, 71])
        for (const target of pool) {
          const history: AnswerRecord[] = [];
          for (let count = 0; count < 40; count++) {
            const candidates = rankCandidates(
              pool,
              history,
              [],
              pack.questions,
            );
            if (
              shouldGuess(
                candidates,
                history.filter((h) => h.answer !== "unknown").length,
                history,
                pack.questions,
              )
            )
              break;
            const next = selectQuestion(
              candidates,
              pack.questions,
              history,
              seed,
            );
            expect(
              next,
              `${target.name} has enough meaningful facts`,
            ).not.toBeNull();
            expect(next!.question.kind).not.toBe("spelling");
            expect(next!.question.id).not.toMatch(/^name[_-]/i);
            const fact = ["P569", "P570", "P577"].includes(
              next!.question.property ?? "",
            )
              ? null
              : target.traits[next!.question.id];
            history.push({
              questionId: next!.question.id,
              answer: fact === true ? "yes" : fact === false ? "no" : "unknown",
            });
          }
          const final = rankCandidates(pool, history, [], pack.questions);
          expect(
            final[0].character.id,
            `${theme}/${target.name}/seed ${seed}`,
          ).toBe(target.id);
          expect(
            shouldGuess(
              final,
              history.filter((h) => h.answer !== "unknown").length,
              history,
              pack.questions,
            ),
          ).toBe(true);
        }
    });
  }
});
