import { expect, it } from "vitest";
import { rankCandidates, shouldGuess, selectQuestion } from "./engine";
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
