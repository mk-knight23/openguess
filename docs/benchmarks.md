# Inference benchmark

On 2026-10-14 the starter catalog (68 characters, catalog version 1.0.0) was replayed through the actual adaptive question selector and guess gate. Each target answered questions using its catalog traits: true became yes, false became no, and missing/null became unknown. A wrong guess would be rejected before continuation; each run allowed at most 25 questions.

| Metric | Result |
| --- | --- |
| Correct first guesses | 68 / 68 (100%) |
| Median questions until identification | 7 |
| Maximum questions until identification | 9 |
| Wrong guesses / required rejections | 0 |
| Unresolved targets | 0 |

Reproduce using `npm test -- src/engine.catalog.test.ts --silent=false` with the supported Node runtime. The test requires at least 90% first-guess accuracy, identification within 25 questions, and no unresolved targets, to catch meaningful catalog or inference regressions.

This is a synthetic, ideal-answer benchmark. It demonstrates that the authored catalog can be usefully distinguished by the adaptive engine; it does not measure accuracy with human answers, ambiguous portrayals, incorrect catalog facts, targets outside the catalog, or answer noise. The response likelihood constants and displayed relative weights are not calibrated confidence estimates. Human evaluation and noisy-answer benchmarks belong to future releases.
