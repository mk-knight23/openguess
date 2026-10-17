# V2 scale pilot: measured enrichment, qualification incomplete

The pipeline acquired and compiled a bounded 100-subject Wikidata/DBpedia cohort in every category, audited independent animal traits and recorded a separate featured/middle-density/sparse-tail cohort. The improved source-rich bird pilot joins 99 species, each with at least 25 supported propositions across five topics before adding opposing family contrasts. Sixty-four pass the conservative mechanical screen; none is replay qualified or promoted. The pilot has zero pairs lacking an explicit distinction, but ten pairs still lack two distinguishing evidence groups and complete-universe semantic replay remains pending. The requested 5,000 qualified subjects per category / 25,000 total is incomplete.

Reproduce acquisition and screening in this order:

```sh
python3 scripts/knowledge/acquire.py --limit 100
python3 scripts/knowledge/build_pilot.py
python3 scripts/knowledge/enrich_animals.py
python3 scripts/knowledge/enrich_birds.py
python3 scripts/knowledge/stratify.py
python3 scripts/knowledge/probe_featured.py
python3 -m unittest discover -s scripts/knowledge -p 'test_*.py'
```

`catalog-quality.json` records measured counts. Cached response receipts retain URL, retrieval timestamp and SHA-256; EltonTraits downloads additionally match published MD5. All new outputs remain quarantine under `scripts/knowledge/data/`, outside default gameplay. A source-rich profile is not automatically familiar, distinct or replay-qualified.

## Original bounded multi-source cohort

This first cohort selects 100 existing Wikidata identities per category in deterministic ID order. It is separate from the later stratified and bird cohorts.

| Category | Selected | Legacy Wikidata assertions | DBpedia matched subjects | DBpedia assertions | Newly replay qualified |
|---|---:|---:|---:|---:|---:|
| People | 100 | 673 | 98 | 1,779 | 0 |
| Fiction | 100 | 438 | 21 | 64 | 0 |
| Animals | 100 | 217 | 26 | 49 | 0 |
| Objects | 100 | 182 | 32 | 71 | 0 |
| Movies | 100 | 814 | 97 | 1,577 | 0 |

All 25 bounded DBpedia batch queries succeeded. Matching coverage is weak for fiction, animals and objects. Technical ontology properties contribute to raw counts; these are not all familiar gameplay clues. DBpedia and Wikidata remain conservatively correlated as one Wikimedia origin. Missing matches stay missing. Legacy Wikidata truthy exports lack original statement/reference IDs; this limitation and original retrieval dates are retained.

`build_pilot.py` compiles existing structured Wikidata positive claims against existing question templates and executes conservative screening for all 500 identities. DBpedia proposition mapping remains pending. Two consecutive builds produced byte-identical compiled packs. Every profile in this original cohort fails the qualified-playable gate; detailed rejection counts remain in the report.

## Independent animal acquisition and enrichment

The checked EltonTraits distributions contain 290,575 retained numeric assertions across 15,393 scientific names. A bounded 100-name sample stores 1,949 assertions. The initial parser conservatively labels 200,163 assertions without confirmed species-level flags uncertain/imputed and 90,412 with support flags; subsequent reviewed bird mappings additionally interpret documented certainty A correctly. These are metadata flags, not independently verified biological facts. The published mammal file requires Windows-1252 decoding; tests cover its actual hyphenated columns and certainty fields.

`enrich_animals.py` queried P225 scientific names and P105 rank for 1,100 animal QIDs. Eleven successful requests returned 1,098 taxon rows, producing 133 exact, unambiguous species-rank joins and 94 acceptable species-level adult-average mass measurements. Four explicit thresholds per measurement produce 376 projections in 94 evidence groups. Raw source numbers, methods, flags and identity receipts are retained. Imputed genus/family/phylogenetic values and length-derived PrimScale methods are rejected. Four mass thresholds remain one topic and one evidence group, so this enrichment alone cannot qualify a profile.

Publisher variable documentation was inspected before compiling traits. Mammal Diet/Activity certainty ABC can include congeneric estimates, so those columns remain uncertain for species confirmation. A measurement's scope binds the fact and question without replacing entity/portrayal scope. No missing value creates a negative.

## Bird pilot: sufficient topic coverage, insufficient distinction

The 9,995-row bird distribution contains 7,139 rows satisfying Diet-Certainty A, ForStrat-SpecLevel 1, BodyMass-SpecLevel 1 and the Dunning08 mass method. The sample spreads 100 rows across supplied families and source completeness, rather than taking adjacent taxonomy-ordered entries. It produced 99 unambiguous Wikidata species/name joins with no acquisition failures. Each subject has 24 nontaxonomic propositions: nine dietary components, seven foraging strata, seven adult-average mass thresholds and main nighttime activity, plus its supplied family classification. All 99 meet the mechanical 20-proposition/five-topic coverage minimum before any opposing family alternatives; this is an observed pilot yield, not a long-tail qualification estimate. Fixed bird mass thresholds are 10g, 50g, 100g, 500g, 1kg, 5kg and 10kg. Their common measurement group prevents seven thresholds becoming seven independent confirmations; humans may still find species-average mass hard to answer.

