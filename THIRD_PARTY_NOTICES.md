# Third-party notices

OpenGuess's application code and independently authored starter catalog use the MIT license. Names of public figures and fictional characters identify the subjects of the game; they do not confer ownership of related brands or imply endorsement. No reference-game images or character portraits are distributed.

Production dependencies retain their own licenses. Copies of notices for the bundled React runtime, Lucide icons and self-hosted fonts are in `licenses/`. DM Sans font files are licensed under the SIL Open Font License. Development tooling has its own upstream notices in its installed packages; the lockfile identifies the exact versions used.

| Dependency                | License                   | Purpose                                     |
| ------------------------- | ------------------------- | ------------------------------------------- |
| React and React DOM       | MIT                       | Interface runtime                           |
| Lucide                    | ISC                       | Interface icons                             |
| DM Sans                   | SIL Open Font License 1.1 | Interface typography                        |
| Supabase client libraries | MIT                       | Optional accounts and private cloud backups |

The Fontsource distribution supplies font CSS and binaries. Its package metadata and upstream font notices remain applicable. The genie's SVG illustration and the OpenGuess identity are original to this project.

The five v2 catalog packs combine Wikidata structured data under CC0 with independently authored MIT semantic annotations and featured profiles. See [data provenance](docs/data-provenance.md) for source queries, retrieval dates and scope. No Wikidata portrait images or Akinator artwork are bundled.

## Build-time source pilot

The acquisition data under `scripts/knowledge/data/` is quarantined and is not bundled into runtime gameplay. Its source terms remain distinct from the application MIT license:

- DBpedia ontology assertions: attribution to DBpedia and Wikipedia contributors under CC BY-SA 3.0, with entity URLs and retrieval receipts retained in each pilot.
- EltonTraits 1.0 (Wilman et al., Figshare article 3559887, version 1): CC0 as declared by the pinned distribution; original reference lineage and imputation flags remain attached.
- Princeton WordNet 3.0: the full required notice is retained in [wordnet-LICENSE.txt](scripts/knowledge/data/wordnet-LICENSE.txt).

See [source provenance](docs/data-provenance.md), the [source registry](scripts/knowledge/sources.json) and [pilot limits](docs/data-pilot.md). These imports do not imply independent verification of every underlying fact or ownership of names and brands.
