import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { rankCandidates, selectQuestion } from "./engine";
import type { AnswerRecord, DataPack } from "./types";
for (const theme of ["people", "fictional", "animals", "objects", "movies"]) {
  it(`asks only meaningful adaptive questions in the actual ${theme} pack`, () => {
    const pack = JSON.parse(
      readFileSync(
        new URL(`./data/packs/${theme}.json`, import.meta.url),
        "utf8",
      ),
    ) as DataPack;
    const target = pack.characters[Math.floor(pack.characters.length / 2)];
    const history: AnswerRecord[] = [];
    for (let turn = 0; turn < 6; turn++) {
      const selected = selectQuestion(
        rankCandidates(pack.characters, history),
        pack.questions,
        history,
      );
      if (turn === 0) expect(selected).not.toBeNull();
      if (!selected) break; // Honest exhaustion is permitted; spelling fallback is not.
      expect(selected.question.id).not.toMatch(/^name(?:_|-)/i);
      expect((selected.question as { kind?: string }).kind).not.toBe(
        "spelling",
      );
      expect(selected.informationGain).toBeGreaterThan(0);
      expect(
        history.some((answer) => answer.questionId === selected.question.id),
      ).toBe(false);
      const fact = target.traits[selected.question.id];
      history.push({
        questionId: selected.question.id,
        answer: fact === true ? "yes" : fact === false ? "no" : "unknown",
      });
    }
  });
}
