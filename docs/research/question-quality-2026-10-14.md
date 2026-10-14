# Question quality investigation

Date: 2026-10-14. Status: pre-upgrade research; the approved implementation and measured results are documented in [the upgrade report](../question-quality-upgrade.md).

## Main finding

The current product can identify its featured profiles from its own truth table, but that does not establish an interesting human conversation. The strongest actionable gap is a rich, recognizable clue bank, combined with context-aware selection and distinctive confirmation. More unrestricted randomness would not supply missing facts.

## Pre-upgrade source audit (7109284)

| Theme     | Featured profiles | Pack questions | Questions with any featured facts | Questions with at least 80% featured coverage |
| --------- | ----------------: | -------------: | --------------------------------: | --------------------------------------------: |
| People    |                32 |          2,071 |                               143 |                                            60 |
| Fictional |                36 |            820 |                                60 |                                            60 |
| Animals   |                20 |            286 |                                30 |                                            30 |
| Objects   |                20 |            491 |                                30 |                                            30 |
| Movies    |                20 |          1,570 |                               121 |                                            30 |

People and fictional characters share much of the same broad vocabulary. Dense coverage is not the same as useful coverage: facts shared by every remaining candidate have no distinguishing value. Sparse imported question templates can also be awkward or obscure. Ada Lovelace can be identified through death, science, gender and Britain without a recognizable computing clue.

`src/engine.ts` already uses five-answer Bayesian-style likelihoods, information gain, known-fact coverage, a 10% previous-family cost and seed variation within 5% of the best score. `shouldGuess` permits a guess after three informative answers and an 85% catalog-relative leader weight, or immediately when only one candidate remains. It has no signature confirmation, semantic prerequisite model, long topic history or correlated-fact handling. Unknown answers provide no ranking evidence, but do not steer selection away from difficult topics.

Some clue signatures overlap in the small catalog: birds/two legs/feathers, reptiles/scales and instruments/strings. Shared signatures are not universally equivalent propositions; only genuinely equivalent clues should be suppressed categorically. Related clues need bounded evidence discounting, not indiscriminate removal.

## Fresh REA browser evidence

Target: public English Akinator website, existing normal Chrome CDP target. These are external-service observations; the server binary and database were not supplied.

