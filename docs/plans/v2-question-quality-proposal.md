# OpenGuess V2 question quality and experience proposal

Status: approved by the user on 2026-10-14. Implementation in progress on `codex/v2-question-quality`.

## Outcome and constraints

Improve the existing V2 conversation so it moves naturally from broad discovery to memorable clues, varies useful sequences, handles uncertainty and offers well-supported guesses. Improve the entire game stage and relevant settings with reference-informed layout and motion while keeping OpenGuess's original assets. Preserve free, account-optional, local core inference and the experimental catalog label.

Research: [question-quality investigation](../research/question-quality-2026-10-14.md). Exact private Akinator source, art, database and algorithm parity are not deliverables supported by this evidence.

## Approaches

1. **Recommended: curated clues plus a context-aware policy.** Add recognizable original facts to the 128 featured profiles, explicit scope and provenance; extend the existing local engine with clue relationships, answerability and confirmation. This addresses the measured gap and remains free/offline.
2. **Policy tuning alone.** Wider seed variation and later guesses are cheaper, but cannot create missing interesting facts. Insufficient as the main upgrade.
3. **Runtime LLM-generated questions.** Potentially flexible, but requires a trustworthy fact-grounding layer, latency management and hosted inference. Paid APIs would break the core constraint; ungrounded questions risk worse quality. Defer.

## Proposed design

### Questions and facts

- Write concise original questions covering signature props, achievements, relationships, behavior, abilities, story events, appearance and purpose.
- Aim for at least three sourced recognizable clues per featured profile, with useful competitor labels. Do not manufacture false labels merely because a tag is absent.
- Add metadata for family, breadth/signature role, answerability, prerequisites, equivalence and related evidence groups. Attach source references and variant scope to authored facts.
- Keep imported sparse schema clues out of the featured conversation unless reviewed for wording and usable coverage. Enrich the large catalog incrementally; do not relabel all 5,584 records as high quality.

### Selection and evidence

- Retain information gain and posterior fact coverage as the core score.
- Use posterior-supported prerequisites to prevent irrelevant specific clues. Unknown responses temporarily lower the priority of related difficult topics without changing candidate truth evidence.
- Suppress equivalent questions and discount clearly related evidence when computing confidence. Shared signatures in a tiny catalog do not by themselves establish logical equivalence.
- Use bounded seeded variation among useful questions, with readable wording and recent topic diversity. Benchmark the current 5% band against modest wider bands; choose from measured tradeoffs rather than copying an invented Akinator parameter.
- Add a late confirmation stage that asks a distinctive, answerable clue separating the leader from strong rivals when current confidence rests on broad evidence. Unknown or contradictory confirmation resumes discovery or an honest unresolved result.
- Confirmation in an already-used related-evidence group does not supply new independent evidence. If no supported distinctive clue remains, offer an explicitly tentative best match or finish unresolved; never silently promote it to a confident guess. A single remaining catalog candidate is an exclusion result and must meet the same evidence checks to receive confident presentation.
- Guess readiness considers leader weight, rival margin, independent known evidence and confirmation. Tune constants through the evaluation matrix; preserve undo, rejected-guess recovery and nonzero alternatives. No forced guess on exhaustion.

### Experience

- Light translucent question and answer panels, deep blue ink, numbered ribbon and curved blue/lavender scenery, using original markup and assets.
- Enlarge and reposition the original companion; keep a purposeful visible mobile portrait rather than a faint cropped background figure.
- Show immediate answer feedback, then genuine busy state, then a restrained question transition. No fake processing delays. Reduced motion skips transitions.
- Distinguish curious, narrowing, confirming, rejected-guess recovery, celebrating and unresolved moods. Undo restores matching state.
- Put long hints behind accessible help; unify Settings and cloud panels with shared surface tokens.

## Execution tasks after approval

Each numbered area will be split into small test-first commits; data authoring is intentionally multi-pass.

