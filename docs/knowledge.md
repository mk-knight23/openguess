# Project knowledge

Recorded 2026-10-14 for the initial release.

- REA public-site inspection encountered a Cloudflare challenge. Do not claim that live Akinator gameplay, hidden endpoints or its private algorithm were observed.
- Bayesian weighting and expected information gain are OpenGuess design decisions. Preserve this distinction in future explanations.
- Static delivery and browser inference avoid central gameplay state and per-question remote API costs. They do not eliminate bandwidth costs or browser limits.
- Catalog coverage is a product constraint. A guess can only come from supported entries, and inconclusive outcomes are valid.
- “Don't know” supplies no evidence; rejection removes a candidate without inventing evidence; undo replays history.
- Contribution JSON is local and untrusted. Only reviewed source changes update the shared catalog.
- Before enlarging packs, measure O(C × Q) selection behavior on actual target browsers.
- Keep private user context and local artifacts outside the public repository.

Validation results belong in release notes or the reviewing pull request once run. This file records decisions and limitations, not unexecuted verification claims.

- Full-library navigation must reset a narrower game scope; otherwise a visible suggested character can be impossible to guess. Explicitly test this transition.
- Proposal category is independent of the current game scope and must be selected, not guessed from “Everyone.”
- Keep correction controls on result screens so the answer triggering a guess can be undone.
- Appearance/ability questions need semantic consistency. Competitive sprinting and superhuman speed are separate facts.
- With Node 26, experimental global storage can conflict with a simulated browser. The tested baseline is Node 24; use real-browser checks for persistence/export.
- Axe's Playwright integration requires explicitly created browser contexts, including mobile contexts. Hidden text inside an icon-only mobile link needs an accessible name.
- Broad semantic analysis of a minified React bundle exhausted REA's default heap. Preserve partial coverage rather than equating script parsing with complete behavior recovery.
