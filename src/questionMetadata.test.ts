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
it("rejects conflicting equivalent facts and malformed fact provenance", () => {
  const questions = [
    q("a", { equivalenceGroup: "same" }),
    q("b", { equivalenceGroup: "same" }),
  ];
  const character = {
    id: "c",
    name: "C",
    description: "",
    category: "real" as const,
    tags: [],
    color: "",
    initials: "",
    traits: { a: true, b: false },
    factSources: { a: { url: "file:///secret", scope: "" } },
  };
  const errors = validateQuestionMetadata(questions, "people", [character]);
  expect(errors.join(" ")).toContain("equivalent");
  expect(errors.join(" ")).toContain("fact source");
});
