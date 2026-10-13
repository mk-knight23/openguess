# Semantic inference benchmarks

The v2 evaluation samples each actual pack across factual-coverage quantiles, deterministically breaking ties by ID. Targets answer using stored traits: true → yes, false → no, absent/null → unknown. Each round permits 40 meaningful semantic questions with no wrong-guess rejection. A guess requires the engine's normal confidence gate; question exhaustion and budget limits remain unresolved. Spelling questions are forbidden, and the script fails if any leak into play. A tied top probability is reported separately.

Run `EVALUATION_SAMPLES=10 node scripts/evaluate-packs.mjs` on Node 24. The default is 30 targets per pack for a broader, slower check. Results and runtime information are saved in `docs/pack-evaluation.json`. This is an ideal catalog-answer oracle, **not human accuracy**, a representative statistical sample, or evidence about targets outside the pack. Timings measure the actual question selector, excluding ranking, worker messaging, rendering, and first-load parsing.

## Why the spelling-based result was inadequate

The initial imported v2 packs achieved 50/50 first-ID selections in a small sample by using 614 name-spelling answers. Three rounds required a low-confidence best-match fallback, and one was tied at the top. That was not evidence of semantic recognition.

After blocking name spelling and removing forced low-confidence guesses, the same coverage-stratified evaluation on those initial packs produced **0 confident identifications and 50 unresolved rounds** at 40 questions. Most responses were unknown because the imported facts were sparse and positive-only. The detailed baseline is preserved in `docs/semantic-baseline.json`. That failed baseline motivates denser verified semantic facts, curated recognizable targets, and truthful uncertainty instead of inflated accuracy claims.

## Source scope

Catalog size is not the same as effective recognizable coverage. Source claims may be obscure; unavailable claims remain unknown instead of false. Mammal taxa and vehicle/tool/instrument types are examples of the narrower initial source scope. Dense facts must be based on verified claims or explicit mutually exclusive classifications, not guessed negatives or fabricated attributes.

Human evaluations, unknown targets, noisy answers, portrayal ambiguity, and broader curated meaningful facts remain necessary future work. The likelihood constants and displayed relative weights are not calibrated confidence estimates.

## v1 reference

The earlier authored 68-character catalog recovered 68/68 ideal-answer targets, with a median of seven and a maximum of nine questions. Reproduce with `npm test -- src/engine.catalog.test.ts`. That smaller authored catalog result is not transferable to imported v2 packs.
