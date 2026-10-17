# V2 scale and conversation upgrade status — 2026-10-17

Release PR: https://github.com/mk-knight23/openguess/pull/3

V2 maintenance release 0.2.2 publishes the conversation, pacing and source-pipeline improvements described here. The larger catalog expansion is not complete. The target is 5,000 playable subjects in each of People, Characters, Animals, Objects and Films. Default play currently preserves 128 legacy profiles. No newly acquired profile has passed final-universe replay qualification or entered default gameplay.

Implemented changes include scoped conversation closure, bounded answer-conditioned follow-ups, suppression of equivalent questions, recovery from mistaken premises using useful independent evidence, immediate calculation with a 2,200 ms atomic presentation gate, synchronous duplicate-answer protection, and cancellation that ignores stale worker results/errors after Give up. Default gameplay, daily targets, counts and evaluation share the accepted pool projection. Production builds reject stale qualification manifests.

The acquisition pilot retrieves actual DBpedia facts for 100 existing identities per category and preserves shared Wikimedia lineage. Princeton WordNet and EltonTraits add independent source families. Exact species joins and scoped numeric/biological projections produce a 99-bird pilot: each has at least 25 base propositions over five topics; 64 pass mechanical screening. No pair has zero explicit distinctions, but ten pairs still lack two evidence groups. These are diagnostics over a selected pilot, not evidence of 5,000 playable animals, human familiarity or successful guesses. See [data-pilot.md](data-pilot.md) for the remaining source and identity gaps.

Local verification on Node 24.19.0:

- 183 JavaScript tests and 32 Python tests passed.
- Production build and formatting passed; dependency audit reported zero vulnerabilities. Existing Vite chunk-size warnings remain.
- Browser smoke passed 24 checks, including all five themes, result correction, collection, library, daily challenges, backup/restore, mobile, accessibility and 40 unknown answers ending without a forced guess.
- Experience QA passed five viewport configurations and five supported target rounds. Visual inspection covered the mobile question layout.
- Three real-worker reveals measured 2,675, 2,653 and 2,552 ms including automation overhead. Give up with a deliberately delayed worker took 49 ms; late computation did not replace the terminal screen. These measurements are local, not a device-independent latency guarantee.
- Independent conversation/pacing reviews and a separate GPT-5.6-Sol CLI review found defects that were fixed with regression tests. The CLI's Node 20 test attempts do not count as verification; the supported Node 24 checks above do.

The [main evaluation](conversation-evaluation.json) covers 128 legacy targets, 20 seeds and five authored-answer policies, totaling 12,800 rounds. Exact, date-unknown and probable policies each identified all 2,560 targets. Partial-unknown had 30 unresolved rounds; one-mistake had four wrong guesses and four unresolved. Equivalent-question repetitions were zero. The [held-out evaluation](conversation-heldout-evaluation.json) covers another 3,200 rounds with seeds 101–105: exact/date-unknown/probable were all correct, partial-unknown left nine unresolved, and one-mistake had one wrong and two unresolved. These self-oracle diagnostics do not measure human accuracy or certify newly imported subjects.

REA remains part of the reference investigation. Public reference research does not reveal Akinator's private algorithm or data. A controlled local REA scenario completed start/question/answer/wait/undo actions but returned `cleanup_incomplete` with partial URL-only evidence, so it supplies neither successful-cleanup nor timing proof. Successful UI timing evidence comes from Playwright. Research limitations and primary-source notes are in [the research record](research/v2-scale-conversation-2026-10-15.md).

Remaining work: independently substantiate distinguishing facts across all five categories, review human answerability and identities, transform screened records to final runtime shape, repair remaining near-rival evidence gaps, replay the entire accepted universe before promotion, and measure the resulting larger pool. Increasing raw row counts or adding correlated thresholds cannot complete this work.
