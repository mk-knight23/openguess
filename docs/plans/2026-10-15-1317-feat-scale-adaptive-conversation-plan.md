---
title: OpenGuess V2 Scale and Adaptive Conversation - Plan
type: feat
date: 2026-10-15
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

# OpenGuess V2 Scale and Adaptive Conversation - Plan

## Goal Capsule

**Objective:** Players can choose among at least 5,000 adequately supported subjects in each category and experience a coherent guessing conversation that responds to their answers.

**Means:** Build a reproducible knowledge pipeline, qualify the resulting profiles, add explicit conversation context and separate inference from a short thinking/reveal state.

**Deliverable:** An upgraded free, open-source V2 with measured catalog counts, original presentation, source attribution, reproducible evaluation and a reviewed public release.

## Product Contract

### Problem Frame

The current default game covers 128 featured profiles. Its larger 5,584-record catalog is sparse and experimental. Rapid reveals and a selection policy that penalizes consecutive topic families can make a mathematically adaptive round feel disconnected. The player needs useful follow-ups and a readable pace as well as much broader knowledge.

### Summary

Grow five qualified catalogs through multiple knowledge providers. Keep soft candidate updates, add answer-conditioned conversation context, and prevent duplicate or already implied questions. Accept an answer once, calculate from it immediately, display a thinking state and then reveal the next question or guess after a short pause.

### Key Decisions

- **5,000 per category:** governs R1. (session-settled: user-directed — chosen over 5,000 total: the user explicitly selected the per-category target.)
- **Free core play:** governs R7; retain the repository's offline/browser-first identity.

### Requirements

**Knowledge**

- R1. Provide at least 5,000 qualified, distinct playable subjects in each of people, fictional characters, animals, objects and movies. Aliases and duplicate imports do not count separately; a named film remake or explicitly distinct fictional portrayal may count when its identity is clear to the player.
- R2. Use multiple knowledge sources in each category and retain fact-level source lineage, reuse terms, retrieval/version information and portrayal scope. Mirrors and derivative imports do not count as independent corroboration of the same underlying fact.
- R3. Preserve unknown and conflicting information explicitly. Do not treat missing claims as false, generate facts from names or pad the target with records that fail qualification.

**Conversation**

- R4. Update the hypothesis state after every accepted answer before selecting another question. Prefer a relevant, informative follow-up and change topics when the current thread is unhelpful, unknown or contradicted.
- R5. Do not repeat a question ID, equivalent proposition or a safely established implication within a round. Keep related but genuinely discriminating follow-ups eligible.
- R6. Use a 2–3 second thinking interval after accepting an answer under normal foreground operation. Do inference during the interval, block duplicate answers and reveal only the result for the current round. Slow inference or browser throttling may extend the wait; an incorrect or stale reveal is never used to meet the ceiling.

**Compatibility and delivery**

- R7. Keep core play free, without paid runtime model calls, accounts or a mandatory remote game server. Preserve collections, theme switching, undo, five answer types, uncertain-answer handling and rejected-guess recovery.
- R8. Research and document reference behavior while preserving the independent product identity. Do not claim recovery of Limule, use Akinator's service as our backend or copy its database, art or source into the product.
- R9. Keep this work in V2. Publish only after TDD, review, source/credential checks, production-browser QA and live verification; disclose any unmet catalog or research target.

### Acceptance Examples

- AE1. After a player confirms a video-game origin, a relevant franchise or gameplay-role follow-up can outrank an unrelated near-tie about appearance. After a negative origin answer, that same child question is ineligible unless later evidence justifies a recovery path. Covers R4.
- AE2. Confirming a Hogwarts connection permits an original useful school/house/role clue; it does not trigger another paraphrase of the same franchise question. Covers R4–R5.
- AE3. During the pause, repeated mouse/keyboard input produces one answer record. Undo cancels the pending reveal and restores the previous evidence; restart or theme change cannot receive an old result. Covers R6–R7.
- AE4. A taxonomic synonym, an actor's alias or the same movie from a second provider merges with its canonical subject. It enriches knowledge but does not add to the category count. Covers R1–R3.
- AE5. If fewer than 5,000 profiles pass in a category, the report shows the actual number and the release is not described as completing R1. Covers R1 and R9.

## Planning Contract

### Evidence and Constraints

