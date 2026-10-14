# Project knowledge

Updated 2026-10-14 for the 0.2.1 upgrade.

- V1's automated reference visit reached Cloudflare. V2's normal Chrome session reached real home/settings/theme/question/answer/result views. Both observations are valid for their respective captures.
- Completed REA scenario actions do not imply complete event coverage. Some capture exports were oversized and remained private; publish summaries and evidence IDs, not raw tokens or foreign scripts.
- Static application graph findings cannot reveal Akinator's private server algorithm. Bayesian information gain is OpenGuess's design.
- A sourced entity count is not guessing quality. Missing facts and duplicate semantic signatures require explicit limits. Spelling fallback was rejected as the wrong experience and is excluded from question selection.
- The earlier 50/50 pack replay relied on 614 spelling answers. Its apparent success is invalid evidence for semantic guessing and is superseded by the correction work.
- Properly waited reference gameplay showed questions about India, gender, reality, Japan, film popularity and video-game origin. Fixed exploratory No answers were not a coherent target or accuracy test.
- Five packs contain 5,584 records. Default play uses 128 featured profiles (32 people, 36 fiction, 20 each animals/objects/films); sparse full-catalog play is explicitly Experimental.
- Raw Wikidata facts are CC0; original curated annotations are MIT with separate source references. References are not an independent audit of every trait.
- The 0.2.1 matrix recovered all 128 featured profiles over 20 seeds, with no wrong/unresolved exact-answer results and at most eleven questions in that sample. This validates authored closed-world profiles, not human accuracy or all-catalog recovery.
- Workers keep inference off the interface thread; sparse trait aggregation avoids repeated absent-fact scans, while sorting and metadata validation retain their own costs. Ignore stale responses and surface worker errors.
- Local points and imported scores are editable. Optional public win totals must never be represented as server-verified competitions.
- Proposal exports are untrusted suggestions, not shared learning. Cloud backups are opt-in and require independently tested access policies.
- Preserve local-only play and keep secrets, private profile files and raw reference evidence outside public commits.

Record actual final checks and live service results in [verification](verification.md); do not turn planned checks into success claims.

## Question quality decisions

The [0.2.1 comparison](question-quality-upgrade.md) records why the 5% usefulness band remains the default: adding recognizable facts improved sequence variety, while widening the band to 15% increased wrong guesses in the mistaken-answer stress test. Keep this tradeoff explicit before retuning randomness; scripted error counts are not human accuracy.

Independent clue grouping is separate from duplicate suppression. Prefer shared related-evidence groups when calculating confidence; unique equivalence labels must not bypass them. Give strict paraphrases a common equivalence group so an unknown answer does not trigger a rephrased repeat. A positive signature must distinguish the strongest remaining rival, not merely a nearly impossible alternative.

Validate all generated pack metadata, not only positive clue coverage. Explicit null facts must not receive Boolean-only provenance fields. Theme prerequisites need semantic review: national head-of-state status did not apply to Gandhi's civic leadership, and incorrectly blocked every distinctive clue. Preserve scope-sensitive negatives: using a Time-Turner for a rescue is not using it to attend extra lessons.

Hold the current question during real worker processing, disable its controls, and make QA await the actual not-busy state. Merely waiting for visible question text can observe the retained previous question after Undo and produce a false failure.

The corrected default uses 128 rich semantic profiles. Imported record counts alone failed the user experience: letter questions dominated, and semantic-only replay of the full pool remained unresolved. Keep raw catalog scope separate from effective playable scope. Seed only near-equal useful questions; preserve replay through undo. Film annotations must merge into validated canonical identities rather than create duplicate records. Variant-sensitive facts use unknown rather than invented negatives.
