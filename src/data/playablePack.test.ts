import { expect, it } from "vitest";
import type { Character, DataPack } from "../types";
import { playablePack, playableCounts } from "./playablePack";
const digest = "a".repeat(64);
function subject(id: string, patch: Partial<Character> = {}): Character {
  return {
    id,
    name: id,
    category: "real",
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: {},
    ...patch,
  };
}
const qualified = {
  screened: true,
  qualified: true,
  replay: {
    status: "passed" as const,
    universeDigest: digest,
    seeds: [1, 2, 3, 4, 5],
  },
};
function pack(
  characters: Character[],
  quality: DataPack["quality"] = { qualifiedUniverseDigest: digest },
): DataPack {
  return {
    theme: "people",
    version: "test",
    characters,
    questions: [
      {
        id: "familiar",
        text: "Familiar?",
        hint: "",
        answerability: "familiar",
      },
      {
        id: "specialist",
        text: "Obscure?",
        hint: "",
        answerability: "specialist",
      },
    ],
    quality,
    source: {
      url: "https://example.org",
      license: "CC0-1.0",
      retrievedAt: "2026-10-17",
    },
  };
}
it("uses the same expanded qualified pool while preserving legacy featured subjects", () => {
  const input = pack([
    subject("old", { featured: true }),
    subject("new", { qualification: qualified }),
    subject("sparse"),
  ]);
  const output = playablePack(input);
  expect(output.characters.map((c) => c.id)).toEqual(["old", "new"]);
  expect(output.questions.map((q) => q.id)).toEqual(["familiar"]);
  expect(playableCounts(input)).toEqual({
    records: 3,
    qualified: 1,
    legacyFeatured: 1,
    playable: 2,
    quarantined: 1,
  });
});
it("does not accept replay pending, mismatched universe or repeated seed receipts", () => {
  const input = pack([
    subject("pending", {
      qualification: {
        ...qualified,
        replay: { ...qualified.replay, status: "pending" },
      },
    }),
    subject("wrong-universe", {
      qualification: {
        ...qualified,
        replay: { ...qualified.replay, universeDigest: "b".repeat(64) },
      },
    }),
    subject("one-seed", {
      qualification: {
        ...qualified,
        replay: { ...qualified.replay, seeds: [1, 1, 1, 1, 1] },
      },
    }),
    subject("unscreened", { qualification: { ...qualified, screened: false } }),
  ]);
  expect(playablePack(input).characters).toEqual([]);
});
it("an explicit failed qualification cannot fall back to featured status", () => {
  expect(
    playablePack(
      pack([
        subject("failed", {
          featured: true,
          qualification: { ...qualified, qualified: false },
        }),
      ]),
    ).characters,
  ).toEqual([]);
});
it("does not count ambiguous duplicate canonical IDs", () => {
  const input = pack([
    subject("same", { qualification: qualified }),
    subject("same", { qualification: qualified }),
  ]);
  expect(playableCounts(input).qualified).toBe(0);
  expect(playablePack(input).characters).toEqual([]);
});
it("retains unmarked legacy fixture packs but never treats them as newly qualified", () => {
  const input = pack([subject("legacy")], {});
  expect(playablePack(input)).toBe(input);
  expect(playableCounts(input).qualified).toBe(0);
});
it("a declared qualification pool with no valid receipt never silently falls back to all records", () => {
  const input = pack([subject("sparse")]);
  expect(playablePack(input).characters).toEqual([]);
});
