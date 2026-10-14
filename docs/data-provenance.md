# OpenGuess data provenance

Raw imported Wikidata statements are [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Independently authored semantic annotations are MIT and carry separate annotation source/license fields. These mixed packs are not entirely CC0. No Akinator database, scripts, artwork or article prose is included.

## Default and experimental scopes

Default play uses 128 featured profiles: 32 people, 36 fictional characters, 20 animals, 20 objects and 20 films. The people/fiction profiles reuse 68 independently authored starter profiles; 60 new animal/object/film profiles use explicit semantic annotations and source references from `scripts/curated-core.json`.

The full catalog contains 5,597 records: 1,123 people, 1,114 fictional characters and 1,120 each animals, objects and films. Full-catalog play is an explicit Experimental opt-in. Raw animal queries draw primarily from mammal taxa; raw object queries focus on vehicle/tool/instrument types. Featured profiles supplement those scopes. Catalog counts do not prove distinctive semantic knowledge or human recognition accuracy.

## Reproduction

```sh
python3 scripts/import-wikidata.py
python3 scripts/build-core.py
```

The importer requires Python 3 and curl, identifies its public Wikidata requests, pauses between serial requests and caches responses under `/tmp/openguess-wikidata-v2`. Queries and retrieval metadata document the raw source. The core builder reproducibly overlays independently authored profiles and semantic questions; rerunning it does not fabricate duplicate entries. Inspect both scripts and source annotations before regenerating releases.

## Truth and uncertainty

Absent raw claims stay unknown, never silently false. Curated boolean traits express authored familiar portrayals, not independently audited universal facts. Fictional versions can differ; unclear interpretations should use unknown. Source Wikipedia references support provenance review, not a claim that every trait was individually verified. Do not invent Wikidata QIDs for curated profiles.

Spelling and letter questions are excluded from gameplay and raw generation. The old spelling-heavy replay is superseded. The corrected featured oracle recovered 128/128 with zero wrong or unresolved results and at most ten questions, using stored closed-world traits. It is not human accuracy, an independent fact audit or proof that all experimental entries are distinguishable.

Review questions, source references, duplicate semantic signatures and missing-data coverage when updating packs. Retain stable IDs for collections, update versions/retrieval timestamps, and rerun data and semantic-replay checks. Photos need separate rights review and are not automatically imported through proposals.
