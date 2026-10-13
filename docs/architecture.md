# Architecture

Vite builds a React/TypeScript static application. A small manifest describes five packs; selecting a theme lazy-loads its finite CC0 dataset. Entity QIDs, source URLs, retrieval timestamps and query metadata preserve provenance. Mammal taxa and vehicle/tool/instrument types are explicit scope boundaries, not all animals or everyday objects.

## Inference and worker

Normalized candidate weights start from a uniform prior. Answers apply soft likelihoods in log space; missing traits stay unknown and “don't know” supplies no evidence. Question selection aggregates true, false and unknown probability masses, then computes expected information gain. This retains O(C × Q) selection while avoiding repeated per-answer candidate arrays. See [engine details](engine-v2.md).

A module worker receives the loaded pack once and subsequent history/exclusion requests with increasing IDs. The hook ignores stale replies, terminates workers on pack changes and exposes busy/error states. A synchronous fallback exists when workers are unavailable and may block large-pack interfaces. Relative weights are heuristic, not calibrated real-world confidence.

Sparse imported facts cannot support reliably broad semantic guessing. Name fallback questions offer additional separation, with the explicit limitation that players must know English entity names. Honest uncertainty, catalog visibility, answer editing and rejected guesses remain essential.

## Progress and optional cloud

Local progress includes a nickname, settings, points, collection, recent games and dated daily completions. Imports are size-bounded, validated and reconstructed from allowed fields; no imported text is executed. Daily targets depend on local dates and stable pack IDs. Pack changes can change the daily target set.

Optional Supabase integration supplies accounts, explicit cloud save/restore and opt-in public nickname/win totals. Local inference does not depend on this service. Authentication and row access policies belong to the service layer, not to browser trust. A locally editable score is not a server-verified competitive result. Cloud deployment and runtime checks must be recorded separately from source tests.

Contribution exports contain proposals for character, question or photo review. Photo URLs require rights confirmation and are not automatically fetched or accepted as catalog assets. Reviewed source/data changes, never an export action, update shared packs.
