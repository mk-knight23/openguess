# Version 0.2 verification ledger

This upgrade extends the verified 0.1 foundation, but old test counts, screenshots and REA digests do not authenticate the final 0.2 build. Record final revision, runtime, checks and live deployment below before declaring release complete.

## Required release evidence

- Unit/integration checks for sparse data, optimized inference, worker lifecycle, local progress validation, localization and optional cloud boundaries.
- Strict typecheck, production build, formatting and dependency audit on the final revision.
- Pack quality report and actual browser latency measurements; separate synthetic timings from device benchmarks.
- Desktop/mobile production browser journeys, keyboard/correction/rejection, pack switching, daily completion, proposal export and backup import/reset.
- Accessibility results for measured states, without claiming full certification.
- Source/security review and tracked-file inspection excluding secrets, user profiles and raw reference captures.
- Public repository/Pages availability and real deployed gameplay.
- Optional Supabase provisioning, account/backup behavior and cross-user access-policy checks. Source tests alone cannot establish a live service works.

## Research evidence

[Reference investigation](research/akinator.md) now includes normal-browser gameplay observations. The event families were incomplete despite completed actions; static graph extraction has unresolved nodes. No proprietary server algorithm was recovered.

## Results

Local release checks completed on 2026-10-14 with Node 24.19.0:

- 78 unit/integration tests passed across 13 files, including semantic eligibility, seeded replay, worker lifecycle, featured profiles, uncertainty, pool selection, progress validation and cloud boundaries.
- Strict TypeScript checking and production build passed. Packs and optional account code load separately. Vite reports large generated data chunks; this is documented rather than treated as a worldwide capacity claim.
- Formatting and dependency audit passed; zero reported vulnerabilities. A scan of 101 prospective repository files found no private credential values.
- Production browser checks passed in Chromium at desktop and mobile sizes: all five theme loads, answers/undo, Harry Potter identified through six semantic clues, result correction, collection award, library search, daily targets, profile persistence, RTL, backup validation, proposal download, same-file import retry, honest all-unknown exhaustion and real anonymous cloud-score loading. Ten measured states passed automated WCAG A/AA checks. See `browser-qa.json` and the regenerated screenshots.
- All 128 featured targets resolved in semantic-only oracle evaluation with date answers unknown. Independent review additionally replayed 20 seeds per subject (2,560 rounds), with no wrong or unresolved results and at most ten questions. These are internal model/data consistency checks, not measured human accuracy.
- The full 5,584-record experimental catalog remained unresolved for all 50 sampled targets. Its broad record count does not imply reliable semantic recognition; default gameplay uses the 128 featured profiles.
- Both Supabase migrations are applied; 24 live ownership/isolation checks passed and disposable accounts were cleaned up. Public signup/email delivery still needs hosted mail and redirect configuration; it is not claimed verified.
- Source review resolved storage-warning loss, public account-ID exposure, stale inference, duplicate film identities and incorrect license labels. Automated review also resolved stale documentation, conflicting annotation tags, a punctuation-sensitive test locator, file-input reselection and legacy base64url key decoding. No remaining material blocker was found in the reviewed correction.

Published through [PR #1](https://github.com/mk-knight23/openguess/pull/1), source revision `90e58ee`, main merge `053a4a3`. [Main CI](https://github.com/mk-knight23/openguess/actions/runs/38517609088) and [Pages deployment](https://github.com/mk-knight23/openguess/actions/runs/38517609089) passed.

The [live site](https://mk-knight23.github.io/openguess/) passed the same 24 browser checks, including ten accessibility states. Five additional live rounds identified Albert Einstein, Harry Potter, Cat, Guitar and the intended Titanic film using semantic questions; thinking/confident/celebration poses and five collection entries were checked. Reports are `live-browser-qa.json` and `live-semantic-rounds.json`. A slow mobile load event timed out in the first live harness run; navigation to DOM readiness followed by actual game-ready assertions passed, without weakening gameplay checks.

REA additionally observed the published site's real semantic question and five answer controls in `ev_56be4905476017f3c9646cd0ebc324bd3ea642e7741f0ae8ce93fc10648623f6`. Both controlled actions completed; REA still marked event coverage incomplete. This observation does not authenticate all runtime behavior or replace the separate browser checks.

## Reproduce

Use Node.js 24, `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm run format:check`, `npm audit --audit-level=high` and the current browser-test script. See [data provenance](data-provenance.md) for importer reproduction and [benchmarks](benchmarks.md) for measurement details.
