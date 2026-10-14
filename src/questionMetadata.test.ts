import { expect, it } from "vitest";
import { validateQuestionMetadata } from "./questionMetadata";
import type { Question } from "./types";
const q = (id: string, extra: Partial<Question> = {}): Question => ({
  id,
  text: id,
  hint: "",
  ...extra,
});
it("accepts legacy metadata and rejects unknown prerequisites", () => {
  expect(validateQuestionMetadata([q("a")])).toEqual([]);
  expect(
    validateQuestionMetadata([
      q("a", { prerequisites: [{ questionId: "missing", value: true }] }),
    ]).join(" "),
  ).toContain("missing");
});
it("rejects prerequisite cycles, contradictory scopes and malformed groups", () => {
  expect(
    validateQuestionMetadata([
      q("a", { prerequisites: [{ questionId: "b", value: true }] }),
      q("b", { prerequisites: [{ questionId: "a", value: true }] }),
    ]).join(" "),
  ).toContain("cycle");
  expect(
    validateQuestionMetadata([q("a", { themes: ["animals"] })], "people").join(
      " ",
    ),
  ).toContain("theme");
  expect(
    validateQuestionMetadata([q("a", { relatedGroup: " " })]).join(" "),
  ).toContain("group");
});
