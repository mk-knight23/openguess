import type { DataPack } from "../types";

/** Featured conversations use reviewed familiar clues; legacy packs still load. */
export function featuredPack(pack: DataPack): DataPack {
  const characters = pack.characters.filter((c) => c.featured);
  if (!characters.length) return pack;
  return {
    ...pack,
    characters,
    questions: pack.questions.filter((q) => q.answerability !== "specialist"),
  };
}
