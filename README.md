# OpenGuess

A free, open-source guessing game with an original blue genie, adaptive questions and explainable local inference.

[Play](https://mk-knight23.github.io/openguess/) · [Source](https://github.com/mk-knight23/openguess) · [Research](docs/research/akinator.md) · [Verification](docs/verification.md)

## V2 · release 0.2.2

The latest V2 maintenance release improves answer-conditioned question selection, scoped follow-ups and recovery from mistaken premises. A 2.2-second reveal lets you see the selected answer while calculation starts immediately. Undo, Restart and Give up cancel pending reveals, including when the calculation worker is slow. Equivalent questions are suppressed within a round.

The repository now includes reproducible multi-source acquisition, explicit fact scope and uncertainty, a shared playable-pool projection and build-time qualification checks. **The 5,000 playable subjects per category expansion is unfinished.** A 99-bird pilot has 64 mechanically screened profiles, with none yet replay-qualified or added to default play. See [release notes](CHANGELOG.md), [verification and limits](docs/v2-scale-status.md), [source pilot](docs/data-pilot.md) and [catalog quality](docs/catalog-quality.json).

Five themes default to **128 featured profiles** with independently authored semantic facts: 32 people, 36 fictional characters, and 20 each of animals, objects and films. The full sourced catalog contains **5,584 records** (1,123 people, 1,114 fictional characters and 1,120 each in animals and objects, and 1,107 films) and is available through an explicit **Experimental** opt-in and the library. Its sparse imported profiles are not equivalent to the featured game's quality or worldwide coverage.

Gameplay asks about meaningful properties, not letters in a name. Spelling questions are excluded. When semantic evidence cannot distinguish candidates, the round remains inconclusive. Raw Wikidata statements are CC0; independently authored semantic annotations are MIT and carry separate provenance. See [data provenance](docs/data-provenance.md).

- Five answer strengths, semantic adaptive questions, answer correction, undo, rejection and restart.
- Original animated genie interface, transparent candidate weights and a visible library.
- Five daily discoveries per selected theme, local points, awards, collection and streaks.
- Validated progress backup/restore, local profile, sound and reduced-motion settings.
- Eighteen **partial interface** languages; questions and catalog descriptions remain English.
- Character, question and photo proposals exported for manual review; no automatic shared learning.
- Optional Supabase account, cloud backup/restore and opt-in public nickname/win totals when a deployment is configured. Gameplay remains available without an account. Cloud verification is recorded separately in [verification](docs/verification.md).

No ads, subscriptions, paid AI or gameplay pricing. Local scores are editable and are not competition-grade rankings. A family setting cannot guarantee that every imported entity is suitable for every child.

## Run locally

Use **Node.js 24** and npm.

```sh
npm ci
npm run dev
npm test
python3 -m unittest discover -s scripts/knowledge -p 'test_*.py'
npm run typecheck
npm run build
npm run preview
```

For production-browser checks, install Chromium with `npx playwright install chromium` and run `npm run test:e2e`; an installed Chrome can be selected with `BROWSER_EXECUTABLE`. Consult [verification](docs/verification.md) for current commands and results.

Static output is in `dist/`. GitHub Pages builds use `DEPLOY_BASE=/openguess/`; root-path deployments default to `/`. Optional cloud configuration uses public client environment variables and a separately provisioned database with access policies; never put service-role secrets in a browser build. See [cloud setup and verification](docs/cloud.md).

## How it works

The purpose is to infer the subject a player is thinking of through relevant facts. Asking users to encode a name letter by letter does not meet that purpose. An earlier 50-round replay depended on 614 spelling answers and is superseded, not release evidence. The current evaluation covers 12,800 authored-answer rounds over 128 targets, 20 seeds and five answer policies. Exact and probable-answer policies recovered every target. The one-mistake policy produced four wrong guesses and four unresolved rounds; partial-unknown answers left 30 unresolved. [Main results](docs/conversation-evaluation.json) and [held-out results](docs/conversation-heldout-evaluation.json) record the limits. These are closed authored-fact diagnostics, not human accuracy, broad experimental-catalog recovery or an independent fact audit.

Bayesian updates rank candidates from authored/imported traits. Information gain chooses unasked questions. A worker keeps larger-pack inference off the interface thread. “Don't know” adds no evidence; absent Wikidata claims remain unknown. Model percentages are relative weights within the chosen pack, not calibrated chances of a correct answer.

See [architecture](docs/architecture.md), [scaling](docs/scaling.md), [feature ledger](docs/feature-ledger.md), [roadmap](docs/roadmap.md), [contributing](CONTRIBUTING.md), and [security](SECURITY.md).

REA investigation observed Akinator's public browser interface, including question/answer transitions. Its server algorithm and database remain unknown. OpenGuess includes no Akinator code, assets or scraped database. Application code is [MIT licensed](LICENSE); the runtime catalog combines CC0 Wikidata statements and MIT semantic annotations. Quarantined source-pilot data retains its own terms, including DBpedia attribution/share-alike and the WordNet notice; see [data provenance](docs/data-provenance.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Free software does not mean unlimited free hosting.
