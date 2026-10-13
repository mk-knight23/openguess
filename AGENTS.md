# Working on OpenGuess

OpenGuess is an original free, open-source browser game. Keep core gameplay available without accounts, advertising, paid model calls or a remote server. Preserve the independent identity and starter-catalog limits.

## Structure

- `src/engine.ts`: pure inference and question selection.
- `src/data/catalog.ts`: versioned independently authored characters and questions.
- `src/App.tsx`: round state and orchestration.
- `src/components/`: presentation with explicit props.
- `scripts/smoke.mjs`: desktop/mobile production-browser checks.
- `docs/`: research boundaries, architecture, scaling and future versions.

## Workflow

Understand and plan each change, test behavior before implementing, keep changes focused, and review before publishing. Use the research ledger when discussing the reference game; do not claim its private algorithm was recovered. Use REA for shipped artifacts or declared runtime investigations, and ordinary source tools for this repository.

Run `npm test`, `npm run typecheck`, `npm run format:check`, `npm run build`, and `npm audit --audit-level=high`. Use `npm run test:e2e` when game behavior or UI changes; install Chromium with `npx playwright install chromium`, or set `BROWSER_EXECUTABLE` to a local Chrome-family executable. The smoke check owns a preview server on port 4175; it must be free.

Do not copy reference-game source, art, database entries, secrets, private user profiles or raw challenge payloads into this repository. Keep software license notices with redistributed dependencies and fonts. Community proposals require review and data provenance; a download does not update the catalog. Model percentages are relative weights, not calibrated accuracy. Keep future-version requirements in the roadmap and record non-obvious discoveries in `docs/knowledge.md`.
