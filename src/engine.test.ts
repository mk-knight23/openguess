import { describe, expect, it } from "vitest";
import { rankCandidates, selectQuestion, shouldGuess } from "./engine";
import type { Character, Question, AnswerRecord } from "./types";
const make = (id: string, traits: Character["traits"]): Character => ({
  id,
  name: id,
  description: "",
  category: "fictional",
  tags: [],
  color: "#fff",
  initials: id,
  traits,
});
const questions: Question[] = ["a", "b", "c"].map((id) => ({
  id,
  text: id,
  hint: "",
}));
const catalog = [
  make("one", { a: true, b: true, c: false }),
  make("two", { a: false, b: true, c: true }),
  make("three", { a: false, b: false, c: false }),
];
describe("candidate inference", () => {
  it("uses uniform priors and normalized positive soft evidence", () => {
    expect(rankCandidates(catalog, []).map((c) => c.probability)).toEqual([
      1 / 3,
      1 / 3,
      1 / 3,
    ]);
    const ranked = rankCandidates(catalog, [
      { questionId: "a", answer: "yes" },
    ]);
    expect(ranked[0].character.id).toBe("one");
    expect(ranked.reduce((sum, c) => sum + c.probability, 0)).toBeCloseTo(1);
    expect(ranked.every((c) => c.probability > 0 && c.probability < 1)).toBe(
      true,
    );
  });
  it("unknown provides no evidence and missing traits preserve uncertainty", () => {
    expect(
      rankCandidates(catalog, [{ questionId: "a", answer: "unknown" }]),
    ).toEqual(rankCandidates(catalog, []));
    const incomplete = [make("a", { a: null }), make("b", {})];
    expect(
      rankCandidates(incomplete, [{ questionId: "a", answer: "yes" }]).map(
        (c) => c.probability,
      ),
    ).toEqual([0.5, 0.5]);
  });
  it("probably is weaker evidence than yes", () => {
    const probability = (answer: "yes" | "probably") =>
      rankCandidates(catalog, [{ questionId: "a", answer }])[0].probability;
    expect(probability("probably")).toBeLessThan(probability("yes"));
  });
  it("replays undo, rejects explicitly, and handles all rejected", () => {
    const history: AnswerRecord[] = [
      { questionId: "a", answer: "yes" },
      { questionId: "b", answer: "no" },
    ];
    expect(rankCandidates(catalog, history.slice(0, -1))).toEqual(
      rankCandidates(catalog, [history[0]]),
    );
    expect(
      rankCandidates(catalog, [], ["one"]).map((c) => c.character.id),
    ).toEqual(["three", "two"]);
    expect(
      rankCandidates(
        catalog,
        [],
        catalog.map((c) => c.id),
      ),
    ).toEqual([]);
  });
  it("contradictory evidence remains finite without pretending certainty", () => {
    const history: AnswerRecord[] = Array.from({ length: 1000 }, (_, i) => ({
      questionId: "a",
      answer: i % 2 ? "yes" : "no",
    }));
    const ranked = rankCandidates(catalog, history);
    expect(ranked.every((c) => Number.isFinite(c.probability))).toBe(true);
    expect(ranked[0].probability).toBeCloseTo(1 / 3);
  });
});
describe("adaptive questions", () => {
  it("never repeats answered questions, including unknown", () => {
    const history: AnswerRecord[] = [{ questionId: "a", answer: "unknown" }];
    expect(
      selectQuestion(rankCandidates(catalog, history), questions, history)
        ?.question.id,
    ).not.toBe("a");
  });
  it("prefers a balanced partition and deterministically breaks ties by ID", () => {
    const candidates = rankCandidates(
      [
        make("a", { a: true, b: true }),
        make("b", { a: true, b: false }),
        make("c", { a: true, b: true }),
        make("d", { a: false, b: false }),
      ],
      [],
    );
    expect(selectQuestion(candidates, questions, [])?.question.id).toBe("b");
    expect(
      selectQuestion(rankCandidates(catalog, []), [...questions].reverse(), [])
        ?.question.id,
    ).toBe("a");
  });
  it("returns null when exhausted or no informative traits exist", () => {
    expect(selectQuestion([], questions, [])).toBeNull();
    expect(
      selectQuestion(
        rankCandidates([make("a", { a: true }), make("b", { a: true })], []),
        questions,
        [],
      ),
    ).toBeNull();
    expect(
      selectQuestion(
        rankCandidates(catalog, []),
        questions,
        questions.map((q) => ({ questionId: q.id, answer: "unknown" })),
      ),
    ).toBeNull();
  });
  it("can recover each distinct synthetic catalog member using truthful adaptive answers", () => {
    const synthetic = Array.from({ length: 8 }, (_, n) =>
      make(String(n), {
        a: Boolean(n & 1),
        b: Boolean(n & 2),
        c: Boolean(n & 4),
      }),
    );
    for (const target of synthetic) {
      const history: AnswerRecord[] = [];
      for (let i = 0; i < 3; i++) {
        const next = selectQuestion(
          rankCandidates(synthetic, history),
          questions,
          history,
        );
        expect(next).not.toBeNull();
        history.push({
          questionId: next!.question.id,
          answer: target.traits[next!.question.id] ? "yes" : "no",
        });
      }
      expect(rankCandidates(synthetic, history)[0].character.id).toBe(
        target.id,
      );
    }
  });
  it("requires sufficient confidence and informative answers unless one candidate remains", () => {
    expect(shouldGuess([], 10)).toBe(false);
    expect(shouldGuess(rankCandidates(catalog, []), 10)).toBe(false);
    const strong = [
      { character: catalog[0], probability: 0.9 },
      { character: catalog[1], probability: 0.1 },
    ];
    expect(shouldGuess(strong, 2)).toBe(false);
    expect(shouldGuess(strong, 3)).toBe(true);
    expect(shouldGuess(strong.slice(0, 1), 0)).toBe(true);
  });
});

