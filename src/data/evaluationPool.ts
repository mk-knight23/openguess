import type { DataPack } from "../types";
import { playablePack } from "./playablePack.ts";
export type EvaluationCohort =
  "playable" | "legacy-isolated" | "legacy-expanded";
/** The evaluated targets and their rivals must come from the same shipped pool. */
export function evaluationPool(
  pack: DataPack,
  cohort: EvaluationCohort,
  minimumTargets = 1,
) {
  if (!Number.isInteger(minimumTargets) || minimumTargets < 1)
    throw new RangeError("Minimum targets must be a positive integer");
  const playable = playablePack(pack);
  const targets =
    cohort === "playable"
      ? playable.characters
      : playable.characters.filter((c) => c.featured && !c.qualification);
  if (!targets.length)
    throw new Error(`Empty evaluation target pool: ${pack.theme}/${cohort}`);
  if (targets.length < minimumTargets)
    throw new Error(
      `${pack.theme}: ${targets.length} targets cannot satisfy ${minimumTargets} required targets`,
    );
  return {
    universe:
      cohort === "legacy-isolated"
        ? { ...playable, characters: targets }
        : playable,
    targets,
  };
}
