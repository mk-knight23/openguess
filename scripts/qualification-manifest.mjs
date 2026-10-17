import { createHash } from "node:crypto";
import { playablePack } from "../src/data/playablePack.ts";

// Match Python's Unicode code-point ordering, including non-BMP labels/keys.
function compare(left, right) {
  const a = Array.from(left, (c) => c.codePointAt(0));
  const b = Array.from(right, (c) => c.codePointAt(0));
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}
function canonicalJson(value) {
  if (typeof value === "number" && !Number.isSafeInteger(value))
    throw new Error("Universe digest only supports safe integer numbers");
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.keys(value)
      .sort(compare)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  const serialized = JSON.stringify(value);
  if (serialized === undefined)
    throw new Error("Universe digest requires JSON values");
  return serialized;
}
/** Exact producer contract: all fields except derived qualification receipts. */
export function universeDigest(subjects, questions) {
  const semanticSubjects = subjects.map(
    ({ qualification: _receipt, ...subject }) => subject,
  );
  const byId = (a, b) => compare(a.id, b.id);
  return createHash("sha256")
    .update(
      canonicalJson({
        subjects: semanticSubjects.sort(byId),
        questions: [...questions].sort(byId),
      }),
      "utf8",
    )
    .digest("hex");
}
/** Build boundary: browser projection trusts only manifests checked here. */
export function assertQualifiedManifest(pack) {
  const promoted = pack.characters.filter((c) => c.qualification?.qualified);
  if (!promoted.length) return;
  const ids = new Set();
  for (const character of pack.characters) {
    if (ids.has(character.id))
      throw new Error(`${pack.theme}: duplicate subject ${character.id}`);
    ids.add(character.id);
  }
  const playable = playablePack(pack);
  for (const character of promoted)
    if (!playable.characters.includes(character))
      throw new Error(
        `${pack.theme}/${character.id}: invalid qualification receipt`,
      );
  const actual = universeDigest(playable.characters, playable.questions);
  if (pack.quality.qualifiedUniverseDigest !== actual)
    throw new Error(
      `${pack.theme}: stale qualified universe digest; replay the final playable universe`,
    );
}
