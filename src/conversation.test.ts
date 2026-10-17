import { expect, it } from "vitest";
import { buildConversationContext } from "./conversation";
import type { Answer, Question } from "./types";
const questions: Question[] = [
  {
    id: "origin",
    text: "Origin",
    hint: "",
    scope: "work",
    implications: [
      { when: true, questionId: "world", value: true, scope: "work" },
    ],
  },
  {
    id: "world",
    text: "World",
    hint: "",
    scope: "work",
    implications: [
      { when: true, questionId: "school", value: true, scope: "work" },
    ],
  },
  { id: "school", text: "School", hint: "", scope: "work" },
];
it("retains original evidence lineage through scoped definite implications", () => {
  const context = buildConversationContext(questions, [
    { questionId: "origin", answer: "yes" },
  ]);
  expect(context.established.get("school")).toEqual({
    value: true,
    evidenceIds: ["origin"],
  });
});
it.each<Answer>(["probably", "probably-not", "unknown"])(
  "%s cannot establish Boolean implications",
  (answer) => {
    expect(
      buildConversationContext(questions, [{ questionId: "origin", answer }])
        .established.size,
    ).toBe(0);
  },
);
it("does not infer a broader parent from a negative child or cross scope", () => {
  expect(
    buildConversationContext(questions, [
      { questionId: "school", answer: "no" },
    ]).established.has("origin"),
  ).toBe(false);
  const altered = questions.map((q) =>
    q.id === "world" ? { ...q, scope: "other" } : q,
  );
  expect(
    buildConversationContext(altered, [
      { questionId: "origin", answer: "yes" },
    ]).established.has("world"),
  ).toBe(false);
});
it("contradictory observations retract their downstream implications", () => {
  const context = buildConversationContext(questions, [
    { questionId: "origin", answer: "yes" },
    { questionId: "world", answer: "no" },
  ]);
  expect(context.established.has("world")).toBe(false);
  expect(context.established.has("school")).toBe(false);
});

it("retains directly observed C when conflicting B is retracted before propagation", () => {
  const chain: Question[] = [
    {
      id: "a",
      text: "A",
      hint: "",
      scope: "work",
      implications: [
        { when: true, questionId: "b", value: true, scope: "work" },
      ],
    },
    {
      id: "b",
      text: "B",
      hint: "",
      scope: "work",
      implications: [
        { when: false, questionId: "c", value: false, scope: "work" },
      ],
    },
    { id: "c", text: "C", hint: "", scope: "work" },
  ];
  const context = buildConversationContext(chain, [
    { questionId: "a", answer: "yes" },
    { questionId: "b", answer: "no" },
    { questionId: "c", answer: "yes" },
  ]);
  expect(context.established.has("b")).toBe(false);
  expect(context.established.get("c")).toEqual({
    value: true,
    evidenceIds: ["c"],
  });
});
