import { expect, it } from "vitest";
import type { Character, DataPack } from "../types";
import { evaluationPool } from "./evaluationPool";
const digest = "c".repeat(64);
const old: Character = {
  id: "old",
  name: "Old",
  category: "real",
  description: "",
  tags: [],
  color: "",
  initials: "",
  traits: {},
  featured: true,
};
const added: Character = {
  ...old,
  id: "new",
  name: "New",
  featured: false,
  qualification: {
    screened: true,
    qualified: true,
    replay: {
      status: "passed",
      universeDigest: digest,
      seeds: [1, 2, 3, 4, 5],
    },
  },
};
const pack: DataPack = {
  theme: "people",
  version: "test",
  characters: [old, added, { ...old, id: "unqualified", featured: false }],
  questions: [],
  source: { url: "", license: "", retrievedAt: "" },
  quality: { qualifiedUniverseDigest: digest },
};
it("evaluates every playable subject against the entire playable category by default", () => {
  const { universe, targets } = evaluationPool(pack, "playable");
  expect(universe.characters.map((c) => c.id)).toEqual(["old", "new"]);
  expect(targets.map((c) => c.id)).toEqual(["old", "new"]);
});
it("keeps baseline cohort and hypothesis-universe comparisons separate", () => {
  const isolated = evaluationPool(pack, "legacy-isolated");
  const expanded = evaluationPool(pack, "legacy-expanded");
  expect(isolated.universe.characters.map((c) => c.id)).toEqual(["old"]);
  expect(expanded.universe.characters.map((c) => c.id)).toEqual(["old", "new"]);
  expect(expanded.targets.map((c) => c.id)).toEqual(["old"]);
});
it("fails on an empty target pool instead of publishing a zero-round success", () => {
  expect(() => evaluationPool({ ...pack, characters: [] }, "playable")).toThrow(
    /empty/i,
  );
});
it("does not allow a 128-target report to satisfy an explicit 5000 target requirement", () => {
  expect(() => evaluationPool(pack, "playable", 5000)).toThrow(/5000/);
});