Explicit recorded percentage zero supplies a negative; omission and imputation supply none. Diet components share a diet evidence group, foraging strata share a foraging group and mass thresholds share one mass group. Publisher source indexes and variable metadata identify upstream reference families: Handbook of the Birds of the World, Dunning08 body mass and the supplied BirdLife classification. Their lineage stays distinct while they share the EltonTraits CC0 distribution. The original books/datasets were not independently read or fact-audited; source-family attribution is not an independent verification claim.

Family contrasts use the explicit functional family assignment, not missing claims: a subject assigned to a different known family in the same documented taxonomy cohort may safely answer no. The BLFamily columns are supplied BirdLife V3.0 classification; Taxo records BL3 or IOC27 species authority, and opposing claims are conservatively restricted to the same cohort scope. No negative is derived for missing or mismatched assignments. There are 12,079 total Boolean projections, many correlated family alternatives; these do not add evidence groups.

The improved projection has zero pairs without an explicit opposed answer, compared with 103 in the earlier adjacent-family sample. Ten pairs still have fewer than two distinguishing evidence groups, compared with 1,005 previously. The stricter all-rival screen accepts 64 of 99 profiles; the other 35 lack sufficient independent rival distinctions under the current evidence model. This is screening only: no profile has a complete-universe replay receipt or independent human fact audit. The cohort and questions changed, so the before/after pair counts are diagnostic samples, not a controlled human accuracy comparison.

The next high-yield animal work is reviewed appearance, geographic range and behavior distinctions from compatible primary species datasets, preserving exact taxon/version matches and upstream references. More coarse mass thresholds or taxonomy aliases cannot remedy these measured collisions. Broader bird acquisition should follow a successful near-rival repair pilot, rather than advertise thousands of source-rich rows as playable.

## Objects, stratification and existing featured identities

Princeton WordNet 3.0 provides 11,587 noun artifact senses; a bounded 100-sense sample retains aliases, hypernyms and the required notice at `scripts/knowledge/data/wordnet-LICENSE.txt`. Definitions are excluded. Synonyms do not inflate counts, and no label-only object merge is made. Taxonomy alone does not supply twenty familiar propositions. The next object source must add sense-matched uses, materials, locations and parts, with genuinely separate upstream lineage; ConceptNet's WordNet-derived edges would remain correlated with WordNet.

`stratify.py` records 100 subjects per category, including all existing 128 featured profiles plus middle source-density and sparse-tail strata. Source density is a proxy for data difficulty, not measured human familiarity. Human familiarity, close-rival and portrayal/sense audits remain required.

`probe_featured.py` checked all 128 featured source links: 22 existing QIDs matched DBpedia, 104 authored source pages produced identity candidates and two stayed unmatched, with no query failures. None was automatically merged. A source page may describe a work, broad animal group, object sense or another portrayal. Taylor Swift's page, for example, yields multiple QID candidates and cannot safely establish a unique canonical identity alone.

People, fiction and movies still need independently useful, reusable domain-source evidence and reviewed proposition mappings. MusicBrainz core identity facts are a plausible musician subset, not a source for all people; a live known-ID probe returned Taylor Swift's artist record, but those facts are not yet ingested or certified independent of Wikimedia. Fiction's 21/100 DBpedia match rate makes publisher/domain-source curation the concrete bottleneck. More Wikidata rows alone cannot complete this target.

## Verification and limits

Thirty-two Python behavioral tests pass. They cover source licenses, exact cache replay/corruption/failures, upstream mirror correlation, identity/scope/alias collisions, unknown/conflict compilation, metadata cycles, measurement scopes, citation lineage, duplicate and rival screening, digest/replay-universe invalidation, cross-language safe-number constraints, actual EltonTraits columns, bird uncertainty and explicit zeroes, a 20/five-topic profile with correlated bird mass thresholds, version-scoped functional family negatives, WordNet notices and stratified uniqueness. RED/GREEN evidence is under `scripts/knowledge/evidence/`.

Independent factual audit and final-universe engine replay are pending. No new incomplete record enters default play; zero newly acquired profiles count toward the release requirement.

Source availability probes are retained in `scripts/knowledge/data/source-availability.json`. The bounded ConceptNet hammer endpoint probe returned HTTP 502 and yielded no assertions; its failed response body was not retained. MusicBrainz's successful known-ID probe has a checksum/retrieval receipt. Neither probe is counted as completed enrichment.
