import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { rankCandidates, selectQuestion } from "./engine";
import type { AnswerRecord, DataPack } from "./types";
for (const theme of ["people", "fictional", "animals", "objects", "movies"]) {
  it(`asks only meaningful adaptive questions in the actual ${theme} pack`, () => {
    const pack = JSON.parse(
      readFileSync(`${process.cwd()}/src/data/packs/${theme}.json`, "utf8"),
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

it("suppresses equivalent clues and signatures without supported prerequisites", () => {
  const characters = [true, false].map((value, i) => ({
    id: String(i),
    name: String(i),
    category: "real" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { a: value, b: value, parent: false, signature: value },
  }));
  const questions = [
    { id: "a", text: "A", hint: "", equivalenceGroup: "same" },
    { id: "b", text: "B", hint: "", equivalenceGroup: "same" },
    { id: "parent", text: "Parent", hint: "" },
    {
      id: "signature",
      text: "Signature",
      hint: "",
      tier: "signature" as const,
      prerequisites: [{ questionId: "parent", value: true }],
    },
  ];
  const history: AnswerRecord[] = [{ questionId: "a", answer: "unknown" }];
  expect(
    selectQuestion(rankCandidates(characters, history), questions, history),
  ).toBeNull();
});
it("avoids an uncertain topic when another useful topic remains", () => {
  const characters = [true, false].map((value, i) => ({
    id: String(i),
    name: String(i),
    category: "real" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { a: value, b: value, z: value },
  }));
  const questions = [
    { id: "a", text: "A", hint: "", family: "science" },
    { id: "b", text: "B", hint: "", family: "science" },
    { id: "z", text: "Z", hint: "", family: "appearance" },
  ];
  expect(
    selectQuestion(
      rankCandidates(characters, []),
      questions,
      [
        { questionId: "a", answer: "unknown" },
        { questionId: "unrelated", answer: "yes" },
      ],
      0,
    )?.question.id,
  ).toBe("z");
});
