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
  // Collapse equivalent propositions before ordering implications. Every
  // incoming premise is settled before a proposition can emit consequences.
  // This prevents a subsequently conflicted ancestor from poisoning a direct
  // observation downstream, independently of history or metadata order.
  const nodeFor = new Map(
    questions.map((q) => [
      q.id,
      q.equivalenceGroup
        ? `equivalent:${JSON.stringify([q.scope, q.equivalenceGroup])}`
        : `id:${q.id}`,
    ]),
  );
  const members = new Map<string, Question[]>();
  for (const q of questions) {
    const node = nodeFor.get(q.id)!;
    members.set(node, [...(members.get(node) ?? []), q]);
  }
  const outgoing = new Map<
    string,
    { target: string; when: boolean; value: boolean }[]
  >();
  const indegree = new Map([...members.keys()].map((node) => [node, 0]));
  for (const q of questions)
    for (const rule of q.implications ?? []) {
      const target = byId.get(rule.questionId);
      if (
        !target ||
        !rule.scope ||
        rule.scope !== q.scope ||
        rule.scope !== target.scope ||
        (q.themes &&
          target.themes &&
          !q.themes.some((t) => target.themes!.includes(t)))
      )
        continue;
      const sourceNode = nodeFor.get(q.id)!;
      const targetNode = nodeFor.get(target.id)!;
      outgoing.set(sourceNode, [
        ...(outgoing.get(sourceNode) ?? []),
        { target: targetNode, when: rule.when, value: rule.value },
      ]);
      indegree.set(targetNode, indegree.get(targetNode)! + 1);
    }
  const facts = new Map<string, EstablishedProposition | null>();
  const add = (node: string, value: boolean, evidenceIds: string[]) => {
    const previous = facts.get(node);
    if (previous === null) return; // Conflicting incoming evidence establishes nothing.
    if (previous && previous.value !== value) {
      facts.set(node, null);
      return;
    }
    facts.set(node, {
      value,
      evidenceIds: [
        ...new Set([...(previous?.evidenceIds ?? []), ...evidenceIds]),
      ].sort(),
    });
  };
  for (const record of history) {
    const node = nodeFor.get(record.questionId);
    if (node && (record.answer === "yes" || record.answer === "no"))
      add(node, record.answer === "yes", [record.questionId]);
  }
  const queue = [...members.keys()].filter((node) => indegree.get(node) === 0);
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    const fact = facts.get(node);
    for (const rule of outgoing.get(node) ?? []) {
      if (fact && fact.value === rule.when)
        add(rule.target, rule.value, fact.evidenceIds);
      indegree.set(rule.target, indegree.get(rule.target)! - 1);
      if (indegree.get(rule.target) === 0) queue.push(rule.target);
    }
  }
  // Invalid cyclic implication metadata cannot propagate; normal validated
  // packs are acyclic. Direct observations still remain available as evidence.
  const established = new Map<string, EstablishedProposition>();
  for (const [node, group] of members) {
    const fact = facts.get(node);
    if (fact) for (const q of group) established.set(q.id, fact);
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
