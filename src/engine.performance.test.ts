import { expect, it } from "vitest";
import { rankCandidates, selectQuestion } from "./engine";
import type { Character, Question } from "./types";

it("selects across 2,500 sparse entities and 150 questions without a UI-length stall", () => {
  const questions: Question[] = Array.from({ length: 150 }, (_, n) => ({
    id: `q${n}`,
    text: `Question ${n}`,
    hint: "",
  }));
  const characters: Character[] = Array.from({ length: 2500 }, (_, n) => ({
    id: `c${n}`,
    name: `Entity ${n}`,
    description: "",
    category: "fictional",
    tags: [],
    color: "#fff",
    initials: "E",
    traits: Object.fromEntries(
      questions.map((q, i) => [
        q.id,
        (n + i) % 5 === 0 ? null : Boolean((n * 17 + i * 13) % 7 < 3),
      ]),
    ),
  }));
  const candidates = rankCandidates(characters, []);
  const started = performance.now();
  const selected = selectQuestion(candidates, questions, []);
  const elapsed = performance.now() - started;
  console.info(`2,500 entities × 150 questions: ${elapsed.toFixed(1)} ms`);
  expect(selected).not.toBeNull();
  expect(elapsed).toBeLessThan(1000);
});
it("does not probe every missing fact when scoring a sparse 2,037-question pack", () => {
  let factReads = 0;
  const questions: Question[] = Array.from({ length: 2037 }, (_, n) => ({
    id: `q${n}`,
    text: `Q${n}`,
    hint: "",
  }));
  const characters: Character[] = Array.from({ length: 1100 }, (_, n) => ({
    id: `c${n}`,
    name: `Entity ${n}`,
    description: "",
    category: "real",
    tags: [],
    color: "#fff",
    initials: "E",
    traits: new Proxy(
      Object.fromEntries(
        Array.from({ length: 35 }, (_, i) => [
          `q${(n + i) % 2037}`,
          i % 3 === 0 ? null : i % 2 === 0,
        ]),
      ),
      {
        get(target, key, receiver) {
          if (typeof key === "string") factReads++;
          return Reflect.get(target, key, receiver);
        },
      },
    ),
  }));
  expect(
    selectQuestion(rankCandidates(characters, []), questions, []),
  ).not.toBeNull();
  // Complexity assertion, independent of device speed: scoring should inspect
  // present facts, not 2.2 million absent lookups.
  expect(factReads).toBeLessThanOrEqual(1100 * 35);
});
