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
): Candidate[] {
  const rejected = new Set(rejectedIds);
  const scored = characters
    .filter((character) => !rejected.has(character.id))
    .map((character) => ({
      character,
      logWeight: history.reduce(
        (weight, record) =>
          record.answer === "unknown"
            ? weight
            : weight +
              Math.log(
                likelihood(character.traits[record.questionId], record.answer),
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
): { question: Question; informationGain: number } | null {
  if (candidates.length < 2) return null;
  const asked = new Set(history.map((record) => record.questionId));
  // I(C; A) = H(A) - sum_c p(c) H(A | c). Candidates with the same
  // true/false/unknown trait share a response distribution, so three masses
  // are sufficient. This avoids five posterior arrays per question.
  const responseEntropy = [
    entropy(positive),
    entropy(negative),
    entropy(positive.map((p, i) => (p + negative[i]) / 2)),
  ];
  const eligible = new Set(
    questions.filter((q) => !asked.has(q.id) && isSemantic(q)).map((q) => q.id),
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
      informationGain * Math.sqrt(coverage) * (sameFamily ? 0.9 : 1);
    if (informationGain > 1e-10 && score > bestScore + 1e-10) {
      best = { question, informationGain };
      bestScore = score;
    }
  }
  return best;
}

/** answeredCount must count informative answers, excluding "unknown". */
export function shouldGuess(
  candidates: Candidate[],
  answeredCount: number,
): boolean {
  return (
    candidates.length === 1 ||
    (candidates.length > 1 &&
      answeredCount >= 3 &&
      candidates[0].probability >= 0.85)
  );
}
