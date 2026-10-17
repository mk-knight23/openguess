# V2 scale pilot: acquisition milestone, qualification incomplete

The reproducible command is `python3 scripts/knowledge/acquire.py --limit 100`. The report in `catalog-quality.json` is derived from actual cached responses. The pilot selects 100 existing Wikidata identities in each category in deterministic ID order. This establishes a reproducible acquisition sample; the planned familiar/middle/difficult stratification and close-variant audit remain incomplete.

Every category has a real DBpedia query, retaining actual ontology assertions where the identity joins. Unmatched subjects remain unmatched. DBpedia and Wikidata are two source families with potentially shared upstream facts; the report conservatively counts one independent origin. No absence is converted to false. DBpedia resource URLs and hashes preserve attribution and retrieval lineage. Original legacy Wikidata statement/reference IDs cannot be recovered from the existing truthy export.

The independently sourced EltonTraits acquisition preserves uncertainty flags and verifies published file checksums. Its scientific-name identity join, per-column semantics and familiar question templates still need review. Its acquisition total is not a count of playable animals.

No newly acquired subject is declared semantically or replay qualified. There are still zero newly replay-qualified subjects toward the 5,000-per-category requirement. The mechanical screening code and full-universe replay receipt boundary are implemented and tested, but the new raw assertions do not yet satisfy twenty familiar propositions across five topics, independent rival distinctions and five complete-universe replay seeds. No incomplete record enters default play.

Next acquisition work must broaden and independently substantiate people, fiction and movies; join audited animal traits; evaluate object sense sources with their notices; stratify and audit representative pilot subjects; then compile reviewed proposition templates before measured expansion. A larger Wikidata/DBpedia row count alone cannot complete the target. The requested 25,000 qualified playable catalog remains incomplete.

## Measured bounded run

| Category | Selected identities | Legacy Wikidata assertions | DBpedia matched subjects | DBpedia assertions | Replay qualified |
|---|---:|---:|---:|---:|---:|
| People | 100 | 673 | 98 | 1,779 | 0 |
| Fiction | 100 | 438 | 21 | 64 | 0 |
| Animals | 100 | 217 | 26 | 49 | 0 |
| Objects | 100 | 182 | 32 | 71 | 0 |
| Movies | 100 | 814 | 97 | 1,577 | 0 |

All 25 bounded DBpedia batch queries succeeded. Matching coverage is weak for fiction, animals and objects; listing DBpedia in a manifest would have concealed that limitation. Assertions include technical ontology properties, so raw counts overstate familiar gameplay yield.

The checked EltonTraits distributions contain 290,575 retained numeric trait assertions across 15,393 scientific names. A 100-species sample stores 1,949 assertions; the rest remains reproducible from the external cached distribution. 200,163 assertions lack a confirmed species-level flag and remain conservatively imputed/uncertain; 90,412 carry species-level support flags. Those flags are not an independent factual audit, and these records have not been joined to the game. The initial UTF-8 decode failed on the published mammal file; the adapter now uses its Windows-1252 text and tests the actual hyphenated column schema while preserving certainty flags.

WordNet 3.0 was acquired from Princeton's distribution: 11,587 noun artifact senses are available, with 100 stored as a bounded sense sample. Each sense stores synonyms as aliases and taxonomic pointers; definitions are excluded. The required Princeton notice accompanies the sample in `scripts/knowledge/data/wordnet-LICENSE.txt`. No label-only join to existing objects is made. WordNet taxonomy alone does not supply the required twenty familiar propositions.

Twenty Python behavioral tests pass, covering license rejection, exact cache replay/corruption, failure reporting, mirror origin correlation, scope-safe normalization, alias collisions, conflict/unknown compilation, metadata cycles, duplicate/rival screening, replay-universe invalidation, real EltonTraits columns, and WordNet synonym/license preservation. RED/GREEN evidence for the new compilation/qualification and EltonTraits schema regressions is under `scripts/knowledge/evidence/`. The independent factual audit sample remains pending.
