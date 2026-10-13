# Contributing

OpenGuess welcomes reviewed contributions to its engine, interface, tests, documentation and independently authored catalog.

1. Describe the problem and intended behavior in an issue or pull request.
2. Work on a focused branch. For engine behavior, write a failing test before the implementation.
3. Run `npm test`, `npm run typecheck`, and `npm run build`.
4. Submit a pull request with the reason for the change, validation results and any limitations. Changes need review before merge.

## Catalog changes

Use stable, unique character and question IDs. Supply every required trait as `true`, `false`, or `null`; `null` means unknown or ambiguous, not false. Keep descriptions concise, factual and independently written. Explain disputed traits and cite primary sources in the pull request when practical. Do not copy another game's database, descriptions, images or branding.

Keep entries distinguishable using the available questions. Add or update catalog tests for schema validity, unique IDs, complete trait maps and distinguishable signatures. Replay known catalog entries through the engine tests so a change cannot silently break existing guesses. Respectful public figures and fictional characters are suitable; avoid entries about private individuals or sensitive speculative claims.

A JSON proposal exported from the app is a suggestion, not a trusted import or shared database update. Review its contents, correct traits, add the entry through source changes, and run the same tests before merge. Never commit personal browser statistics, private profiles, secrets or unrelated local files.

## Interface changes

Keep keyboard and screen-reader navigation usable and verify the interface at desktop and mobile widths. Describe manual checks in the pull request. Use original assets or include appropriate attribution and permission for third-party assets.