describe("aggregated question scoring", () => {
  it("matches independent response/posterior entropy calculation for sparse weighted catalogs", () => {
    const choices = [
      "yes",
      "probably",
      "unknown",
      "probably-not",
      "no",
    ] as const;
    const yes = [0.65, 0.25, 0.05, 0.03, 0.02];
    const no = [...yes].reverse();
    const entropy = (weights: number[]) =>
      weights.reduce((sum, p) => sum - (p > 0 ? p * Math.log2(p) : 0), 0);
    for (let seed = 0; seed < 12; seed++) {
      const characters = Array.from({ length: 19 }, (_, i) =>
        make(
          `c${i}`,
          Object.fromEntries(
            questions.map((q, j) => {
              const value = (i * 7 + j * 3 + seed) % 4;
              return [q.id, value < 2 ? null : value === 2];
            }),
          ),
        ),
      );
      const candidates = rankCandidates(
        characters,
        seed % 2 ? [{ questionId: "a", answer: "probably" }] : [],
      );
      const prior = entropy(candidates.map((c) => c.probability));
      const reference = questions
        .map((question) => {
          let expected = 0;
          choices.forEach((_, index) => {
            const joints = candidates.map((c) => {
              const trait = c.character.traits[question.id];
              return (
                c.probability *
                (trait === true
                  ? yes[index]
                  : trait === false
                    ? no[index]
                    : (yes[index] + no[index]) / 2)
              );
            });
            const total = joints.reduce((a, b) => a + b, 0);
            expected += total * entropy(joints.map((p) => p / total));
          });
          return { question, informationGain: Math.max(0, prior - expected) };
        })
        .sort(
          (a, b) =>
            b.informationGain - a.informationGain ||
            a.question.id.localeCompare(b.question.id),
        );
      const actual = selectQuestion(candidates, questions, []);
      expect(actual?.informationGain).toBeCloseTo(
        reference[0].informationGain,
        10,
      );
      // Equal gains retain lexicographic ID order with the engine's numerical tolerance.
      const firstBest = questions.find(
        (q) =>
          Math.abs(
            reference.find((r) => r.question.id === q.id)!.informationGain -
              reference[0].informationGain,
          ) < 1e-10,
      );
      expect(actual?.question.id).toBe(firstBest?.id);
    }
  });
});
it("ignores unrelated sparse traits and zero-weight members when selecting evidence", () => {
  const candidates = [
    { character: make("a", { a: true, unrelated: true }), probability: 0.5 },
    { character: make("b", { a: false, unrelated: false }), probability: 0.5 },
    { character: make("zero", { a: null, b: true }), probability: 0 },
  ];
  expect(selectQuestion(candidates, questions, [])?.question.id).toBe("a");
  expect(
    selectQuestion(candidates, questions, [
      { questionId: "a", answer: "unknown" },
    ]),
  ).toBeNull();
  const allMissing = [
    { character: make("a", {}), probability: 0.1 },
    { character: make("b", { a: null }), probability: 0.9 },
  ];
  expect(selectQuestion(allMissing, questions, [])).toBeNull();
});
describe("semantic question policy", () => {
  it("excludes legacy spelling questions even when they perfectly split the pool", () => {
    const candidates = rankCandidates(
      [
        make("a", { name_letter_a: true, occupation: true }),
        make("b", { name_letter_a: false, occupation: false }),
        make("c", { name_letter_a: true, occupation: false }),
        make("d", { name_letter_a: false, occupation: false }),
      ],
      [],
    );
    const semantic = {
      id: "occupation",
      text: "Do they perform for an audience?",
      hint: "",
    };
    const spelling = {
      id: "name_letter_a",
      text: "Does the name contain A?",
      hint: "",
    };
    expect(
      selectQuestion(candidates, [spelling, semantic], [])?.question.id,
    ).toBe("occupation");
    expect(selectQuestion(candidates, [spelling], [])).toBeNull();
  });
  it("prefers known broad evidence over a sparsely documented identity clue", () => {
    const candidates = rankCandidates(
      Array.from({ length: 10 }, (_, n) =>
        make(String(n), {
          broad: n < 3,
          sparse: n < 3 ? true : null,
        }),
      ),
      [],
    );
    const qs = [
      { id: "broad", text: "Is it a living thing?", hint: "" },
      { id: "sparse", text: "Was it created in 1893?", hint: "" },
    ];
    expect(selectQuestion(candidates, qs, [])?.question.id).toBe("broad");
  });
  it("varies equally informative families without choosing an irrelevant question", () => {
    const candidates = rankCandidates(
      [
        make("a", { a: true, b: true, weak: true }),
        make("b", { a: false, b: false, weak: true }),
      ],
      [],
    );
    const qs = [
      { id: "previous", text: "Previous", hint: "", property: "occupation" },
      { id: "a", text: "Same family", hint: "", property: "occupation" },
      { id: "b", text: "Other family", hint: "", property: "appearance" },
      { id: "weak", text: "Irrelevant", hint: "", property: "origin" },
    ];
    expect(
      selectQuestion(candidates, qs, [
        { questionId: "previous", answer: "yes" },
      ])?.question.id,
    ).toBe("b");
  });
});
it("keeps a clearly stronger same-family split instead of forced variety", () => {
  const candidates = rankCandidates(
    Array.from({ length: 10 }, (_, n) =>
      make(String(n), { strong: n < 5, weak: n < 1 }),
    ),
    [],
  );
  const qs = [
    { id: "previous", text: "Previous", hint: "", property: "occupation" },
    { id: "strong", text: "Performing arts", hint: "", property: "occupation" },
    { id: "weak", text: "Rare birthplace", hint: "", property: "birthplace" },
  ];
  expect(
    selectQuestion(candidates, qs, [{ questionId: "previous", answer: "yes" }])
      ?.question.id,
  ).toBe("strong");
});
it("blocks unmarked spelling text and name-property clues without rejecting semantic namesakes", () => {
  const candidates = rankCandidates(
    [
      make("a", { custom: true, named: true }),
      make("b", { custom: false, named: false }),
    ],
    [],
  );
  expect(
    selectQuestion(
      candidates,
      [
        {
          id: "custom",
          text: "Does their name contain the letter A?",
          hint: "",
        },
      ],
      [],
    ),
  ).toBeNull();
  expect(
    selectQuestion(
      candidates,
      [
        {
          id: "custom",
          text: "Is the first letter of their name S?",
          hint: "",
        },
      ],
      [],
    ),
  ).toBeNull();
  expect(
    selectQuestion(
      candidates,
      [{ id: "custom", text: "Do they have a short name?", hint: "" }],
      [],
    ),
  ).toBeNull();
  expect(
    selectQuestion(
      candidates,
      [
        {
          id: "custom",
          text: "Is their name long?",
          hint: "",
          property: "name",
        },
      ],
      [],
    ),
  ).toBeNull();
  expect(
    selectQuestion(
      candidates,
      [
        {
          id: "named",
          text: "Is this object named after its inventor?",
          hint: "",
        },
      ],
      [],
    )?.question.id,
  ).toBe("named");
});
describe("seeded near-equal semantic variety", () => {
  const candidates = rankCandidates(
    [
      make("a", { a: true, b: true, c: false, d: false }),
      make("b", { a: false, b: false, c: true, d: true }),
    ],
    [],
  );
  const qs = ["a", "b", "c", "d"].map((id) => ({
    id,
    text: `Semantic ${id}`,
    hint: "",
  }));
  it("varies equally useful questions across seeds while replaying the same seed and undo", () => {
    const picks = new Set(
      Array.from(
        { length: 20 },
        (_, seed) => selectQuestion(candidates, qs, [], seed + 1)?.question.id,
      ),
    );
    expect(picks.size).toBeGreaterThan(1);
    const first = selectQuestion(candidates, qs, [], 42);
    const history: AnswerRecord[] = [
      { questionId: first!.question.id, answer: "yes" },
    ];
    expect(selectQuestion(candidates, qs, history, 42)?.question.id).not.toBe(
      first?.question.id,
    );
    expect(selectQuestion(candidates, qs, history.slice(0, -1), 42)).toEqual(
      first,
    );
    expect(selectQuestion(candidates, [...qs].reverse(), [], 42)).toEqual(
      first,
    );
  });
  it("never trades a strong question for a weak question just to vary a round", () => {
    const pool = rankCandidates(
      Array.from({ length: 10 }, (_, n) =>
        make(String(n), { strong: n < 5, weak: n === 0 }),
      ),
      [],
    );
    const available = [
      { id: "strong", text: "A useful broad clue", hint: "" },
      { id: "weak", text: "A rare clue", hint: "" },
    ];
    for (let seed = 1; seed < 20; seed++)
      expect(selectQuestion(pool, available, [], seed)?.question.id).toBe(
        "strong",
      );
  });
});
