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

it("rejects unknown follow-ups and unscoped, cross-scope or cyclic implications", () => {
  const metadata = (value: unknown) => value as Partial<Question>;
  expect(
    validateQuestionMetadata([
      q(
        "a",
        metadata({ followUpTo: [{ questionId: "missing", value: true }] }),
      ),
    ]).join(" "),
  ).toContain("follow-up");
  expect(
    validateQuestionMetadata([
      q(
        "a",
        metadata({
          implications: [
            { when: true, questionId: "b", value: true, scope: "original" },
          ],
        }),
      ),
      q("b", metadata({ scope: "original" })),
    ]).join(" "),
  ).toContain("scope");
  expect(
    validateQuestionMetadata([
      q(
        "a",
        metadata({
          scope: "original",
          implications: [
            { when: true, questionId: "b", value: false, scope: "original" },
          ],
        }),
      ),
      q("b", metadata({ scope: "remake" })),
    ]).join(" "),
  ).toContain("scope");
  expect(
    validateQuestionMetadata([
      q(
        "a",
        metadata({
          scope: "original",
          implications: [
            { when: true, questionId: "b", value: true, scope: "original" },
          ],
        }),
      ),
      q(
        "b",
        metadata({
          scope: "original",
          implications: [
            { when: true, questionId: "a", value: true, scope: "original" },
          ],
        }),
      ),
    ]).join(" "),
  ).toContain("implication cycle");
});

it("rejects conflicting implications and equivalents with different portrayal scope", () => {
  const questions = [
    q("a", {
      equivalenceGroup: "same",
      scope: "original",
      implications: [
        { when: true, questionId: "b", value: true, scope: "original" },
        { when: true, questionId: "b", value: false, scope: "original" },
      ],
    } as Partial<Question>),
    q("b", { scope: "original" } as Partial<Question>),
    q("c", { equivalenceGroup: "same", scope: "remake" } as Partial<Question>),
  ];
  const errors = validateQuestionMetadata(questions).join(" ");
  expect(errors).toContain("contradictory implication");
  expect(errors).toContain("equivalent scope");
});
