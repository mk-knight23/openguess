import type {
  Answer,
  AnswerRecord,
  Candidate,
  Character,
  Question,
  TraitValue,
} from "./types";

// An original, deliberately soft response model. These are design constants,
// not learned/calibrated probabilities or facts about another game's algorithm.
const answers: Answer[] = ["yes", "probably", "unknown", "probably-not", "no"];
const positive = [0.65, 0.25, 0.05, 0.03, 0.02];
const negative = [...positive].reverse();
const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
function likelihood(trait: TraitValue | undefined, answer: Answer): number {
  const index = answers.indexOf(answer);
  if (trait === true) return positive[index];
  if (trait === false) return negative[index];
  return (positive[index] + negative[index]) / 2;
}
function entropy(weights: number[]): number {
  return weights.reduce((sum, p) => (p > 0 ? sum - p * Math.log2(p) : sum), 0);
}

/** Replay all evidence from a uniform prior; rejection is a separate exclusion. */
export function rankCandidates(
  characters: Character[],
  history: AnswerRecord[],
  rejectedIds: string[] = [],
  questions: Question[] = [],
): Candidate[] {
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const seen = new Map<string, number>();
  const discounted = history.map((record) => {
    const q = questionMap.get(record.questionId);
    const group = q?.equivalenceGroup ?? q?.relatedGroup;
    const count = group ? (seen.get(group) ?? 0) : 0;
    if (group && record.answer !== "unknown") seen.set(group, count + 1);
    return { record, discount: 1 / (count + 1) };
  });
  const rejected = new Set(rejectedIds);
  const scored = characters
    .filter((character) => !rejected.has(character.id))
    .map((character) => ({
      character,
      logWeight: discounted.reduce(
        (weight, { record, discount }) =>
          record.answer === "unknown"
            ? weight
            : weight +
              discount *
                Math.log(
                  likelihood(
                    character.traits[record.questionId],
                    record.answer,
                  ),
                ),
        0,
      ),
    }));
  if (!scored.length) return [];
  const maxLog = scored.reduce(
    (max, candidate) => Math.max(max, candidate.logWeight),
    -Infinity,
  );
  // Preserve nonzero alternatives even for extremely long histories.
  const weights = scored.map((candidate) =>
    Math.max(1e-300, Math.exp(candidate.logWeight - maxLog)),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return scored
    .map((candidate, i) => ({
      character: candidate.character,
      probability: weights[i] / total,
    }))
    .sort(
      (a, b) =>
        b.probability - a.probability || byId(a.character.id, b.character.id),
    );
}

/** Semantic question selection, retaining the raw five-response information gain. */
function isSemantic(question: Question): boolean {
  const metadata = question as Question & { kind?: string };
  const orthography =
    /\bname\b.*\b(?:letters?|contains?|starts?|ends?|length|spelling|spelled|short|long)\b|\b(?:letters?|initials?|length|spell(?:ing|ed)?)\b.*\bname\b|\b(?:short|long)\s+name\b/i;
  return (
    metadata.kind !== "spelling" &&
    !/^name(?:_|-)/i.test(question.id) &&
    question.property !== "name" &&
    !orthography.test(question.text)
  );
}
function questionFamily(question: Question): string | undefined {
  return (
    (question as Question & { family?: string }).family ?? question.property
  );
}
export function selectQuestion(
  candidates: Candidate[],
  questions: Question[],
  history: AnswerRecord[],
  roundSeed = 0,
): { question: Question; informationGain: number } | null {
  if (!candidates.length) return null;
  const asked = new Set(history.map((record) => record.questionId));
  // I(C; A) = H(A) - sum_c p(c) H(A | c). Candidates with the same
  // true/false/unknown trait share a response distribution, so three masses
  // are sufficient. This avoids five posterior arrays per question.
  const responseEntropy = [
    entropy(positive),
    entropy(negative),
    entropy(positive.map((p, i) => (p + negative[i]) / 2)),
  ];
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const usedEquivalence = new Set(
    history
      .map((r) => questionMap.get(r.questionId)?.equivalenceGroup)
      .filter(Boolean),
  );
  const eligible = new Set(
    questions
      .filter(
        (q) =>
          !asked.has(q.id) &&
          isSemantic(q) &&
          (!q.equivalenceGroup || !usedEquivalence.has(q.equivalenceGroup)) &&
          (q.prerequisites ?? []).every((p) => {
            const observed = history.find((r) => r.questionId === p.questionId);
            if (observed && observed.answer !== "unknown")
              return p.value
                ? ["yes", "probably"].includes(observed.answer)
                : ["no", "probably-not"].includes(observed.answer);
            return (
              candidates.reduce(
                (sum, c) =>
                  sum +
                  (c.character.traits[p.questionId] === p.value
                    ? c.probability
                    : 0),
                0,
              ) >= 0.8
            );
          }),
      )
      .map((q) => q.id),
  );
  const previousQuestion = questions.find(
    (q) => q.id === history.at(-1)?.questionId,
  );
  const previousFamily = previousQuestion
    ? questionFamily(previousQuestion)
    : undefined;
  const masses = new Map<string, { positive: number; negative: number }>();
  let totalMass = 0;
  for (const candidate of candidates) {
    totalMass += candidate.probability;
    for (const [id, trait] of Object.entries(candidate.character.traits)) {
      if (!eligible.has(id) || (trait !== true && trait !== false)) continue;
      let mass = masses.get(id);
      if (!mass) {
        mass = { positive: 0, negative: 0 };
        masses.set(id, mass);
      }
      if (trait === true) mass.positive += candidate.probability;
      else mass.negative += candidate.probability;
    }
  }
  let best: { question: Question; informationGain: number } | null = null;
  let bestScore = 0;
  const confirming =
    candidates[0].probability >= 0.7 &&
    !getRoundReadiness(candidates, history, questions).confirmed;
  const nearEqual: {
    question: Question;
    informationGain: number;
    score: number;
  }[] = [];
  for (const question of [...questions].sort((a, b) => byId(a.id, b.id))) {
    if (!eligible.has(question.id)) continue;
    const mass = masses.get(question.id);
    const trueMass = mass?.positive ?? 0;
    const falseMass = mass?.negative ?? 0;
    // Missing and null facts belong to the same uncertain response group.
    // Roundoff can make an otherwise empty unknown group slightly negative.
    const unknownMass = Math.max(0, totalMass - trueMass - falseMass);
    let answerEntropy = 0;
    for (let index = 0; index < answers.length; index++) {
      const probability =
        trueMass * positive[index] +
        falseMass * negative[index] +
        (unknownMass * (positive[index] + negative[index])) / 2;
      if (probability > 0)
        answerEntropy -= probability * Math.log2(probability);
    }
    const informationGain = Math.max(
      0,
      answerEntropy -
        trueMass * responseEntropy[0] -
        falseMass * responseEntropy[1] -
        unknownMass * responseEntropy[2],
    );
    const coverage =
      totalMass > 0 ? Math.min(1, (trueMass + falseMass) / totalMass) : 0;
    // Broad, documented splits are more useful than a rare known claim among
    // mostly unknown profiles. A modest family cost breaks near-equal choices;
    // it cannot turn an irrelevant question into an informative one.
    const sameFamily =
      previousFamily !== undefined &&
      questionFamily(question) === previousFamily;
    const score =
      informationGain *
      Math.sqrt(coverage) *
      (sameFamily ? 0.9 : 1) *
      (history.slice(-3).some((r) => {
        const previous = questionMap.get(r.questionId);
        return (
          r.answer === "unknown" &&
          previous &&
          ((questionFamily(question) !== undefined &&
            questionFamily(previous) === questionFamily(question)) ||
            (question.relatedGroup &&
              previous.relatedGroup === question.relatedGroup))
        );
      })
        ? 0.45
        : 1) *
      (question.answerability === "specialist" ? 0.85 : 1) *
      (confirming && isDistinctiveSignature(question, candidates) ? 3 : 1);
    if (roundSeed !== 0 && informationGain > 1e-10 && score > 1e-10)
      nearEqual.push({ question, informationGain, score });
    if (informationGain > 1e-10 && score > bestScore + 1e-10) {
      best = { question, informationGain };
      bestScore = score;
    }
  }
  if (best && roundSeed !== 0) {
    const context = `${roundSeed}:${history.map((record) => `${record.questionId}:${record.answer}`).join("|")}`;
    let priority = -1;
    for (const option of nearEqual) {
      if (option.score < bestScore * 0.95) continue;
      const value = seededPriority(`${context}:${option.question.id}`);
      if (value > priority) {
        best = {
          question: option.question,
          informationGain: option.informationGain,
        };
        priority = value;
      }
    }
  }
  return best;
}

// A reproducible hash for variety, not security or likelihood estimation.
function seededPriority(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++)
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** answeredCount must count informative answers, excluding "unknown". */
export function shouldGuess(
  candidates: Candidate[],
  answeredCount: number,
  history?: AnswerRecord[],
  questions?: Question[],
): boolean {
  if (history && questions)
    return getRoundReadiness(candidates, history, questions).ready;
  return (
    candidates.length === 1 ||
    (candidates.length > 1 &&
      answeredCount >= 3 &&
      candidates[0].probability >= 0.85)
  );
}

export interface RoundReadiness {
  phase: "discovery" | "narrowing" | "confirming" | "ready" | "unresolved";
  ready: boolean;
  independentEvidence: number;
  confirmed: boolean;
}
function evidenceGroup(q: Question): string {
  return q.equivalenceGroup ?? q.relatedGroup ?? q.id;
}
function isDistinctiveSignature(q: Question, candidates: Candidate[]): boolean {
  if (
    q.tier !== "signature" ||
    q.answerability === "specialist" ||
    candidates[0]?.character.traits[q.id] !== true
  )
    return false;
  return candidates.slice(1).some((c) => c.character.traits[q.id] === false);
}
/** Readiness is evidence based: neither exclusion nor exhaustion proves identity. */
export function getRoundReadiness(
  candidates: Candidate[],
  history: AnswerRecord[],
  questions: Question[],
): RoundReadiness {
  const leader = candidates[0];
  if (!leader)
    return {
      phase: "unresolved",
      ready: false,
      independentEvidence: 0,
      confirmed: false,
    };
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const groups = new Set<string>();
  let confirmed = false;
  for (const record of history) {
    if (record.answer === "unknown") continue;
    const q = questionMap.get(record.questionId);
    if (!q) continue;
    const fact = leader.character.traits[q.id];
    const positiveAnswer =
      record.answer === "yes" || record.answer === "probably";
    if (typeof fact !== "boolean" || fact !== positiveAnswer) continue;
    const group = evidenceGroup(q);
    if (
      !groups.has(group) &&
      positiveAnswer &&
      isDistinctiveSignature(q, candidates)
    )
      confirmed = true;
    groups.add(group);
  }
  const independentEvidence = groups.size;
  const margin = leader.probability - (candidates[1]?.probability ?? 0);
  const ready =
    leader.probability >= 0.85 &&
    margin >= 0.65 &&
    independentEvidence >= 3 &&
    confirmed;
  return {
    phase: ready
      ? "ready"
      : leader.probability >= 0.7
        ? "confirming"
        : independentEvidence >= 2
          ? "narrowing"
          : "discovery",
    ready,
    independentEvidence,
    confirmed,
  };
}
