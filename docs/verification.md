# Version 0.1.0 verification

Verified on 2026-10-14 using Node.js 24.19.0 and Chrome 155 on macOS. The repository pins its runtime for Volta and runs Node.js 24 in CI.

## Automated checks

- 22 unit/integration tests: inference invariants, catalog validation, ideal full-catalog replay and user navigation/gameplay regressions.
- Strict TypeScript checking and production Vite build.
- Prettier consistency and dependency audit with no reported vulnerabilities at verification time.
- Production-browser smoke tests: 15 named checks in [the machine-readable report](browser-qa.json), including start, keyboard, answer undo, correct guess, rejection, scope changes, library search, all-unknown exhaustion, proposal download content/category, local-stat persistence/reset, mobile overflow and mobile answer/undo.
- Axe checks against WCAG 2 A/AA and 2.1 AA tags for the home, question, guess, contribution and mobile-home states. No automated violations remained in those captured states. This is not a claim of complete accessibility certification.
- No page errors or third-party runtime requests were observed along the tested desktop flow. The fonts are self-hosted.

## Test-first evidence

The initial UI tests failed because start, library and explanation controls were absent, then passed after implementation. Review regression tests failed on four flows (scope change, library start, proposal category and result undo) before their corrections. The athletic-trait regression failed before its data correction. Accessibility checks failed on secondary text contrast and the mobile GitHub link name before those fixes. The catalog and inference agents recorded their red/green evidence in the development session.

## Reviews

Independent specification/security and adversarial reviews inspected the implementation. They identified the gameplay/category/scope defects documented above, which were fixed and covered by regressions. A second pass found no remaining gameplay/security blocker; its formatting finding was corrected. Source and tracked-file review found no private profile, credentials, copied reference-game scripts or raw challenge payloads. The audit covers this static first edition; future external services need a new threat model.

## REA verification

[Scoped REA evidence summary](research/openguess-rea.json) records the local production target, inspection, bundle digest and controlled start/answer/undo scenario. All declared scenario actions completed, but REA marked the requested event family incomplete. Passive inspection carries attachment and origin-filter limits. Static bundle parsing completed with one script and zero parse failures.

REA additionally exported the retained application script into a digest-verified local manifest (`ev_d9a079e60643bb88021c0f15795f92d32d393f7dfa97a9101d958c5603b67894`) and analyzed the exported application (`ev_5c55173a94b6c4b3c036975e3f5d02a0e363ad6435992e95083567cb4674b0ee`). The broad semantic graph reached the worker heap limit and is partial; it is not evidence of complete code-flow recovery. These captures preceded the final contrast/mobile-label adjustments and authenticate the captured build, not every later artifact. Source tests and the final browser run cover the released implementation.

The reference investigation remains bounded by Akinator's verification barrier, as described in the [research ledger](research/akinator.md). Neither these checks nor the synthetic 68/68 benchmark establish worldwide knowledge coverage or measured accuracy with human players.

## Reproduce

Run `npm ci`, `npm test`, `npm run typecheck`, `npm run format:check`, `npm audit --audit-level=high`, and `npm run test:e2e`. Browser tests require Chromium or an explicit browser executable. CI repeats these checks on the repository's final revision; consult GitHub Actions for its actual results.
