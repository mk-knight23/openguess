# Inference at catalog scale

Question selection uses the same five-response likelihood model as v0.1. The optimization groups candidate probability into true, false, and unknown masses for each question. Mutual information is calculated as response entropy minus conditional response entropy. This is mathematically equivalent to the prior-entropy minus expected-posterior-entropy implementation, but avoids five candidate arrays and repeated posterior normalization per question.

Selection remains O(entities × questions), with O(1) temporary scoring space per question. Lexicographic question tie breaks, the 1e-10 information threshold, no repeated questions, and soft candidate evidence remain unchanged. Rankings use log weights and keep alternatives nonzero. Null and omitted facts share an uncertain response model; an unknown user answer contributes no evidence.

The confidence value is conditional on the loaded catalog and model, not a calibrated real-world accuracy claim. Missing facts do not become false facts. Incomplete profiles can still accumulate model-relative evidence from other traits, so exhausted questions should lead to an uncertain result or contribution flow. Identical signatures cannot be distinguished by questioning; the existing 85% threshold does not auto-guess such uniform ties. Explicit rejection can leave one candidate, which is an exclusion result rather than proof of identity.

## Verification

Twelve focused tests cover normalization, contradictions, unknown/missing facts, deterministic ties, question exhaustion, recovery, and equivalence to an independent naive posterior-entropy reference across twelve sparse weighted fixtures. A synthetic benchmark covers 2,500 entities with 150 questions and 20% unknown facts. On Node 24.19.0 on the development Mac, the optimized selection took 19.6 ms. The test uses a generous 1,000 ms ceiling to catch regressions without claiming a universal device speed. Existing baseline tests passed before the optimization; this change preserves numerical behavior rather than fixing a failing inference result.

No per-entity indexes, backend service, network requests, or paid APIs are required by this engine. Very large packs can later use a worker or column-oriented traits if browser measurements justify that complexity.

## Responsive inference worker

Larger packs can include thousands of questions. `useInference` hydrates one module worker per loaded pack, then sends only answer history, exclusions, and a monotonically increasing request ID. Results contain IDs and probabilities; the hook resolves IDs against the original pack rather than cloning character profiles on each answer. New packs terminate the old worker, and late results from previous workers or requests are ignored. The hook reports `busy` and a readable error so the UI can pause answer controls while computing. Browsers without Worker support use synchronous inference; this compatibility fallback can temporarily block on large packs. Worker startup and runtime errors are surfaced rather than silently retrying expensive work on the UI thread.
