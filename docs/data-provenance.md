# OpenGuess data provenance

Version 0.2 uses independently imported **Wikidata structured statements**, available under [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). It does not use Akinator's character database. Every imported entity includes its Wikidata QID, source URL, license, and retrieval timestamp. Application source code remains MIT.

## Reproducing the import

Run `python3 scripts/import-wikidata.py` from the repository root. Requires Python 3 and curl. The script fetches English-labeled entities and selected statement predicates through the public Wikidata SPARQL endpoint, using an identified User-Agent. Requests run serially, with a pause between requests and an on-disk query cache in `/tmp/openguess-wikidata-v2`. Optionally append theme IDs (for example `movies objects`) to import only those themes. Use `--force` to regenerate existing packs from cached source responses; preserve cache to avoid redundant requests. The exact seed query is recorded in each pack, and the importer's batch query construction is in source.

## Scope and inference limits

This is a finite, curated-by-query catalog, not all people or all animals worldwide. Animal entries are taxonomic entities, currently drawn from the mammal subtree because the unrestricted animal traversal exceeded the public endpoint response window; object entries focus on vehicle, tool and musical-instrument types, not individual possessions. These are documented query scopes, not claims of complete worldwide coverage. Claims can be incomplete or inaccurate. Missing semantic claims remain unknown: the importer never turns an absent occupation, nationality, material, habitat, director, or genre into a false fact.

The engine also uses explicit English-name spelling questions. These are known true or false from the displayed label and provide a fallback when source facts are sparse. Spelling is not a substitute for a rich semantic database. Each pack reports distinct full trait signatures and collisions, but that metric includes spelling; it does not imply every entity has a distinctive factual biography. Two entities with identical signatures cannot be separated by the current questions.

Birth and release dates become year-level questions; taxon discovery dates follow the source's discovery/described date property. Names and descriptions are retained as data, without copying article prose or reference-site artwork. No photos are imported, avoiding separate photo-license obligations.

## Updating and contributing

Contribute corrections to Wikidata or propose new question predicates in the importer. Review facts and question phrasing before publishing regenerated packs. Catalog updates should retain IDs for saved collections, update retrieval timestamps and version, run pack integrity tests, and publish the resulting quality counts. Do not fabricate entities to meet a catalog target.

## Imported pack quality (2026-10-14)

| Theme     | Entities | Semantic signatures | Full signatures including spelling |
| --------- | -------: | ------------------: | ---------------------------------: |
| people    |     1100 |                1097 |                               1100 |
| fictional |     1078 |                 533 |                               1076 |
| animals   |     1100 |                 320 |                               1089 |
| objects   |     1100 |                 399 |                               1072 |
| movies    |     1100 |                1099 |                               1100 |
