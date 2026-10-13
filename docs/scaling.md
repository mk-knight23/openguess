# Scaling

## V1 traffic

Gameplay is client-side. A static host or CDN can serve the same immutable build to many users without a central process tracking their games. Horizontal delivery capacity, cache hit rates and transfer costs are properties of the chosen host. There is no per-question AI bill, but hosting and bandwidth are not guaranteed to stay free at unlimited traffic.

Cache hashed build assets for long periods and allow the HTML entry point to refresh for new releases. Keep catalog and engine versions together so a cached pack is not interpreted using an incompatible schema.

## Catalog size

With C candidates and Q available questions, straightforward information-gain selection scans candidate evidence for each question: approximately **O(C × Q)** per selection. Distribution updates are roughly O(C); storing a dense trait table costs O(C × Q). More traffic does not reduce the browser's per-player work.

Before claiming support for a larger catalog, benchmark selection time, memory and transfer size on lower-end mobile devices as well as desktop browsers. Track median and tail latency for realistic answer histories; define a browser budget and publish results. V1 has no measured worldwide-scale catalog guarantee.

Possible later work includes versioned domain packs, lazy loading, sparse representations and a Web Worker to keep inference off the UI thread. These need compatibility tests and performance measurements, not just a larger JSON file.

## Optional shared learning

A future shared service changes the architecture. It needs moderated submissions, provenance, schema validation, authorization where appropriate, rate limits, duplicate handling and privacy controls. Publishing reviewed pack releases can remain independent of gameplay. Keep local-only play available and evaluate real service costs before introducing central dependencies.
