# Akinator public-browser investigation

Updated 2026-10-14. Target: <https://en.akinator.com/>. REA is the main inspection tool; findings are scoped to actual captures and publisher material.

## V2 observations

A normal Chrome target reached the public home page, settings, theme selection, questions, answer transitions and result views. This supersedes the earlier automated-session barrier for the observed flow, without invalidating the v1 Cloudflare observation.

| Surface                  | REA evidence                                                          | Observation boundary                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                     | `ev_c5e36fc09d455c00d77d5ffe54ff7d09593cd0a52df9bbb00b785d4614358cb4` | Public rendered browser surface                                                                                                                           |
| Settings                 | `ev_1e353060aefba4e62ce7140b9c43c5776f461fee2f33fd0f27938c52ec61d815` | Captured settings view                                                                                                                                    |
| Start/theme              | `ev_83ee0eb9a780aad215282221d0d2e648e91387d926d249ee62e0b96f73c74df0` | Observed selection/start surface                                                                                                                          |
| Round                    | `ev_5835f5e08fac5753072f03951348e8f1591e94828cd76c18fc9514ecf9fca25e` | Captured question interface                                                                                                                               |
| Answer transition        | `ev_6f7ca252ed39a8c4dcf3ffeae3355a156d2e3737095234dbe76258062516aee1` | Question 1 asked whether the character lives in India; No led to question 2 asking whether the character is a girl. Observed POST `/answer` returned 200. |
| Static application graph | `ev_b422ec9442238e5ec39cc0c132719d1d4c523b35c65ef09de8fab338ac279512` | Two author scripts (`app-v3`, `animation-v2`), 36,589 parsed bytes, 6,086 AST nodes, nine findings, zero parse failures; 1,370 semantic unknowns          |

Completed scenario actions did not provide complete requested event-family coverage. Large evidence transport exceeded 10 MB and exported private captures reached approximately 57 MB; raw captures remain outside this repository. Evidence IDs identify scoped observations rather than implying exhaustive reconstruction.

Static observations expose Lottie integration, confidence/step states and caching behavior in browser code. They do not identify the private inference algorithm, training process, database contents or server capacity. The observed endpoint is a transport observation, not an authorized dependency for this project. OpenGuess makes no calls to it.

## Properly waited semantic question sequence

Fresh REA capture `ev_7118d160752783da590df41491a154cfcff724645ad1e0ff2f415ef588eaeff6` waited for the actual question state and observed successive questions about being Indian, being female, really existing, being Japanese, appearing in a popular movie and originating in a video game. The exploratory answers were fixed No responses; they did not describe a consistent intended character and are not an accuracy test.

An earlier capture beginning `ev_cc2411` ran before animation transitions settled and lacked question text. It cannot support a missing-question conclusion; the waited capture corrects that timing error. Browser state must be observed after transitions, rather than inferred from an animation frame.

This provides a concrete product lesson: the game adapts meaningful subject properties. OpenGuess's earlier spelling-heavy replay (50 rounds with 614 spelling answers) failed that purpose despite favorable ID-selection counts. The corrected implementation excludes spelling questions and requires fresh semantic evaluation.

The public browser uses an answer endpoint; the private Limule server implementation remains unknown. An initial browser fetch of the FAQ returned 403; a later normal-browser visit to the canonical English FAQ succeeded, as recorded below. No native application binary was available for core-binary analysis.

## Tool scope and originality

REA exposes approximately 170 tools across different targets. Applicable browser discovery, DOM/accessibility, screenshots, scenarios, networking, script export and graph analysis were used; at least ten browser-tool capabilities were exercised. Native disassemblers, firmware and managed-binary tools do not answer web-page questions, and no native app binary was supplied. Publisher app features remain reported claims unless observed in this browser investigation.

No Akinator artwork, Lottie files, code, cookies, credentials, challenge payloads or character database is committed. The OpenGuess blue genie is original. Bayesian updates and expected information gain are our implementation decisions, not a claim that Limule uses those techniques. Exact reference parity is not established; see [feature ledger](../feature-ledger.md).

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

## Earlier v1 boundary

The first automated visit encountered Cloudflare verification and HTTP 403. Its challenge-only inspection informed the original release but did not reveal live gameplay. The normal-browser captures above provide additional public-flow evidence for v2. Neither investigation recovered private server internals.

## Additional reference observations

REA Objects capture `ev_fddc1093143a4311d3d0345eff50cac5b0ff59b321e87ca41c285e59002646de` showed semantic questions about pocket fit, electrical power, size and use involving the mouth. Animals capture `ev_e9a95ad54e90001f33a87f21fbfe5640ed582f1d7e859bc2a23cdfbf46b221a6` covered domestication, legs/limbs, being alive and eyes. These support broad subject-specific question families, not orthographic identification.

The [canonical English publisher FAQ](https://en.akinator.com/content/6/Everything-you-039-ve-always-wanted-to-know-about-Akinator) was readable in normal Chrome, evidence `ev_9e595f4b70df66b6e88b0a03d5882595ce7ff1e61e8659549205841af68c0ecd`. It describes a proprietary Limule algorithm, truthful real/fictional-character answers, duplicate-aware character additions after failure, moderated name refinements, duplicate checking for proposed questions and permission requirements for moderated photos. Scenario actions completed but requested event-family coverage remained incomplete.

These contribution workflows are publisher-described requirements, not features all recovered from server code. OpenGuess implements local JSON proposals and manual review; automatic duplicate comparisons and name-refinement moderation remain pending in the [feature ledger](../feature-ledger.md). The private server algorithm is unknown, so the independent semantic engine is informed by observable gameplay rather than recovered backend source.
