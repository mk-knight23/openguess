import type { Character, Question, Theme } from "./types";
const themes: Theme[] = ["people", "fictional", "animals", "objects", "movies"];
/** Empty metadata is deliberately valid for older independently authored packs. */
export function validateQuestionMetadata(
  questions: Question[],
  theme?: Theme,
  characters: Character[] = [],
): string[] {
  const errors: string[] = [];
  const ids = new Map(questions.map((q) => [q.id, q]));
  if (ids.size !== questions.length) errors.push("duplicate question IDs");
  for (const q of questions) {
    for (const group of [q.relatedGroup, q.equivalenceGroup])
      if (group !== undefined && (typeof group !== "string" || !group.trim()))
        errors.push(`${q.id}: invalid group`);
    if (q.tier && !["broad", "signature"].includes(q.tier))
      errors.push(`${q.id}: invalid tier`);
    if (
      q.answerability &&
      !["familiar", "specialist"].includes(q.answerability)
    )
      errors.push(`${q.id}: invalid answerability`);
    if (
      q.themes &&
      (!q.themes.length ||
        q.themes.some((t) => !themes.includes(t)) ||
        (theme && !q.themes.includes(theme)))
    )
      errors.push(`${q.id}: invalid theme scope`);
    const requirements = new Map<string, boolean>();
    for (const prerequisite of q.prerequisites ?? []) {
      const parent = ids.get(prerequisite.questionId);
      if (!parent)
        errors.push(`${q.id}: unknown prerequisite ${prerequisite.questionId}`);
      if (
        typeof prerequisite.value !== "boolean" ||
        (requirements.has(prerequisite.questionId) &&
          requirements.get(prerequisite.questionId) !== prerequisite.value)
      )
        errors.push(`${q.id}: contradictory prerequisite`);
      requirements.set(prerequisite.questionId, prerequisite.value);
      if (
        parent?.themes &&
        q.themes &&
        !q.themes.some((t) => parent.themes!.includes(t))
      )
        errors.push(`${q.id}: contradictory prerequisite theme`);
    }
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      errors.push(`${id}: prerequisite cycle`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const p of ids.get(id)?.prerequisites ?? [])
      if (ids.has(p.questionId)) visit(p.questionId);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids.keys()) visit(id);
  for (const c of characters) {
    const equivalents = new Map<string, boolean>();
    for (const q of questions) {
      const fact = c.traits[q.id];
      if (!q.equivalenceGroup || typeof fact !== "boolean") continue;
      if (
        equivalents.has(q.equivalenceGroup) &&
        equivalents.get(q.equivalenceGroup) !== fact
      )
        errors.push(
          `${c.id}: conflicting equivalent facts ${q.equivalenceGroup}`,
        );
      equivalents.set(q.equivalenceGroup, fact);
    }
  }
  for (const c of characters)
    for (const [id, source] of Object.entries(c.factSources ?? {})) {
      if (
        !ids.has(id) ||
        typeof c.traits[id] !== "boolean" ||
        !source.scope?.trim() ||
        !/^https?:\/\//.test(source.url)
      )
        errors.push(`${c.id}: invalid fact source ${id}`);
    }
  return errors;
}
