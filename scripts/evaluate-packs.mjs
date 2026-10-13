/** Ideal catalog-answer evaluation, not measured human accuracy. Node 24+. */
import { readFile, writeFile } from "node:fs/promises";
import { rankCandidates, selectQuestion, shouldGuess } from "../src/engine.ts";
const themes = ["people", "fictional", "animals", "objects", "movies"];
const samples = Number(process.env.EVALUATION_SAMPLES || 30);
const maximumQuestions = 40;
const quantile = (values, fraction) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * fraction))
  ] ?? 0;
const results = [];
for (const theme of themes) {
  const pack = JSON.parse(
    await readFile(
      new URL(`../src/data/packs/${theme}.json`, import.meta.url),
      "utf8",
    ),
  );
  // Sort by factual coverage then take equally spaced quantiles: sparse profiles
  // and complete profiles both appear. IDs break coverage ties reproducibly.
  const coverage = (character) =>
    pack.questions.filter((q) => character.traits[q.id] != null).length;
  const stratified = pack.characters
    .map((character) => ({ character, coverage: coverage(character) }))
    .sort(
      (a, b) =>
        a.coverage - b.coverage || a.character.id.localeCompare(b.character.id),
    );
  const targets = Array.from(
    { length: Math.min(samples, stratified.length) },
    (_, n) =>
      stratified[Math.floor(((n + 0.5) * stratified.length) / samples)]
        .character,
  );
  const durations = [];
  const row = {
    theme,
    entities: pack.characters.length,
    questions: pack.questions.length,
    samples: targets.length,
    correctFirstGuess: 0,
    lowConfidenceFirstGuesses: 0,
    totalNameSpellingAnswers: 0,
    wrongFirstGuess: 0,
    ambiguous: 0,
    exhausted: 0,
    questionLimit: 0,
    totalUnknownAnswers: 0,
    roundsWithUnknownAnswers: 0,
    questionCounts: [],
  };
  for (const target of targets) {
    const history = [];
    let unknown = 0;
    let resolved = false;
    for (;;) {
      const candidates = rankCandidates(pack.characters, history);
      const start = performance.now();
      const next = selectQuestion(candidates, pack.questions, history);
      durations.push(performance.now() - start);
      const informative = history.filter(
        (record) => record.answer !== "unknown",
      ).length;
      if (
        shouldGuess(candidates, informative) ||
        (informative > 0 && (!next || history.length >= maximumQuestions))
      ) {
        if (!shouldGuess(candidates, informative))
          row.lowConfidenceFirstGuesses++;
        if (candidates[0]?.character.id === target.id) row.correctFirstGuess++;
        else row.wrongFirstGuess++;
        resolved = true;
        break;
      }
      if (!next) {
        row.exhausted++;
        break;
      }
      if (history.length >= maximumQuestions) {
        row.questionLimit++;
        break;
      }
      const fact = target.traits[next.question.id];
      const answer = fact === true ? "yes" : fact === false ? "no" : "unknown";
      if (answer === "unknown") unknown++;
      if (next.question.id.startsWith("name_")) row.totalNameSpellingAnswers++;
      history.push({ questionId: next.question.id, answer });
    }
    // An indistinguishable evidence tie is reported separately, including any
    // first-choice failure. All-null profiles remain an honest unknown case.
    const final = rankCandidates(pack.characters, history);
    if (
      final.length > 1 &&
      Math.abs(final[0].probability - final[1].probability) < 1e-10
    )
      row.ambiguous++;
    row.totalUnknownAnswers += unknown;
    if (unknown) row.roundsWithUnknownAnswers++;
    row.questionCounts.push(history.length);
    if (!resolved && !row.exhausted && !row.questionLimit)
      throw new Error("Unclassified round");
  }
  row.medianQuestions = quantile(row.questionCounts, 0.5);
  row.maxQuestions = Math.max(...row.questionCounts);
  row.p95SelectionMs = Number(quantile(durations, 0.95).toFixed(2));
  row.maxSelectionMs = Number(Math.max(...durations).toFixed(2));
  delete row.questionCounts;
  results.push(row);
  console.info(JSON.stringify(row));
}
const report = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  methodology:
    "Deterministic coverage-stratified catalog-answer oracle; no rejections; 40 questions; unknown for absent/null facts. Not human accuracy.",
  results,
};
await writeFile(
  new URL("../docs/pack-evaluation.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
