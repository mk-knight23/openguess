# Architecture

## Static delivery, local inference

Vite builds a React and TypeScript application into static assets. The browser loads the versioned catalog and runs the inference engine. No question needs a network request or paid model call. UI components manage navigation and local state; the engine operates on explicit catalog data, answer history and rejected candidates.

The catalog defines characters, questions and boolean or unknown traits. These are authored evidence assumptions, not facts learned automatically during play. A starter catalog limits coverage deliberately and must be shown to players.

## Inference

Start with normalized candidate weights. For each answered question, multiply a candidate's weight by an answer likelihood derived from its trait, then normalize. The five choices express strong, weak or absent evidence. Unknown answers do not alter relative weights; unknown traits cannot justify certainty.

Choose an unasked question by its expected reduction in entropy over the current candidate distribution. This balances useful splits rather than choosing a fixed question order. Relative weights are model outputs and are not calibrated real-world confidence.

Undo reconstructs inference from the remaining history. Rejecting a guess removes that candidate from consideration; it does not fabricate an answer to a trait question. Empty pools, exhausted questions and indistinguishable candidates require honest inconclusive states.

## Contributions and persistence

Local preferences and statistics belong to the current browser. A proposal export produces JSON for a contributor to inspect and submit through a GitHub pull request. Maintainers validate its schema, evidence and impact before updating the catalog. There is no automatic shared learning in v1.

## Boundaries

Akinator is a reference game, not a dependency. REA reached a Cloudflare challenge on its public website. Its runtime guessing behavior and proprietary implementation were not recovered. The Bayesian and information-gain design here is original, not a claim about Akinator's internal algorithm.
