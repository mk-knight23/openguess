# Catalog inference benchmarks

The v2 check samples each actual pack across factual-coverage quantiles, deterministically breaking ties by ID. Targets answer using stored traits: true → yes, false → no, absent/null → unknown. Each round permits 40 questions with no wrong-guess rejection. First guesses follow the application confidence/exhaustion gate. A tied top probability is reported separately. This is an ideal catalog-answer oracle, **not human accuracy** or evidence of performance for targets outside these packs.

Run `EVALUATION_SAMPLES=10 node scripts/evaluate-packs.mjs` on Node 24. The default is 30 targets per pack for a broader, slower check. Results and runtime information are saved in `docs/pack-evaluation.json`. Selection timings measure the actual question selector, excluding ranking, worker messaging, rendering, and first-load parsing. Device load and hardware affect these measurements.

## Measured v2 sample

Measured on Node 24.19.0 on 2026-10-14. This is a small deterministic development check, not a statistically representative sample.

| Pack                 | Correct first selection | Below-confidence guesses | Tied top results | Median / max questions | Unknown answers | p95 selection |
| -------------------- | ----------------------: | -----------------------: | ---------------: | ---------------------: | --------------: | ------------: |
| People               |                   10/10 |                        0 |                0 |                11 / 12 |               0 |       5.38 ms |
| Fictional characters |                   10/10 |                        1 |                0 |                12 / 40 |              15 |       7.40 ms |
| Animals              |                   10/10 |                        1 |                0 |                12 / 40 |              14 |       3.84 ms |
| Objects              |                   10/10 |                        1 |                1 |                11 / 40 |              14 |       9.49 ms |
| Films                |                   10/10 |                        0 |                0 |                12 / 15 |               0 |      29.42 ms |

Three rounds reached the 40-question limit below the normal confidence gate and used the application's best-match fallback. One object round was tied at the top; its correct ID-order selection is not unique identification. Unresolved rounds and wrong first selections were zero in this small sample. Each of the fictional, animal, and object packs had one round with unknown answers.

The 50 rounds used **614 name-spelling answers** in total. That heavy spelling dependence makes these outcomes insufficient evidence of semantic recognition. Source facts and meaningful questions need substantial curation. Latencies are local measurements under concurrent development load; the highest single film selection was 128.79 ms. A worker keeps that calculation off the browser UI thread.

## Source coverage and ambiguity

| Pack                 | Entries | Unique semantic trait signatures | Name-letter questions |
| -------------------- | ------: | -------------------------------: | --------------------: |
| People               |   1,100 |                            1,097 |                    26 |
| Fictional characters |   1,078 |                              533 |                    26 |
| Animals              |   1,100 |                              320 |                    26 |
| Objects              |   1,100 |                              399 |                    26 |
| Films                |   1,100 |                            1,099 |                    26 |

Distinct names help separate entries that share their semantic source facts. However, knowing a spelling is a different task from recognizing a target by its meaningful attributes. Some source claims are obscure, and unavailable claims remain unknown instead of false. These catalog sizes do not imply broad everyday familiarity or full coverage: animals currently cover mammal taxa, while objects cover vehicle, tool, and musical-instrument types. Human evaluations, semantic-only evaluations, noisy answers, and expanded curated facts remain future work.

## v1 reference

The earlier authored 68-character catalog recovered 68/68 ideal-answer targets, with a median of seven and a maximum of nine questions. Reproduce with `npm test -- src/engine.catalog.test.ts`. That smaller authored catalog result is not transferable to imported v2 packs.
