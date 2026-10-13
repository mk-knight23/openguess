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

Final 0.2 results are pending the release operator's completed check report. Existing v1 `browser-qa.json` and screenshots are historical until regenerated and explicitly identified.

## Reproduce

Use Node.js 24, `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, `npm run format:check`, `npm audit --audit-level=high` and the current browser-test script. See [data provenance](data-provenance.md) for importer reproduction and [benchmarks](benchmarks.md) for measurement details.
