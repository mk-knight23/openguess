import type { AnswerRecord, Question } from "./types";

export interface EstablishedProposition {
  value: boolean;
  /** Original player answers; derived propositions never add confirmations. */
  evidenceIds: string[];
}
export function questionTopic(question: Question): string | undefined {
  return question.topic ?? question.family ?? question.property;
}
/** Rebuilt on every selection, so undo/corrections cannot leave stale closure. */
export function buildConversationContext(
  questions: Question[],
  history: AnswerRecord[],
) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const blocked = new Set<string>();
  let established = new Map<string, EstablishedProposition>();
  // A conflicting proposition and its descendants must be retracted before
  // propagation resumes. Bound the outer loop by the number of propositions.
  for (let pass = 0; pass <= questions.length; pass++) {
    established = new Map();
    let conflict = false;
    const add = (id: string, value: boolean, evidenceIds: string[]) => {
      if (blocked.has(id) || !byId.has(id)) return false;
      const previous = established.get(id);
      if (previous && previous.value !== value) {
        blocked.add(id);
        established.delete(id);
        conflict = true;
        return false;
      }
      const merged = [
        ...new Set([...(previous?.evidenceIds ?? []), ...evidenceIds]),
      ].sort();
      if (previous && merged.length === previous.evidenceIds.length)
        return false;
      established.set(id, { value, evidenceIds: merged });
      return true;
    };
    for (const record of history)
      if (record.answer === "yes" || record.answer === "no")
        add(record.questionId, record.answer === "yes", [record.questionId]);
    let changed = true;
    while (changed && !conflict) {
      changed = false;
      for (const [id, fact] of [...established]) {
        if (conflict) break;
        const source = byId.get(id)!;
        for (const rule of source.implications ?? []) {
          if (conflict) break;
          const target = byId.get(rule.questionId);
          if (
            rule.when === fact.value &&
            rule.scope &&
            rule.scope === source.scope &&
            rule.scope === target?.scope &&
            (!source.themes ||
              !target.themes ||
              source.themes.some((t) => target.themes!.includes(t)))
          )
            changed =
              add(rule.questionId, rule.value, fact.evidenceIds) || changed;
        }
        if (!conflict && source.equivalenceGroup)
          for (const target of questions)
            if (
              !conflict &&
              target.equivalenceGroup === source.equivalenceGroup &&
              target.scope === source.scope
            )
              changed = add(target.id, fact.value, fact.evidenceIds) || changed;
      }
    }
    if (!conflict) break;
  }
  const recent = history.slice(-3);
  return {
    established,
    /** Only direct answers are replayed by inference and readiness. */
    utility(question: Question): { multiplier: number; reasons: string[] } {
      const topic = questionTopic(question);
      const uncertain = recent.some((record) => {
        const previous = byId.get(record.questionId);
        return (
          record.answer === "unknown" &&
          previous &&
          ((topic !== undefined && questionTopic(previous) === topic) ||
            (question.relatedGroup &&
              question.relatedGroup === previous.relatedGroup))
        );
      });
      if (uncertain)
        return { multiplier: 0.45, reasons: ["recent unknown in topic"] };
      const last = history.at(-1);
      const previous = last && byId.get(last.questionId);
      if (!last || !previous || last.answer === "unknown")
        return { multiplier: 1, reasons: [] };
      const polarity = last.answer === "yes" || last.answer === "probably";
      const followUp = question.followUpTo?.some(
        (link) =>
          link.questionId === last.questionId && link.value === polarity,
      );
      if (followUp)
        return { multiplier: 1.08, reasons: ["answer-conditioned follow-up"] };
      if (polarity && topic !== undefined && questionTopic(previous) === topic)
        return { multiplier: 1.03, reasons: ["supported topic continuity"] };
      return { multiplier: 1, reasons: [] };
    },
  };
}
