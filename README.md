# OpenGuess

A free, open-source guessing game with an original blue genie, adaptive questions and explainable local inference.

[Play](https://mk-knight23.github.io/openguess/) · [Source](https://github.com/mk-knight23/openguess) · [Research](docs/research/akinator.md) · [Verification](docs/verification.md)

## Version 0.2

Five themes default to **128 featured profiles** with independently authored semantic facts: 32 people, 36 fictional characters, and 20 each of animals, objects and films. The full sourced catalog contains **5,597 records** (1,123 people, 1,114 fictional characters and 1,120 in each remaining theme) and is available through an explicit **Experimental** opt-in and the library. Its sparse imported profiles are not equivalent to the featured game's quality or worldwide coverage.

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
npm run typecheck
npm run build
npm run preview
```

For production-browser checks, install Chromium with `npx playwright install chromium` and run `npm run test:e2e`; an installed Chrome can be selected with `BROWSER_EXECUTABLE`. Consult [verification](docs/verification.md) for current commands and results.

Static output is in `dist/`. GitHub Pages builds use `DEPLOY_BASE=/openguess/`; root-path deployments default to `/`. Optional cloud configuration uses public client environment variables and a separately provisioned database with access policies; never put service-role secrets in a browser build. See [cloud setup and verification](docs/cloud.md).

## How it works

The purpose is to infer the subject a player is thinking of through relevant facts. Asking users to encode a name letter by letter does not meet that purpose. An earlier 50-round replay depended on 614 spelling answers and is superseded, not release evidence. The corrected featured-profile oracle recovered 128/128 targets with zero wrong or unresolved rounds and at most ten questions. This tests closed authored facts, not human accuracy, broad experimental-catalog recovery or an independent fact audit.

Bayesian updates rank candidates from authored/imported traits. Information gain chooses unasked questions. A worker keeps larger-pack inference off the interface thread. “Don't know” adds no evidence; absent Wikidata claims remain unknown. Model percentages are relative weights within the chosen pack, not calibrated chances of a correct answer.

See [architecture](docs/architecture.md), [scaling](docs/scaling.md), [feature ledger](docs/feature-ledger.md), [roadmap](docs/roadmap.md), [contributing](CONTRIBUTING.md), and [security](SECURITY.md).

REA investigation observed Akinator's public browser interface, including question/answer transitions. Its server algorithm and database remain unknown. OpenGuess includes no Akinator code, assets or scraped database. Application code is [MIT licensed](LICENSE); raw imported structured data is CC0 and original semantic annotations are MIT and dependencies retain their [notices](THIRD_PARTY_NOTICES.md). Free software does not mean unlimited free hosting.
