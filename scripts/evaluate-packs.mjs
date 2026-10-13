/** Ideal catalog-answer evaluation, not measured human accuracy. Node 24+. */
import { readFile, writeFile } from "node:fs/promises";
import { rankCandidates, selectQuestion, shouldGuess } from "../src/engine.ts";
const availableThemes = ["people", "fictional", "animals", "objects", "movies"];
const themes = process.env.EVALUATION_THEMES
  ? process.env.EVALUATION_THEMES.split(",")
  : availableThemes;
if (themes.some((theme) => !availableThemes.includes(theme)))
  throw new Error("Unknown evaluation theme");
const samples = Number(process.env.EVALUATION_SAMPLES || 30);
const mode = process.env.EVALUATION_MODE || "full";
if (!["full", "core"].includes(mode))
  throw new Error("Evaluation mode must be full or core");
const unknownDates = process.env.EVALUATION_UNKNOWN_DATES === "1";
if (!Number.isInteger(samples) || samples < 1)
  throw new Error("Samples must be a positive integer");
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
  const databaseEntities = pack.characters.length;
  if (mode === "core") {
    pack.characters = pack.characters.filter(
      (character) => character.featured === true,
    );
    if (!pack.characters.length)
      throw new Error(`No featured core in ${theme}`);
  }
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
  const targetCount = Math.min(samples, stratified.length);
  const targets = Array.from(
    { length: targetCount },
    (_, n) =>
      stratified[Math.floor(((n + 0.5) * stratified.length) / targetCount)]
        .character,
  );
  const durations = [];
  const row = {
    theme,
    entities: pack.characters.length,
    databaseEntities,
    questions: pack.questions.length,
    samples: targets.length,
    correctFirstGuess: 0,
    unresolved: 0,
    totalNameSpellingAnswers: 0,
    wrongFirstGuess: 0,
    ambiguous: 0,
    exhausted: 0,
    questionLimit: 0,
    totalUnknownAnswers: 0,
    roundsWithUnknownAnswers: 0,
    questionCounts: [],
    exampleRounds: [],
  };
  for (const target of targets) {
    const history = [];
    const transcript = [];
    let unknown = 0;

    for (;;) {
      const candidates = rankCandidates(pack.characters, history);
      const start = performance.now();
      const next = selectQuestion(candidates, pack.questions, history);
      durations.push(performance.now() - start);
      const informative = history.filter(
        (record) => record.answer !== "unknown",
      ).length;
      if (shouldGuess(candidates, informative)) {
        if (candidates[0]?.character.id === target.id) row.correctFirstGuess++;
        else row.wrongFirstGuess++;
        break;
      }
      if (!next) {
        row.exhausted++;
        row.unresolved++;
        break;
      }
      if (history.length >= maximumQuestions) {
        row.questionLimit++;
        row.unresolved++;
        break;
      }
      const fact = target.traits[next.question.id];
      const dateUnavailable =
        unknownDates &&
        (["P569", "P570", "P577"].includes(next.question.property) ||
          /^(?:birth|release|death)[_-](?:year|era|before|after)/i.test(
            next.question.id,
          ));
      const answer = dateUnavailable
        ? "unknown"
        : fact === true
          ? "yes"
          : fact === false
            ? "no"
            : "unknown";
      transcript.push({
        question: next.question.text,
        answer,
        family: next.question.family ?? next.question.property ?? null,
      });
      if (answer === "unknown") unknown++;
      if (
        /^name(?:_|-)/i.test(next.question.id) ||
        next.question.kind === "spelling"
      )
        throw new Error(
          `Spelling question leaked into semantic play: ${next.question.id}`,
        );
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
    if (row.exampleRounds.length < 3)
      row.exampleRounds.push({
        target: target.name,
        topMatch: final[0]?.character.name ?? null,
        topWeight: Number((final[0]?.probability ?? 0).toFixed(4)),
        transcript,
      });
  }
  row.medianQuestions = quantile(row.questionCounts, 0.5);
  row.maxQuestions = Math.max(...row.questionCounts);
  row.p95SelectionMs = Number(quantile(durations, 0.95).toFixed(2));
  row.maxSelectionMs = Number(Math.max(...durations).toFixed(2));
  delete row.questionCounts;
  results.push(row);
  const { exampleRounds, ...summary } = row;
  console.info(JSON.stringify(summary));
}
const report = {
  measuredAt: new Date().toISOString(),
  node: process.version,
  mode,
  unknownDates,
  methodology:
    "Deterministic coverage-stratified catalog-answer oracle; no rejections; 40 semantic questions; unknown for absent/null facts; no forced low-confidence guesses. Not human accuracy.",
  results,
};
await writeFile(
  new URL(
    `../docs/pack-evaluation${mode === "core" ? "-core" : ""}${unknownDates ? "-unknown-dates" : ""}.json`,
    import.meta.url,
  ),
  JSON.stringify(report, null, 2) + "\n",
);