1. `src/types.ts`, new `src/questionMetadata.ts` and `src/questionMetadata.test.ts`: define metadata/fact scope plus runtime validation and compatible defaults. RED: unknown prerequisite IDs, cycles, impossible theme scopes and malformed group/fact fixtures; GREEN: validators and types. Missing metadata must preserve legacy pack loading.
2. `scripts/curated-core.json`, `scripts/build-core.py`, `src/data/catalog.ts`: author themed clue batches and explicit sourced facts. RED: coverage, provenance, ambiguity and duplicate fixtures; GREEN: rebuilt packs. Review each batch before reuse.
3. `src/engine.ts`, `src/engine.semantic.test.ts`: relevance, equivalence and topic-history scoring. RED: irrelevant signature, repeated fact and unknown-topic paths; GREEN: targeted policy.
4. `src/engine.ts`, `src/engine.test.ts`: related-evidence weighting and confirmation readiness. RED: correlated-confidence inflation and unsupported guessing; GREEN: independent evidence/confirmation handling.
5. `src/useInference.ts`, `src/inference.worker.ts`, `src/inference-worker.test.ts`: propagate any new policy state/results with stale-request rejection and deterministic seed replay.
6. `scripts/evaluate-packs.mjs`, `src/engine.featured.test.ts`: baseline and upgraded reports over all featured profiles and multiple seeds, including unknown/probably, one mistaken answer and out-of-catalog inputs. Track first guesses, unresolved results, turn distribution, distinctiveness, repetition and seed diversity. No fabricated human accuracy claim.
7. `src/App.tsx`, `src/styles.css`, `src/components/Genie.tsx`, `src/components/Genie.css`: introduce coherent phase-based gestures, light panels, ribbon, help and responsive stage. RED: phase/focus/undo/reduced-motion behavior; GREEN: original visual implementation.
8. `src/CloudPanel.css`, shared style files: align settings surfaces without changing authentication or backend contracts.
9. `scripts/smoke.mjs`, browser reports: desktop/mobile theme rounds, all answer states, rejection/undo, keyboard, reduced motion, 200% text zoom and glass contrast. Visually review at 375/768/1440 widths.
10. Independent spec and code review, targeted security/dependency checks, full automated checks and real browser QA. Fix findings before a patch release and live deployment. Update `docs/engine-v2.md`, `docs/verification.md`, `docs/knowledge.md` and the feature ledger.

## Acceptance and release gates

- No spelling or direct name clues; no unconditional random weak questions.
- Every featured profile has reviewed recognizable clue coverage or an explicit documented exception that blocks inflated readiness claims.
- Distinctive clues appear in the evaluated narrowing/confirmation paths; no forced unrelated signature filler.
- Equivalent-clue, unknown-topic, prerequisites, contradiction, undo and stale-worker tests pass.
- Compare baseline versus upgrade under the same scripted answer policies and seeds. Report any additional turns or unresolved rounds honestly; reject a policy with materially worse false-guess behavior.
- All five themes remain playable without network/accounts; experimental catalog remains labeled.
- Required test, typecheck, formatting, build, audit and browser checks pass; independent review has no unresolved material issue.
- Human question appeal is a separate follow-up validation, not something oracle replay establishes.

### Reproducible evaluation matrix

Freeze the baseline before tuning. Evaluate all 128 featured profiles with seeds 1 through 20 under these deterministic policies: exact authored answers; exact dates withheld; every third question answered unknown; every known answer weakened to probably/probably-not; and the second informative answer inverted. Report results separately, including correct/wrong first guesses, unresolved rounds and median/95th-percentile turns. The negative/uncertain policies must not be presented as human behavior models.

Exact-oracle and dates-withheld policies require zero wrong first guesses and no increase in unresolved rounds from baseline. For each noisy policy, wrong first guesses may not exceed its frozen baseline count; unresolved counts and added turns must be reported rather than concealed by forced guesses. Revisit scope if these gates cannot be met.

For every profile with a supported distinctive clue, the exact-oracle path must ask at least one before a confident first guess. Profile exceptions must identify the absent fact or answerability constraint. Measure maximum family streak, equivalent-clue exposure, unknown-topic repetition, distinct opening questions and unique complete sequences. Equivalent clues must not appear twice in a round. Wider randomization candidates must preserve the identification gates above; publish diversity results even if the current band remains preferable. Unknown-topic avoidance must pass focused tests when an equally useful other topic is available. These requirements do not force low-information filler to satisfy a turn count.

## Review assessment and tooling availability

Read-only source audit and independent design assessment support the recommended approach. Scope review cuts runtime LLM inference and wholesale catalog expansion from this patch; effort goes to clue quality and the existing conversation. Architecture review requires compatibility defaults and grouping/prerequisite invariants before changing scoring.

The design review requests changes to current question copy, surface consistency, mobile companion visibility and state continuity; the proposed design addresses them. Gstack skills were not found in targeted local skill/plugin searches, so those named commands were not run. No code-review-graph tool was available. REA, Superpowers brainstorming and the UI/UX skill informed research; no unavailable tool result is represented as completed.

The user approved this concrete design and implementation scope on 2026-10-14.
