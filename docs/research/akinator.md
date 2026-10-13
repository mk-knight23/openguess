# Akinator investigation and original reconstruction

Research date: 2026-10-14. Target selected by the user: <https://en.akinator.com/>.

## What this investigation can establish

This is a public-surface investigation using REA 6.4.0, not access to Akinator's server source or database. The automated browser was served a Cloudflare verification page. We preserved that limitation and stopped expanding the same blocked capture. A functioning original game does not imply that the reference implementation has been recovered.

### Evidence ledger

| Operation                  | Evidence                                                              | Observed result                                                                      | Boundary                                                                                                         |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `list_browser_targets`     | `ev_c25dc86603128a5094b8624b96b6f1a336678d7f6a31a6519b755f5f71fd94e6` | Exact English origin; title “Just a moment...”                                       | Target discovery, not successful gameplay                                                                        |
| `inspect_web_page`         | `ev_d6bc3343df0c3b5a4cc33399ba4ccc797549a548e5e4b7071a1bea8f1d92f49a` | Accessibility tree says “Performing security verification”; 64 DOM nodes             | Only the challenge document, attach-window network coverage                                                      |
| `capture_web_screenshot`   | `ev_c33dd2392fca843c9f661f534cb56e27f641446f9322893bd4f3dcd4a322e5ea` | A captured 756 × 469 viewport of the challenge                                       | Not Akinator's game interface                                                                                    |
| `analyze_web_bundle`       | `ev_922a2793300b42b7f57bc3e16927459fb03028eca8df2b717d49049efbcecf99` | Two challenge-page scripts parsed, zero parse failures                               | No game scripts, no private inference algorithm                                                                  |
| `capture_browser_scenario` | Partial observation, no complete success Evidence                     | Document returned HTTP 403 and displayed verification; navigation and wait completed | REA reported `cleanup_incomplete` after a 1000ms cleanup timeout; this run is not a successful verified scenario |

No challenge script source, challenge tokens, cookies, private user profile or reference artwork is included in the repository. The ledger contains scoped observations and hashes rather than redistributing another site's code. REA screenshot/source observations are retained locally during this session; public notes deliberately summarize them.

## Publisher-documented behavior

The [publisher's FAQ](https://fr.preprod.akinator.com/content/6/tout-ce-que-vous-avez-toujours-voulu-savoir-sur-akinator) describes thinking of a real or fictional character, answering a sequence of questions, and receiving a proposed identity. It identifies the engine as Limule and says its original algorithm is secret. It describes character/question proposals, duplicate detection, and moderation of contributions and images.

The [official iOS listing](https://apps.apple.com/us/app/akinator/id933135994) additionally describes character, movie, animal and object themes; awards, leaderboards, daily challenges, accounts, a sensitive-content filter, multiple languages, and paid ad-removal/unlock features. The [official Android listing](https://play.google.com/store/apps/details?id=com.digidust.elokence.akinator.freemium) corroborates additional guessing themes.

These are publisher claims, not features all observed in the English web interface. Mobile and web offerings may differ. OpenGuess does not reproduce monetization or claim those features in v1.

## How a game of this kind can work

The inference problem is to identify an entity from noisy answers to questions about its properties. A candidate table contains entities; a question table contains semantic properties; each entity/question pair has a known, false, uncertain or missing value. A session stores answers and rejected guesses. The difficult work is collecting high-quality, distinguishing properties at broad coverage, handling inconsistent player interpretations, and validating contributions.

An original implementation can start with a probability distribution over candidates. For a response `a` to question `q`, update each candidate's weight using `P(c | a,q) ∝ P(a | c,q) P(c)`. Soft likelihoods allow mistakes without permanently eliminating the intended character. Normalize after every update. OpenGuess computes in log space to prevent numerical underflow. “Don't know” contributes no evidence. Unknown catalog traits are modeled with a midpoint likelihood.

Choose a question using expected information gain: current candidate entropy minus the average posterior entropy across possible responses. Questions that divide likely candidates tend to provide more information than questions whose answer is identical for everyone. This gives an adaptive path rather than a prewritten decision tree. The question selector excludes previously answered questions.

Stop when a candidate's relative model weight passes a threshold after sufficient informative answers, or when the question budget is exhausted. A result is an offer for confirmation, not a fact about what the player intended. Rejected guesses are excluded explicitly; undo rebuilds the distribution from remaining history. A closed catalog cannot identify an unknown entity. It may confidently prefer an incorrect known entity, so the interface must disclose the catalog and permit rejection and proposals.

**This mathematics is OpenGuess's design. It is not a verified description of Limule.** Its response constants and confidence threshold are heuristic and require evaluation on human gameplay. Publisher documents do not prove use of Bayesian inference, a neural model, an LLM, entropy selection, a particular backend framework or a particular database.

## Feature mapping

| Concept                                                 | OpenGuess v1                                                                | Later work                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| Think of an identity, answer questions, confirm a guess | Implemented against an original starter catalog                             | Broader catalog and empirical evaluation         |
| Multiple response strengths                             | Five choices, including unknown                                             | Calibrated likelihoods from consented test data  |
| Adaptive questions                                      | Expected information gain                                                   | Worker execution, quality-aware question ranking |
| Correction/rejection                                    | Undo answers, exclude rejected guesses                                      | Edit earlier specific answers                    |
| Knowledge contributions                                 | Download a local proposal for reviewed GitHub contributions                 | Optional moderated shared submission service     |
| Multiple themes and languages                           | English character/people pack only                                          | Animals, objects, films, localized packs         |
| Replayability and awards                                | Confirmed local win counter                                                 | Daily challenges and local achievements          |
| Accounts, global leaderboards                           | Not part of v1                                                              | Only if requested, with privacy and abuse design |
| Monetization                                            | No ads, paid API or pricing                                                 | Keep software and gameplay free                  |
| Explainability                                          | Optional candidate weights, answer trail and next-question information gain | Evaluation dashboards and data provenance        |

## REA capability coverage

REA is the main reference-investigation tool and also verifies our own built application. Its tools are selected by target and unanswered question. Calling native disassemblers, Android, firmware, SQLite or crash tools on a web page would not reveal its private backend.

Browser discovery, DOM/accessibility inspection, screenshots, static bundle analysis and a controlled browser scenario were exercised against the requested target. Script export, application graph analysis, feature tracing, runtime/static reconciliation and source-map tracing require actual game source bytes or map/capture pairs. The challenge did not supply them; these remain unavailable rather than being inferred from unrelated scripts. Captured networking cannot recover requests made before attachment. Additional navigation observation would repeat the same blocked surface without answering a new question.

If the user later supplies a normal playable browser session or an authorized exported gameplay capture, use REA to observe that exact target, capture game scripts, export their verified bytes, inspect application structure, trace selected question/guess handlers, and reconcile observed requests with static call sites. Record endpoint names and response shapes without exposing credentials or replacing the private server with a scraped database.

## Completion checklist

- Public surface identified and observed: **answered**, verification page only.
- Publisher feature set and proprietary-algorithm boundary: **answered**, primary sources above.
- Actual live English gameplay, game endpoints and question sequence: **unresolved**, bot-verification barrier.
- Exact backend algorithm, database and production capacity: **unknown**, not exposed by this investigation.
- Independent implementation design: **answered**, [plan](../plans/v1.md) and [architecture](../architecture.md).
- Sustainable scaling: **designed**, [scaling](../scaling.md); worldwide traffic capacity is not yet demonstrated.

The research is sufficient to build an original first version of this genre. It is not “everything about Akinator,” and does not claim hidden internals or worldwide parity.
