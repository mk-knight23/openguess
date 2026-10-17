# Build-time knowledge pipeline

Run behavioral checks with `python3 -m unittest discover -s scripts/knowledge -p 'test_*.py'`.
Run the bounded acquisition with `python3 scripts/knowledge/acquire.py --limit 100`.
Network acquisition runs serially with a cache under `/tmp/openguess-knowledge-v3`; URL, SHA-256, response bytes and retrieval time are recorded. An existing cache replays byte-identical responses and rejects corruption. Failed requests are recorded and never replaced by invented assertions. The raw source cache is external to Git; bounded pilot assertion projections and receipts are under `data/`.

## Boundaries

- `sources.json` assigns reuse terms and conservative upstream origins. Two providers are not automatically two independent origins.
- `normalize.py` merges explicit canonical identities only within the same scope. Names never establish identity. Ambiguous old aliases fail.
- `compile.py` accepts explicit Boolean assertions against reviewed question IDs. Unknown, conflict, imputed and out-of-scope evidence remains inspectable and does not create a Boolean trait. It validates implication/prerequisite references and cycles; it does not yet derive implication closure.
- `qualify.py` screens 20 supported propositions across five topics and requires two supported differences, evidence groups and origins against every rival. Rival unknown values do not discriminate. These conservative mechanical checks do not independently establish familiar language, factual correctness or absence of correlated upstream references.
- Final qualification additionally needs an external replay receipt for at least five distinct seeds against the exact subject/question universe digest. The receipt is an interface for the engine evaluator, not a self-generated claim of success. Qualification stays pending until that evaluator exists and runs against the final category.
- Raw DBpedia predicates and numeric EltonTraits columns are **not** automatically compiled into player questions. `data/` is acquisition quarantine, not a game pack. No application imports this directory.

## Data terms

Wikidata: CC0. DBpedia structured facts: CC BY-SA 3.0, attributed to DBpedia and its Wikipedia contributors, with exact response receipts; preserve share-alike terms for derived data. The DBpedia pilot includes ontology assertions, excludes article abstracts and page link lists, and retains entity URLs for attribution. DBpedia and legacy Wikidata are conservatively assigned the same Wikimedia origin. Legacy Wikidata exports lack original statement/reference IDs; this limitation is retained on every assertion.

EltonTraits 1.0: Wilman, Belmaker, Simpson, de la Rosa, Rivadeneira and Jetz; Figshare article 3559887 version 1, CC0. Downloaded files must match published MD5 as well as local SHA-256. Species-level flags are retained; non-species-level or missing flags remain imputed/uncertain. Scientific-name joins and per-column metadata audit are pending. The stored sample does not imply that the existing animal pilot has already been joined.

Do not describe this acquisition as 25,000 playable profiles. Read `docs/catalog-quality.json` for actual counts and `docs/data-pilot.md` for remaining work.

WordNet 3.0 is acquired from Princeton's `WNdb-3.0.tar.gz`. The artifact noun sample retains sense IDs, aliases, hypernym pointers and the required license/copyright/disclaimer header in `data/wordnet-LICENSE.txt`; no definitions are copied. Raw noun-file counts are lexical senses, not automatically distinct familiar playable objects. No text-label identity join is performed.

After acquisition, run `python3 scripts/knowledge/build_pilot.py` to compile the existing licensed Wikidata positive claims against the existing structured question templates, then execute conservative screening. DBpedia and independent-source assertions remain raw until their proposition mappings are reviewed. This writes `*-compiled.json` in quarantine and measured screening reasons into the quality report. No replay receipt is fabricated; the compiler produces zero newly qualified profiles until the actual gate passes.
