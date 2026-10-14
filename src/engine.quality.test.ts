import { expect, it } from "vitest";
import {
  rankCandidates,
  shouldGuess,
  selectQuestion,
  getRoundReadiness,
} from "./engine";
import type { Character, Question, AnswerRecord } from "./types";
const characters: Character[] = [true, false].map((value, i) => ({
  id: String(i),
  name: String(i),
  category: "real",
  description: "",
  tags: [],
  color: "",
  initials: "",
  traits: { a: value, b: value, c: value, s: value, t: value, a0: value },
}));
const broad: Question[] = ["a", "b", "c"].map((id) => ({
  id,
  text: id,
  hint: "",
  tier: "broad",
}));
const signature: Question = {
  id: "s",
  text: "Recognizable",
  hint: "",
  tier: "signature",
  answerability: "familiar",
};
const history: AnswerRecord[] = ["a", "b", "c"].map((questionId) => ({
  questionId,
  answer: "yes",
}));
it("discounts repeated related evidence without removing nonzero alternatives", () => {
  const grouped = broad.map((q) => ({ ...q, relatedGroup: "one" }));
  expect(
    rankCandidates(characters, history, [], grouped)[0].probability,
  ).toBeLessThan(rankCandidates(characters, history)[0].probability);
});
it("requires a supported independent signature even after broad confidence or exclusion", () => {
  const candidates = rankCandidates(characters, history);
  expect(shouldGuess(candidates, 3, history, [...broad, signature])).toBe(
    false,
  );
  expect(
    shouldGuess(candidates.slice(0, 1), 3, history, [...broad, signature]),
  ).toBe(false);
  expect(
    shouldGuess(
      rankCandidates(characters, [
        ...history,
        { questionId: "s", answer: "yes" },
      ]),
      4,
      [...history, { questionId: "s", answer: "yes" }],
      [...broad, signature],
    ),
  ).toBe(true);
});
it("a correlated or contradicted signature cannot confirm a broad guess", () => {
  const same = [
    ...broad.map((q) => ({ ...q, relatedGroup: "one" })),
    { ...signature, relatedGroup: "one" },
  ];
  const evidence: AnswerRecord[] = [
    ...history,
    { questionId: "s", answer: "yes" },
  ];
  expect(
    shouldGuess(rankCandidates(characters, evidence), 4, evidence, same),
  ).toBe(false);
  const contradictory: AnswerRecord[] = [
    ...history,
    { questionId: "s", answer: "no" },
  ];
  expect(
    shouldGuess(rankCandidates(characters, contradictory), 4, contradictory, [
      ...broad,
      signature,
    ]),
  ).toBe(false);
});
it("prioritizes a distinctive confirmation after broad narrowing", () => {
  expect(
    selectQuestion(
      rankCandidates(characters, history),
      [...broad, signature, { id: "a0", text: "T", hint: "" }],
      history,
    )?.question.id,
  ).toBe("s");
});
it("a later contradictory confirmation clears an earlier confirmation", () => {
  const evidence: AnswerRecord[] = [
    ...history,
    { questionId: "s", answer: "yes" },
    { questionId: "s", answer: "no" },
  ];
  expect(
    shouldGuess(rankCandidates(characters, evidence), 5, evidence, [
      ...broad,
      signature,
    ]),
  ).toBe(false);
});
it("unique equivalence labels cannot bypass a shared evidence group", () => {
  const questions = [...broad, signature].map((q) => ({
    ...q,
    relatedGroup: "one",
    equivalenceGroup: q.id,
  }));
  const evidence: AnswerRecord[] = [
    ...history,
    { questionId: "s", answer: "yes" },
  ];
  const grouped = rankCandidates(characters, evidence, [], questions);
  expect(grouped[0].probability).toBeLessThan(
    rankCandidates(characters, evidence)[0].probability,
  );
  expect(shouldGuess(grouped, 4, evidence, questions)).toBe(false);
});
it("widens seeded variety only within an explicitly bounded usefulness band", () => {
  const pool = Array.from({ length: 10 }, (_, n) => ({
    ...characters[0],
    id: String(n),
    traits: { strong: n < 5, near: n < 3, weak: n === 0 },
  }));
  const questions = ["strong", "near", "weak"].map((id) => ({
    id,
    text: id,
    hint: "",
  }));
  const ranked = rankCandidates(pool, []);
  const narrow = new Set(
    Array.from(
      { length: 100 },
      (_, n) => selectQuestion(ranked, questions, [], n + 1)?.question.id,
    ),
  );
  expect(narrow).toEqual(new Set(["strong"]));
  const wider = new Set(
    Array.from(
      { length: 100 },
      (_, n) => selectQuestion(ranked, questions, [], n + 1, 0.15)?.question.id,
    ),
  );
  expect(wider).toEqual(new Set(["strong", "near"]));
});
it("a shared signature cannot confirm against the strongest remaining rival", () => {
  const candidates = [
    { character: characters[0], probability: 0.9 },
    {
      character: {
        ...characters[1],
        traits: { ...characters[1].traits, s: true },
      },
      probability: 0.0999,
    },
    { character: { ...characters[1], id: "faint" }, probability: 0.0001 },
  ];
  expect(
    getRoundReadiness(
      candidates,
      [...history, { questionId: "s", answer: "yes" }],
      [...broad, signature],
    ).ready,
  ).toBe(false);
});
it("requires an additional independent confirmation after a known contradiction", () => {
  const pool = characters.map((c, i) => ({
    ...c,
    traits: { ...c.traits, mistake: i !== 0 },
  }));
  const ranked = pool.map((character, i) => ({
    character,
    probability: i === 0 ? 0.95 : 0.05,
  }));
  const questions = [
    ...broad,
    { id: "mistake", text: "Contradictory clue", hint: "" },
    signature,
    { ...signature, id: "t" },
  ];
  const evidence: AnswerRecord[] = [
    ...history,
    { questionId: "mistake", answer: "yes" },
    { questionId: "s", answer: "yes" },
  ];
  expect(getRoundReadiness(ranked, evidence, questions).ready).toBe(false);
  expect(
    getRoundReadiness(
      ranked,
      [...evidence, { questionId: "t", answer: "yes" }],
      questions,
    ).ready,
  ).toBe(true);
});
it("posterior corroboration can recover from a mistaken prerequisite answer", () => {
  const pool = characters.map((c, i) => ({
    ...c,
    traits: { ...c.traits, parent: i === 0 },
  }));
  const evidence: AnswerRecord[] = [
    { questionId: "parent", answer: "no" },
    ...history,
  ];
  const questions = [
    ...broad,
    { id: "parent", text: "Broad class", hint: "" },
    { ...signature, prerequisites: [{ questionId: "parent", value: true }] },
  ];
  expect(
    selectQuestion(
      rankCandidates(pool, evidence, [], questions),
      questions,
      evidence,
    )?.question.id,
  ).toBe("s");
});

it("unknown or missing signature facts preserve supported confirmation", () => {
  for (const fact of [null, undefined]) {
    const profiles = characters.map((c) => ({
      ...c,
      traits: { ...c.traits, u: fact },
    }));
    const evidence: AnswerRecord[] = [
      ...history,
      { questionId: "s", answer: "yes" },
      { questionId: "u", answer: "no" },
    ];
    const questions = [...broad, signature, { ...signature, id: "u" }];
    expect(
      getRoundReadiness(
        rankCandidates(profiles, evidence, [], questions),
        evidence,
        questions,
      ).ready,
    ).toBe(true);
  }
});
