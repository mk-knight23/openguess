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