See [the investigation](../research/v2-scale-conversation-2026-10-15.md) for current pack counts, file-level behavior, source research, inspected GitHub implementations, video sampling and REA evidence. No new complete matched-prefix reference branch experiment was obtained. The private algorithm remains unknown.

The strongest risk is data quality and acquisition yield, especially familiar fictional-character details and distinctions among thousands of objects or animal species. A provider shortlist is not an acquired dataset. The first implementation milestone must establish source access, licenses and semantic yield before making a completion or schedule claim.

### Key Technical Decisions

- KTD1. Retain local, versioned, sparse knowledge packs with compact per-theme indexes. Offline build-time adapters gather facts; core gameplay does not fetch arbitrary websites. This satisfies R2, R3 and R7 and avoids a dense 25,000-by-all-questions browser matrix.
- KTD2. Keep entity identity, source assertions and compiled question facts separate. Store canonical IDs, aliases, variant scope, subject/predicate/object, true/false/unknown/conflict, source origin and derivation rules. Runtime packs contain the validated projection; attribution and source manifests remain inspectable. Governs R1–R3.
- KTD3. Qualify profiles before counting them: stable identity, readable label, reusable evidence, at least 20 supported familiar propositions across five topic families, two independently useful confirming clues against plausible near-rivals, no unresolved identity collision and successful semantic replay against the entire final category. Numeric minima are pilot screening heuristics, not proof of knowledge quality; count normalized propositions and track evidence groups separately from topics. Twenty stored facts alone are insufficient: replay and competitor distinguishability are required. This is the proposed quality bar for R1, subject to the initial pilot validating that the bar measures useful play.
- KTD4. Use reviewed proposition templates and a small explicit implication graph. Derive negatives only from supported incompatible or exhaustive statements with scope. Hard implication closure uses definite, polarity- and portrayal-scoped evidence. Probably/probably-not and posterior support can guide soft context but do not establish Boolean closure; unknown/conflict establishes none. Recompute closure after corrections or contradictions, retaining its original evidence lineage so derived facts never count as new independent confirmations. No unrestricted language-model fact generation or blanket closed-world completion. Governs R3 and R5.
- KTD5. Extend selection with explicit topic, branch and follow-up metadata. Rank on the updated posterior, coverage, answerability, novelty and contextual utility. Remove the unconditional same-family penalty; bound contextual preference so it cannot promote an uninformative clue. Determine the usefulness bound from the pilot comparison. Seeded variation is only a final tie choice, not the main strategy. Governs R4–R5.
- KTD6. Keep soft likelihoods, correlated-evidence discounting, distinctive confirmation and honest unresolved results. Context follows supporting evidence but can recover after a mistaken prerequisite. Governs R3–R5 and R7.
- KTD7. Add a cancellable round presentation controller. Default reveal deadline is 2,200 ms after answer acceptance; reveal requires both the deadline and current inference completion. Every evidence or view mutation invalidates pending callbacks: undo, Correct from here, Give up, rejection, restart, theme/active-pack/settings changes, navigation and unmount. Use a synchronously locked operation token plus pack/version, evidence, exclusions and seed identity; reset the deadline for every newly accepted answer. Publish question, guess, exhaustion and companion mood as one consistent presentation snapshot, while errors remain immediately visible. Reduced motion removes movement while retaining the requested pause. Governs R6–R7.

### High-Level Technical Design

```mermaid
flowchart LR
    A[Knowledge providers] --> B[Cached source assertions]
    B --> C[Identity and fact validation]
    C --> D[Qualification and replay]
    D --> E[Versioned per-theme packs]
    E --> F[Inference worker]
    G[Accepted answer] --> F
    F --> H[Updated candidates and conversation policy]
    G --> I[Thinking deadline]
    H --> J[Current round reveal gate]
    I --> J
    J --> K[Next question or supported guess]
```

### Source Strategy

Use Wikidata for identity and structured statements; evaluate compatible DBpedia distributions as enrichment. For objects add WordNet senses and suitable ConceptNet assertions. For animals join accepted taxonomy from GBIF with verified trait datasets such as EltonTraits where access and exact reuse terms permit. For people add appropriate domain sources such as MusicBrainz core and institutional facts. Fiction and movies need work/version linkage plus original reviewed annotations from appropriate publisher or authoritative references.

