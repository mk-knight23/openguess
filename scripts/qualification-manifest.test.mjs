import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";
import {
  assertQualifiedManifest,
  universeDigest,
} from "./qualification-manifest.mjs";

function fixture() {
  const character = (id, value) => ({
    id,
    name: id,
    category: "real",
    description: "",
    tags: [],
    color: "",
    initials: "",
    traits: { clue: value },
  });
  const characters = [
    character("a", true),
    { ...character("b", false), featured: true },
  ];
  const questions = [
    { id: "clue", text: "Clue?", hint: "", topic: "identity" },
  ];
  const digest = universeDigest(characters, questions);
  characters[0].qualification = {
    screened: true,
    qualified: true,
    replay: {
      status: "passed",
      universeDigest: digest,
      seeds: [1, 2, 3, 4, 5],
    },
  };
  return {
    theme: "people",
    characters,
    questions,
    quality: { qualifiedUniverseDigest: digest },
  };
}
it("accepts a receipt bound to the actual final playable universe", () => {
  expect(() => assertQualifiedManifest(fixture())).not.toThrow();
});
it.each(["rival", "trait", "question"])(
  "rejects a stale receipt after changing a %s",
  (change) => {
    const pack = fixture();
    if (change === "rival")
      pack.characters.push({ ...pack.characters[1], id: "c" });
    if (change === "trait") pack.characters[0].traits.clue = false;
    if (change === "question") pack.questions[0].text = "Changed meaning?";
    expect(() => assertQualifiedManifest(pack)).toThrow(/digest/i);
  },
);
it("rejects invalid qualification claims and duplicate playable identities", () => {
  const pack = fixture();
  pack.characters[0].qualification.replay.universeDigest = "b".repeat(64);
  expect(() => assertQualifiedManifest(pack)).toThrow(/qualification/i);
  const duplicate = fixture();
  duplicate.characters.push({ ...duplicate.characters[0] });
  expect(() => assertQualifiedManifest(duplicate)).toThrow(/duplicate/i);
});
it("ignores quarantined records and derived qualification fields when hashing", () => {
  const pack = fixture();
  pack.characters.push({ id: "quarantine", traits: {} });
  pack.characters[0].qualification.reasons = [];
  expect(() => assertQualifiedManifest(pack)).not.toThrow();
});
it("matches the Python producer byte contract including unicode and reordered keys", () => {
  const pack = fixture();
  pack.characters[0].name = "Étoile 🪐";
  const python = execFileSync(
    "python3",
    [
      "-c",
      "import sys,json;sys.path.insert(0,'scripts/knowledge');from qualify import universe_digest;p=json.load(sys.stdin);print(universe_digest(p['characters'],p['questions']))",
    ],
    { input: JSON.stringify(pack), encoding: "utf8" },
  ).trim();
  expect(universeDigest(pack.characters, pack.questions)).toBe(python);
});
it("leaves legacy packs without promoted profiles valid", () => {
  const pack = fixture();
  delete pack.characters[0].qualification;
  expect(() => assertQualifiedManifest(pack)).not.toThrow();
});
it("binds the familiar runtime question set rather than specialist screening questions", () => {
  const pack = fixture();
  pack.questions.push({
    id: "specialist",
    text: "Obscure?",
    hint: "",
    answerability: "specialist",
  });
  const digest = universeDigest(pack.characters, pack.questions);
  pack.quality.qualifiedUniverseDigest = digest;
  pack.characters[0].qualification.replay.universeDigest = digest;
  expect(() => assertQualifiedManifest(pack)).toThrow(/digest/i);
});
it.each([0.5, Number.MAX_SAFE_INTEGER + 1])(
  "rejects noncanonical numeric metadata %s",
  (number) => {
    const pack = fixture();
    pack.characters[0].metadata = { number };
    expect(() => universeDigest(pack.characters, pack.questions)).toThrow(
      /safe integer/i,
    );
  },
);
