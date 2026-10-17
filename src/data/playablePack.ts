import type { Character, DataPack } from "../types";

function isQualified(character: Character, pack: DataPack): boolean {
  const qualification = character.qualification;
  const digest = pack.quality.qualifiedUniverseDigest;
  if (
    !qualification?.qualified ||
    qualification.screened !== true ||
    typeof digest !== "string" ||
    !/^[a-f0-9]{64}$/.test(digest)
  )
    return false;
  const replay = qualification.replay;
  return (
    replay.status === "passed" &&
    replay.universeDigest === digest &&
    new Set(
      replay.seeds.filter(
        (seed) => Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff,
      ),
    ).size >= 5
  );
}
function projection(pack: DataPack) {
  const counts = new Map<string, number>();
  for (const character of pack.characters)
    counts.set(character.id, (counts.get(character.id) ?? 0) + 1);
  const qualified: Character[] = [],
    legacy: Character[] = [];
  const managed =
    "qualifiedUniverseDigest" in pack.quality ||
    pack.characters.some((c) => c.featured || c.qualification);
  for (const character of pack.characters) {
    if (counts.get(character.id) !== 1) continue;
    if (isQualified(character, pack)) qualified.push(character);
    else if (!character.qualification && character.featured)
      legacy.push(character);
  }
  const accepted = new Set([...qualified, ...legacy]);
  return {
    managed,
    qualified,
    legacy,
    characters: pack.characters.filter((c) => accepted.has(c)),
  };
}
/** One projection for default gameplay, daily targets, counts and evaluation. */
export function playablePack(pack: DataPack): DataPack {
  const selected = projection(pack);
  if (!selected.managed) return pack;
  return {
    ...pack,
    characters: selected.characters,
    questions: pack.questions.filter((q) => q.answerability !== "specialist"),
  };
}
export function playableCounts(pack: DataPack) {
  const selected = projection(pack);
  const playable = selected.managed
    ? selected.characters.length
    : pack.characters.length;
  return {
    records: pack.characters.length,
    qualified: selected.qualified.length,
    legacyFeatured: selected.legacy.length,
    playable,
    quarantined: pack.characters.length - playable,
  };
}