Each category must use at least two actual knowledge-source families, not simply list them in a manifest. Claims sharing an upstream origin remain correlated. Provider reuse terms attach to the data, independently of the MIT application code. IMDb/TMDB are not assumed redistributable core sources merely because noncommercial API access is free. Report per-provider subject/assertion coverage, genuinely new propositions and upstream overlap so token contributions cannot disguise single-source dependence. For EltonTraits, pin the verified Figshare v1 CC0 distribution and preserve imputation flags: genus/family estimates or phylogenetic imputations are uncertain derived facts, never verified species confirmations. EOL redistributions retain their original upstream lineage. A failed source adapter must produce a visible acquisition report rather than silently relabeling another source as independent.

### Alternatives

A larger Wikidata limit was rejected because it does not address missing distinguishing facts. A rigid fixed tree was rejected because one mistaken answer can strand the target. Unrestricted online generation was rejected because it adds runtime cost, unsupported facts and irreproducible behavior. A new remote game service is unnecessary for this scope; compact indexing can be measured first within the existing worker architecture.

## Implementation Units

Each unit is split into small red/green commits during execution. Data acquisition is measured in batches, not assigned an invented short duration.

### U1. Establish source access and a representative pilot

**Requirements:** R1–R3, R8. **Dependencies:** none.

**Files:** create `scripts/knowledge/sources.json`, `scripts/knowledge/README.md`, `scripts/knowledge/pilot.py`, `scripts/knowledge/test_pilot.py`, and `docs/data-pilot.md`; update `docs/data-provenance.md`.

**Approach:** Verify exact dataset versions, terms, retrieval methods and IDs. Build a 100-subject pilot per category with common and difficult examples. Stratify familiar, middle and difficult subjects, including close species, object senses and fictional variants. Record failures and independent source contribution; pilot yield is a preliminary estimate, not certification that the long tail will reach 5,000. Avoid loading enormous dumps before a bounded sample proves their value.

**Test scenarios:** A missing source license rejects that assertion; a cached retrieval is reproducible; two mirrors share origin lineage; a non-matching fictional version does not merge; failed acquisition is reported without manufactured replacement facts.

**Verification:** Pilot report includes accepted/rejected counts and factual audit samples. If the proposed sources cannot support the target, expose the remaining acquisition/curation work and revise the source choice before dependent bulk ingestion.

### U2. Normalize identities, evidence and question semantics

**Requirements:** R1–R3, R5. **Dependencies:** U1.

**Files:** create `scripts/knowledge/normalize.py`, `scripts/knowledge/test_normalize.py`, `scripts/knowledge/compile.py`, `scripts/knowledge/test_compile.py`; update `src/types.ts`, `src/questionMetadata.ts`, `src/questionMetadata.test.ts`.

**Approach:** Implement KTD2–KTD4 with explicit source assertion IDs. Compile fact families, prerequisites, equivalent propositions and safe implications. Preserve existing collection IDs through an alias map.

**Test scenarios:** Duplicate provider entries merge; a remake remains separate; an omitted claim stays unknown; conflicting sourced values remain unresolved; a scoped negative does not become universal; an implication cycle and incompatible metadata fail validation; old collection identifiers resolve correctly.

**Verification:** Identical inputs produce identical semantic packs and provenance manifests; no unresolved identifiers, fabricated negative defaults or alias inflation pass qualification.

### U3. Build and qualify five expanded catalogs

**Requirements:** R1–R3. **Dependencies:** U1–U2.

**Files:** add adapters under `scripts/knowledge/adapters/` with `scripts/knowledge/test_adapters.py`; add `scripts/knowledge/qualify.py`, `scripts/knowledge/test_qualify.py`, `docs/catalog-quality.json`; update `src/data/packs/`, `scripts/build-core.py`, `src/data/signature-clues.test.ts`, `src/data/featuredPack.ts`.

**Approach:** Expand through measured batches toward 5,000 per category. Include reviewed evidence for distinctions not available in bulk sources. Report imported, unique, semantically qualified and replay-qualified totals separately. Preserve known-good profiles and quarantine incomplete imports. Replace the featured-only default with one shared qualified-playable projection used by App, daily targets, displayed counts and evaluators. Recheck distinguishability after the union of all batches, not just within each batch.

