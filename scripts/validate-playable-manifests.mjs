import { readFile } from "node:fs/promises";
import { assertQualifiedManifest } from "./qualification-manifest.mjs";

for (const theme of ["people", "fictional", "animals", "objects", "movies"]) {
  const path = new URL(`../src/data/packs/${theme}.json`, import.meta.url);
  assertQualifiedManifest(JSON.parse(await readFile(path, "utf8")));
}
console.log(
  "Playable qualification manifests verified (legacy profiles exempt).",
);
