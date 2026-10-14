# V2 question quality upgrade — 0.2.1

OpenGuess now moves from familiar broad clues toward recognizable details before a confident guess. The 128 featured profiles have 384 original signature questions with explicit fact rows, source pointers and portrayal/variant scope. Missing rows remain unknown. Source references are not a claim that every negative or variant received a fresh independent web audit.

Featured games use familiar authored questions. Specialist import templates remain in the explicitly Experimental full catalog. Imported records are unchanged in scope: 5,584 total records, with semantic enrichment still needed beyond the featured profiles. Records without supported signature facts can remain unresolved; the full catalog is not promoted to worldwide recognition quality.

Examples include a lightning-shaped scar, a giraffe's long dark tongue, a guitar's fretted neck and a doomed ocean liner. Ada Lovelace can now receive an original question about the Analytical Engine or her relation to Lord Byron, rather than ending after only demographic filters.

## Selection and guessing

Information gain and known posterior coverage remain the main question signal. Prerequisites use compatible answers or strong posterior support; the latter permits recovery from an early mistaken classification. Recent unknown topics receive a temporary cost. Strictly equivalent questions cannot recur, including after unknown answers. Related facts receive diminishing evidence weight and cannot count as separate independent discoveries merely because their duplicate-question labels differ.

Once the leading candidate narrows, the policy favors a familiar signature that separates it from its strongest remaining rival. A signature shared with that rival does not confirm the identity. Guess readiness requires an 85% catalog-relative leader, a 65-point rival margin, three independent supporting groups and a supported positive signature. Known contradictions require a second independent signature; a contradictory signature clears previous confirmation. Exclusion and question exhaustion do not prove identity.

These constants are OpenGuess heuristics, not calibrated human accuracy or recovered Limule parameters. The original five-answer likelihood model remains soft; unknown answers contribute no ranking evidence and alternatives remain nonzero.

## Measured tradeoff

The matrix uses all 128 featured subjects with seeds 1–20 and five deterministic answer policies, 40 questions maximum. Target identity is checked by ID. These are authored-table consistency and stress tests, not human gameplay measurements.

| Policy, 2,560 rounds each          | Baseline correct / wrong / unresolved | Upgrade correct / wrong / unresolved |
| ---------------------------------- | ------------------------------------- | ------------------------------------ |
| Exact authored answers             | 2,560 / 0 / 0                         | 2,560 / 0 / 0                        |
| Exact dates withheld               | 2,560 / 0 / 0                         | 2,560 / 0 / 0                        |
| Every third question unknown       | 2,268 / 0 / 292                       | 2,538 / 0 / 22                       |
| Known answers weakened to probably | 2,540 / 0 / 20                        | 2,560 / 0 / 0                        |
| Second informative answer inverted | 1,954 / 542 / 64                      | 2,552 / 2 / 6                        |

Exact-answer median rounds take five or six questions per theme; the largest count in this 20-seed sample is eleven. Every confident guess includes a signature clue. No equivalent question repeated in the matrix. Exact-answer unique subject/sequence pairs increased from 1,832 to 2,333 out of 2,560 rounds.

The 15% usefulness band produced more sequence variety but six wrong first guesses and fourteen unresolved rounds in the mistaken-answer policy, compared with two and six at 5%. **Keep the 5% default:** a richer clue bank already improves variety, and arbitrary wider randomization is not automatically a quality improvement. Both bands kept exact and dates-withheld rounds correct. The wider band also increased partial-unknown unresolved rounds from 22 to 26.

Reports: [baseline](question-quality-baseline.json), [shipping 5% matrix](question-quality-matrix.json), [15% comparison](question-quality-variety15.json). Their semantic source snapshots were verified against the recorded revisions; formatting-only changes do not change the matrices.

Reproduce with Node 24: `node scripts/evaluate-question-quality.mjs`. Set `EVAL_BAND=0.15` and a separate `EVAL_OUTPUT` to compare the wider band. Human interestingness and real-world false-guess rates remain unmeasured.

## Experience and verification

Original blue/lavender scenery, light translucent panels, a numbered ribbon and a larger companion replace the darker answer slab. Optional clue help keeps guidance out of the main conversation. The question stays visible with disabled answer controls during real worker processing; a new question transitions without an artificial delay. Companion moods follow actual inference and recovery, rather than treating a long string of unknown answers as narrowing. Reduced motion skips transitions.

Production QA passed desktop, tablet, mobile, landscape and a documented 200% full-page-zoom equivalent. It checked help, keyboard answers, undo focus, target sizes, reflow and measured accessibility states. Five additional theme rounds reached signature-backed guesses, with confident/celebrate/recovery poses checked. See [experience report](experience-qa.json) and [browser report](browser-qa.json). The zoom simulation uses 720 CSS pixels at DPR2 for a 1440-pixel display; the native browser zoom UI was not manipulated.

REA controlled capture `ev_d07f8612a5e89402006a73cdf73ac745ec408bec470a3d6ea415bc86d0a16335` completed start, unknown answer and undo in the upgraded local app, restoring the original question. It was complete within that declared scenario, with no requested event families. That does not authenticate the whole product or the reference server. [Research boundaries](research/question-quality-2026-10-14.md) preserve the separate incomplete reference captures and unknown private algorithm.

Independent review caught correlated-group bypass, shared-rival confirmation and equivalent-question repetition. Regression tests failed before their fixes and passed afterward; scoped adversarial re-review found no remaining material issue. The optional cloud service's earlier ownership tests remain historical evidence; this patch changes its presentation, not access policies or SMTP configuration.