**Test scenarios:** A sparse record, duplicated identity or all-correlated signature cannot count; a qualified profile has supported independent distinctions against plausible near-rivals (unknown on a rival is never false); two individually passing batches that collide after union fail; a newly qualified nonfeatured subject actually appears in default gameplay and daily targets; broad animal and object scope is represented; actual attribution covers every included data source.

**Verification:** Five categories each reach R1 under KTD3. The gate cannot be lowered simply to hit the advertised count; an unmet category remains explicitly incomplete.

### U4. Add coherent follow-up selection

**Requirements:** R4–R5, R7. **Dependencies:** U2 and the U1 pilot; U3 can continue independently.

**Files:** create `src/conversation.ts`, `src/conversation.test.ts`; update `src/engine.ts`, `src/engine.quality.test.ts`, `src/engine.semantic.test.ts`, `src/inference.worker.ts`, `src/useInference.ts`, `src/inference-worker.test.ts`.

**Approach:** Implement KTD5–KTD6 with reviewable selection reasons. A topic thread records what has been established and which distinctions remain useful. Keep information gain distinct from contextual utility so evaluations can explain the chosen tradeoff.

**Test scenarios:** AE1 and AE2; opposite answers produce different eligible follow-ups on a discriminating fixture; repeated unknown answers exit an unhelpful thread; an already implied proposition is skipped; genuinely related evidence remains eligible; Probably and Unknown do not create hard implications; a negative child does not negate its broader parent; one answer plus five derived implications still counts as one evidence group; a mistaken prerequisite can recover using independent supporting evidence without circularly using its child; rejected guesses resume useful discovery.

**Verification:** No same-ID or equivalent-proposition repeats, no unsupported child premises in tested traces, and no regression in exact/noisy-answer recovery relative to the 0.2.1 baseline. Compare contextual selection against the existing policy before selecting constants.

### U5. Add cancellable thinking and reveal pacing

**Requirements:** R6–R7. **Dependencies:** U4 interface settled.

**Files:** create `src/useRoundPresentation.ts`, `src/useRoundPresentation.test.tsx`; update `src/App.tsx`, `src/App.test.tsx`, `src/roundPresentation.ts`, `src/roundPresentation.test.ts`, `src/styles.css`.

**Approach:** Implement KTD7. Acknowledge the selected answer immediately, retain the current clue during thinking, and use one reveal gate for the next question or guess. Keep Undo and restart available to cancel the pending state. Do not delay the inference calculation itself.

**Test scenarios:** At 1,999 ms the next question is hidden; at the default deadline a ready result appears; inference completing later waits safely; two rapid inputs append one answer; undo/restart/theme switch/unmount, Correct from here, Give up, navigation and active-pack/settings changes invalidate the timer; early inference exhaustion cannot leak a terminal view or mood before reveal; a stale worker result never reveals; reduced motion preserves timing without motion.

**Verification:** Fake-clock lifecycle tests pass, then real-browser foreground measurements verify normal question timing and user-visible acknowledgment without making hardware-independent latency promises.

### U6. Keep expanded play responsive and compatible

**Requirements:** R1, R7. **Dependencies:** U2–U4.

**Files:** create `src/data/knowledgeIndex.ts`, `src/data/knowledgeIndex.test.ts`, `scripts/benchmark-catalog.mjs`; update `src/useInference.ts`, `src/inference.worker.ts`, pack loading paths and `docs/benchmarks.md`.

**Approach:** Measure the real qualified packs, then add compact sparse/inverted indexes where the existing scans consume the thinking interval or excessive memory. Load one theme at a time. Keep the presentation deadline independent from computation time.

**Test scenarios:** Indexed and reference inference agree; unknown facts retain meaning; loading one theme does not fetch all five; theme changes drop stale calculations; legacy progress and collection data survive the catalog migration.

**Verification:** Publish pack sizes, load time, worker calculation time and memory observations for declared desktop/mobile test environments. Do not present synthetic record counts as measured gameplay performance.

### U7. Evaluate knowledge and the complete experience

**Requirements:** R1–R9. **Dependencies:** U3–U6.

**Files:** extend `scripts/evaluate-question-quality.mjs`, `scripts/smoke.mjs`, `scripts/experience-qa.mjs`; create `scripts/evaluate-conversation.mjs`, `docs/catalog-evaluation.json`, `docs/conversation-evaluation.json`, `docs/fact-audit.md`; update `docs/verification.md`.

