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

it("prefers an answer-conditioned follow-up among equally useful clues", () => {
  const pool = [true, false].map((value, i) => ({
    id: String(i),
    name: String(i),
    category: "fictional" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { origin: true, a: value, z: value },
  }));
  const questions = [
    { id: "origin", text: "Game origin?", hint: "", topic: "origin" },
    { id: "a", text: "Appearance?", hint: "", topic: "appearance" },
    {
      id: "z",
      text: "Gameplay role?",
      hint: "",
      topic: "origin",
      followUpTo: [{ questionId: "origin", value: true }],
      prerequisites: [{ questionId: "origin", value: true }],
    },
  ];
  const history: AnswerRecord[] = [{ questionId: "origin", answer: "yes" }];
  expect(
    selectQuestion(rankCandidates(pool, history), questions, history)?.question
      .id,
  ).toBe("z");
});
it("skips scoped established implications while leaving useful related distinctions", () => {
  const pool = [true, false].map((value, i) => ({
    id: String(i),
    name: String(i),
    category: "fictional" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { origin: true, a: value, z: value },
  }));
  const questions = [
    {
      id: "origin",
      text: "World?",
      hint: "",
      scope: "work",
      implications: [
        { when: true, questionId: "a", value: true, scope: "work" },
      ],
    },
    { id: "a", text: "Same world?", hint: "", scope: "work" },
    { id: "z", text: "School role?", hint: "", scope: "work" },
  ];
  const history: AnswerRecord[] = [{ questionId: "origin", answer: "yes" }];
  expect(
    selectQuestion(rankCandidates(pool, history), questions, history)?.question
      .id,
  ).toBe("z");
});
it("cannot recover a rejected parent from its own dependent child evidence", () => {
  const pool = [true, false].map((value, i) => ({
    id: String(i),
    name: String(i),
    category: "fictional" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { parent: value, child: value, child2: value, z: value },
  }));
  const questions = [
    { id: "parent", text: "Origin?", hint: "" },
    ...["child", "child2", "z"].map((id) => ({
      id,
      text: id,
      hint: "",
      prerequisites: [{ questionId: "parent", value: true }],
    })),
  ];
  const history: AnswerRecord[] = [
    { questionId: "parent", answer: "no" },
    { questionId: "child", answer: "yes" },
    { questionId: "child2", answer: "yes" },
  ];
  expect(
    selectQuestion(
      rankCandidates(pool, history, [], questions),
      questions,
      history,
    ),
  ).toBeNull();
});

it("cannot disguise dependent child evidence behind equivalent propositions", () => {
  const pool = [true, false].map((value, i) => ({
    id: String(i),
    name: String(i),
    category: "fictional" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: {
      parent: value,
      child: value,
      alias: value,
      alias2: value,
      z: value,
    },
  }));
  const questions = [
    { id: "parent", text: "Origin?", hint: "" },
    {
      id: "child",
      text: "Child",
      hint: "",
      equivalenceGroup: "dependent",
      prerequisites: [{ questionId: "parent", value: true }],
    },
    ...["alias", "alias2"].map((id) => ({
      id,
      text: id,
      hint: "",
      equivalenceGroup: "dependent",
    })),
    {
      id: "z",
      text: "Next child",
      hint: "",
      prerequisites: [{ questionId: "parent", value: true }],
    },
  ];
  const history: AnswerRecord[] = [
    { questionId: "parent", answer: "no" },
    { questionId: "alias", answer: "yes" },
    { questionId: "alias2", answer: "yes" },
  ];
  expect(
    selectQuestion(
      rankCandidates(pool, history, [], questions),
      questions,
      history,
    ),
  ).toBeNull();
});

it("does not recover a rejected common premise from a universal unrelated answer", () => {
  const pool = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    name: String(i),
    category: "fictional" as const,
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { parent: i < 9, universal: true, child: i % 2 === 0 },
  }));
  const questions = [
    { id: "parent", text: "Common origin?", hint: "" },
    { id: "universal", text: "Universal fact", hint: "" },
    {
      id: "child",
      text: "Child",
      hint: "",
      prerequisites: [{ questionId: "parent", value: true }],
    },
  ];
  const history: AnswerRecord[] = [
    { questionId: "parent", answer: "no" },
    { questionId: "universal", answer: "yes" },
  ];
  const ranked = rankCandidates(pool, history, [], questions);
  expect(
    ranked
      .filter((c) => c.character.traits.parent)
      .reduce((sum, c) => sum + c.probability, 0),
  ).toBeLessThan(0.3);
  expect(selectQuestion(ranked, questions, history)).toBeNull();
});
