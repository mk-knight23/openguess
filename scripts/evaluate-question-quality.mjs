import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { evaluationPool } from "../src/data/evaluationPool.ts";
const root =
  process.env.EVAL_ROOT ?? fileURLToPath(new URL("..", import.meta.url));
const output =
  process.env.EVAL_OUTPUT ??
  fileURLToPath(
    new URL("../docs/conversation-evaluation.json", import.meta.url),
  );
if (!root || !output) throw Error("EVAL_ROOT and EVAL_OUTPUT required");
const engine = await import(pathToFileURL(resolve(root, "src/engine.ts")));
const varietyBand = Number(process.env.EVAL_BAND ?? 0.05);
if (!Number.isFinite(varietyBand) || varietyBand < 0 || varietyBand > 0.2)
  throw Error("EVAL_BAND must be between0 and0.2");
const policies = [
  "exact",
  "dates-unknown",
  "partial-unknown",
  "probably",
  "one-mistake",
];
const cohort = process.env.EVAL_COHORT ?? "playable";
if (!["playable", "legacy-isolated", "legacy-expanded"].includes(cohort))
  throw Error("Unknown evaluation cohort");
const minimumTargets = Number(process.env.EVAL_MIN_TARGETS ?? 1);
const seeds = process.env.EVAL_SEEDS
  ? process.env.EVAL_SEEDS.split(",").map(Number)
  : Array.from({ length: 20 }, (_, i) => i + 1);
if (
  !seeds.length ||
  new Set(seeds).size !== seeds.length ||
  seeds.some((seed) => !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
)
  throw Error("Evaluation seeds must be distinct unsigned integers");
const rows = [];
const exampleRounds = [];
for (const theme of ["people", "fictional", "animals", "objects", "movies"]) {
  const sourcePack = JSON.parse(
    await readFile(resolve(root, `src/data/packs/${theme}.json`), "utf8"),
  );
  const { universe: pack, targets: characters } = evaluationPool(
    sourcePack,
    cohort,
    minimumTargets,
  );
  for (const policy of policies) {
    const row = {
      theme,
      policy,
      targetSubjects: characters.length,
      universeSubjects: pack.characters.length,
      rounds: 0,
      correctFirstGuess: 0,
      wrongFirstGuess: 0,
      unresolved: 0,
      signatureBeforeGuess: 0,
      totalUnknown: 0,
      maxFamilyStreak: 0,
      equivalentRepeat: 0,
      openingQuestions: {},
      uniqueSequences: 0,
      turns: [],
    };
    const sequences = new Set();
    for (const target of characters)
      for (const seed of seeds) {
        const history = [];
        let informative = 0;
        const seenGroups = new Set();
        let family = null,
          streak = 0;
        for (;;) {
          const candidates = engine.rankCandidates(
            pack.characters,
            history,
            [],
            pack.questions,
          );
          const next = engine.selectQuestion(
            candidates,
            pack.questions,
            history,
            seed,
            varietyBand,
          );
          const ready = engine.getRoundReadiness
            ? engine.getRoundReadiness(candidates, history, pack.questions)
                .ready
            : engine.shouldGuess(candidates, informative);
          if (ready) {
            if (candidates[0]?.character.id === target.id)
              row.correctFirstGuess++;
            else row.wrongFirstGuess++;
            if (
              history.some(
                (h) =>
                  pack.questions.find((q) => q.id === h.questionId)?.tier ===
                  "signature",
              )
            )
              row.signatureBeforeGuess++;
            break;
          }
          if (!next || history.length >= 40) {
            row.unresolved++;
            break;
          }
          const q = next.question;
          const fact = target.traits[q.id];
          let answer =
            fact === true ? "yes" : fact === false ? "no" : "unknown";
          if (
            policy === "dates-unknown" &&
            (["P569", "P570", "P577"].includes(q.property) ||
              /^(birth|release|death)[_-](year|era|before|after)/i.test(q.id))
          )
            answer = "unknown";
          if (policy === "partial-unknown" && (history.length + 1) % 3 === 0)
            answer = "unknown";
          if (answer !== "unknown") {
            informative++;
            if (policy === "one-mistake" && informative === 2)
              answer = answer === "yes" ? "no" : "yes";
            if (policy === "probably")
              answer = answer === "yes" ? "probably" : "probably-not";
          } else row.totalUnknown++;
          if (!history.length)
            row.openingQuestions[q.id] = (row.openingQuestions[q.id] ?? 0) + 1;
          if (q.equivalenceGroup) {
            if (seenGroups.has(q.equivalenceGroup)) row.equivalentRepeat++;
            seenGroups.add(q.equivalenceGroup);
          }
          const nextFamily = q.family ?? q.property ?? q.id;
          streak = nextFamily === family ? streak + 1 : 1;
          family = nextFamily;
          row.maxFamilyStreak = Math.max(row.maxFamilyStreak, streak);
          history.push({ questionId: q.id, answer });
        }
        row.rounds++;
        row.turns.push(history.length);
        sequences.add(
          target.id + ":" + history.map((h) => h.questionId).join(","),
        );
        if (
          seed === 1 &&
          policy === "exact" &&
          exampleRounds.filter((r) => r.theme === theme).length < 3
        )
          exampleRounds.push({
            theme,
            target: target.name,
            transcript: history.map((h) => ({
              question: pack.questions.find((q) => q.id === h.questionId)?.text,
              tier:
                pack.questions.find((q) => q.id === h.questionId)?.tier ??
                "unmarked",
              answer: h.answer,
            })),
          });
      }
    row.turns.sort((a, b) => a - b);
    row.medianTurns = row.turns[Math.floor(row.turns.length * 0.5)];
    row.p95Turns = row.turns[Math.floor(row.turns.length * 0.95)];
    row.maxTurns = row.turns.at(-1);
    delete row.turns;
    row.uniqueSequences = sequences.size;
    rows.push(row);
    console.log(JSON.stringify(row));
  }
}
await writeFile(
  output,
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      varietyBand,
      cohort,
      seeds,
      minimumTargets,
      sourceCommit: process.env.EVAL_COMMIT ?? null,
      methodology:
        "All subjects in the declared target cohort against its declared candidate universe, explicit seeds, five deterministic authored-answer policies, 40 question limit, no forced guesses. Not human accuracy. Identity checked against target ID, distinctiveness uses authored metadata.",
      results: rows,
      exampleRounds,
    },
    null,
    2,
  ) + "\n",
);
