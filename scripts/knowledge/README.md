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

`python3 scripts/knowledge/enrich_animals.py` acquires exact P225/species-rank identity joins and compiles audited nonimputed adult-average mass thresholds with raw source assertions, metadata/method/flag receipts and one shared evidence group per measurement. `stratify.py` writes featured/middle-density/sparse-tail cohorts. `probe_featured.py` records DBpedia sameAs candidates for all featured source pages without automatically merging ambiguous versions/groups. These outputs remain quarantine and are not imported by the app.

Universe digests exclude derived `qualification` fields but bind all other subject fields and all question fields, recursively sorted keys, compact UTF-8 JSON, subjects/questions sorted by ID. Numbers must be safe integers for Python/JavaScript serialization parity. A receipt minted before runtime transformation/question pruning cannot certify a different final playable universe.

`python3 scripts/knowledge/enrich_birds.py` compiles the separate source-rich bird pilot: audited certainty/species-level flags, explicit diet/foraging percentages, adult-average mass, activity and supplied family. It measures topic coverage and explicit rival collisions separately. The publisher's reference index resolves Handbook of the Birds of the World / Dunning08 / BirdLife lineage; the original books were not independently read. Citation families are not new provider families, and correlated component/threshold questions retain their original evidence group. Thirty-two behavioral tests pass; 64/99 bird profiles pass mechanical screening, none is replay qualified. The improved bird pilot uses 10g–10kg adult-average mass thresholds and family/source-density stratification; opposing family negatives require an explicit differing assignment in the same taxonomy cohort and share one taxonomy evidence group.