| Evidence                                                              | Observation                                                                                                                                | Boundary                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ev_e011e78ecad2723a42e477dc2c055a87ea18ed8812cef698ba757a8b056106fe` | Theme selection and a female-character opening question                                                                                    | Ready-state interaction completed                                                                                                                                                              |
| `ev_07e5b85d3befd449e02c47d30b4777835d157be4c379f45718ab247173179dfc` | Nine questions, moving from nationality/gender/reality into media, powers and anatomy                                                      | Eight fixed No answers, no intended identity; incomplete event coverage                                                                                                                        |
| `ev_98f404f729105961ae3e3e4077dbad995885736615befedc18fd35b5d7df456f` | A different opening sequence and later clothing, eyes, usefulness and subjective characterization                                          | Eight fixed No answers; different questions mean different semantic histories, so this is not a controlled RNG-parameter test                                                                  |
| `ev_d2c1deee8b923eba03a7e3765e1371aee9dbb3859d7141f36345ce37f1c4681b` | Nineteen questions followed by a proposed identity                                                                                         | Fixed No exploratory answers; a question-ready wait timed out because the UI had entered the guess view. Later scripted steps were cancelled; not an accuracy test or universal stopping count |
| `ev_c5c58fd7bf9d177046410a451e2e88c9067b67747504bf7a73b8e2d10942c181` | Large gesturing companion, light translucent question/answer surfaces, numbered ribbon, deep blue text and curved blue/lavender background | Screenshot appearance only; does not prove backdrop blur or motion duration                                                                                                                    |
| `ev_30a48d87b28586fe7e8c0368994a6b48badc77a09a40a6b278a2a055c3b5b15f` | Passive reference-page inventory                                                                                                           | Cannot reconstruct pre-attachment activity                                                                                                                                                     |

Initial clicks before Cloudflare's ordinary script handler finished loading did not advance theme selection. A bounded settling wait followed by explicit question readiness corrected that observation. No security interstitial or challenge was bypassed. Raw captures and publisher assets remain private outside the repository in `/tmp/openguess-quality-research-rea.json`.

These observations establish sequence variation and adaptive-looking progression. They do not distinguish randomness from localization, changing priors, server experimentation or other hidden state. The observed 19-answer proposal does not justify hard-coding 19, 20 or 25 turns.

## Published evidence and open-source comparisons

- [De Bruyn et al., 2022](https://aclanthology.org/2022.blackboxnlp-1.7.pdf) collected 2,832 questions across 126 Akinator objects. Their analysis describes recurring generic questions alongside many specific questions appearing once, and nine knowledge families. Failed rounds and uncertain answers were removed. This supports question richness, not an unbiased accuracy benchmark or a current Limule implementation claim.
- [Nowak, generalized binary search](https://arxiv.org/abs/0910.4397) studies adaptive query selection and noise tolerance under explicit assumptions. Useful questions partition plausible hypotheses; arbitrary random questions are not interchangeable.
- [Jedynak, Frazier and Sznitman, Twenty Questions with Noise](https://people.orie.cornell.edu/pfrazier/pub/2011_JedynakFrazierSznitman_20questions.pdf) studies entropy reduction for known noisy channels and continuous targets. Its optimality conclusions do not automatically transfer to a sparse fixed semantic bank.
- [Golovin, Krause and Ray, noisy observations](https://arxiv.org/abs/1010.3091) studies equivalence classes of hypotheses, where straightforward greedy selection can perform poorly under noise. It motivates caution about greedy information gain under noisy observations. Our proposed related-clue discount is a separate heuristic, not a direct implementation of that result; OpenGuess will not claim to implement EC2 without doing so.
- [Naghshvar, Javidi and Chaudhuri, Noisy Bayesian Active Learning](https://arxiv.org/abs/1312.2315) connects adaptive questions with hypothesis testing. This motivates separating discovery and confirmation, rather than using a fixed question count.
- [thoregraepel/twenty-questions engine](https://raw.githubusercontent.com/thoregraepel/twenty-questions/main/js/engine.js) separates posterior updates, entropy-based selection and an 85% stopping threshold. That threshold belongs to that implementation, not Akinator.
- [Anaphory/open20q source](https://raw.githubusercontent.com/Anaphory/open20q/master/core.py) contains an experimental epsilon exploration branch and outcome-based updates. Its hard binary elimination and unconstrained exploration are not suitable defaults here.

The [publisher FAQ](https://en.akinator.com/content/6/Everything-you-039-ve-always-wanted-to-know-about-Akinator), successfully observed in the previous normal-browser investigation, identifies Limule as private and describes moderated, duplicate-aware question contributions. Search/indexed community material was consulted; no community posts or messages were sent. No third-party engine code or Akinator question database is incorporated.

## Experience assessment

OpenGuess's central question hints currently read like database instructions. Help should be optional, with concise conversational wording visible by default. The solid dark answer surface, small desktop companion and faint cropped mobile companion weaken the reference-style stage hierarchy. Cloud settings also use inconsistent cream/brown surfaces.

Proposed appearance: original curved blue/lavender scenery, a larger original companion, light translucent answer rows with dark ink, a numbered ribbon, stable question dimensions and meaningful state gestures. A subtle backdrop blur is our design choice; it was not proved from the reference screenshot. Preserve contrast, keyboard focus, reduced-motion support and mobile targets.

## Unknowns and next evidence

Limule's exact RNG, priors, ranking, training, noise handling, confidence calibration and stopping policy remain unknown. No native APK, IPA or server binary was available. Disassembling an unrelated client cannot reveal the server implementation. The client animation code previously analyzed by REA exposes step/confidence-dependent states, not the server's question algorithm.

The next implementation must measure recognition quality, redundant topics, unknown burden, seed diversity, false guesses and recovery separately from source-table oracle success. Human appeal must remain explicitly unvalidated until human playtesting occurs.