**Approach:** Replay every counted profile over at least five deterministic seeds using exact semantic answers. Use the full final default playable projection, fail on zero/featured-only target counts, and keep tuning seeds separate from held-out evaluation seeds. Report the fixed old cohort in its old candidate universe, that same cohort among all new rivals, and the expanded catalog separately. Add leave-one-confirming-clue-out, familiar-only and stratified unknown/probable/mistaken-answer policies plus an independently checked factual sample. Test all five themes, semantic repetition, topic continuity, honest exhaustion and browser timing. Reference research gaps remain labeled if fresh matched-prefix trials are still unavailable.

**Test scenarios:** AE3–AE5; all-unknown input does not force a guess; correlated or wrong facts do not create false confirmation; every theme can complete rounds against real data; foreground pause and reduced-motion behavior work at desktop/mobile widths; all catalog count assertions are derived from the shipped dataset.

**Verification:** Publish acquisition rejection and indistinguishable-cluster counts before replay filtering, then exact, wrong and unresolved counts separately; disclose source-audit sample size and limitations. A self-consistent truth table is not a human accuracy result.

### U8. Review, publish and retain the evidence

**Requirements:** R7–R9. **Dependencies:** U7.

**Files:** update `README.md`, `docs/data-provenance.md`, `docs/scaling.md`, `docs/knowledge.md`, `docs/feature-ledger.md`, package version and release notes.

**Approach:** Run independent specification/code review and data/provenance review, resolve material findings, pass CI and production QA, then publish through the existing GitHub/Pages workflow. Recheck the live version and representative rounds. Preserve the 0.2.1 rollback point.

**Test expectation:** Release verification uses U7's suites, version checks and live representative journeys; no tests that only mirror documentation.

**Verification:** Release links identify the shipped commit and attach measured results. No raw reference captures, private profile files or credentials enter the repository. Record learned data/algorithm limitations in project knowledge.

## Verification Contract

- TDD: Show failing behavioral regressions before implementing each changed behavior and commit after green cycles.
- Catalog: R1 is checked against unique qualified profiles, not importer rows. Every counted subject passes exact semantic replay over the declared seeds; unresolved subjects are repaired or replaced before counting.
- Knowledge: Separately inspect facts and source independence. Test missing, contradictory and variant-specific claims; publish independent audit sampling limitations.
- Conversation: Measure duplicate propositions, safe implication repetition, unsupported follow-up premises, useful branch behavior and noisy-answer recovery. Preserve the existing no-forced-guess and strongest-rival confirmation regressions.
- Timing: Verify deadline behavior with fake clocks and real foreground browser measurements. Cover fast/slow inference, rapid clicks, keyboard input, cancellation and reduced motion.
- Repository: Run the existing unit suite, typecheck, formatting, production build, dependency audit and applicable browser suites. Inspect public artifacts for private data before push.
- Delivery: Require independent review, passing CI, Pages deployment and live QA. If review services are unavailable, disclose the missing review rather than claiming it ran.

## Definition of Done

All R1–R9 acceptance conditions pass on the actual shipped packs and UI. The release has at least 25,000 distinct qualified profiles with 5,000 in each category, uses multiple evidenced sources per category, asks coherent nonrepetitive follow-ups and applies the requested pause safely. Reports, source manifests, attribution, limitations and rollback information accompany the free V2 release.

An intermediate milestone can be useful and separately published with accurate counts, but it does not complete this plan or the user's database requirement.

## Risks and Dependencies

Source availability and reuse rights, factual coverage, cross-source circularity, ambiguous fictional portrayals and synonym-heavy animal/object catalogs can reduce qualified yield. The plan does not assume that all target data can be automatically acquired in one batch. Any material source substitution must preserve the knowledge and redistribution requirements.

The proposed qualification bar and contextual usefulness bound need validation on the representative pilot. Their exact effectiveness is an execution-time measurement, not evidence already collected. Completion dates and human accuracy percentages are intentionally unestimated until the pilot establishes yield and curation workload.

The normal browser/REA access paths have different current availability. Fresh reference branches and unedited timing remain research gaps. These gaps restrict parity claims, not our ability to implement and evaluate the clearly specified OpenGuess behavior.
