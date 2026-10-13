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
