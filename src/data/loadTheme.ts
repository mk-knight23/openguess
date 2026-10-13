import type { DataPack, Theme } from "../types";
export type { DataPack, Theme } from "../types";
const loaders = {
  people: () => import("./packs/people.json"),
  fictional: () => import("./packs/fictional.json"),
  animals: () => import("./packs/animals.json"),
  objects: () => import("./packs/objects.json"),
  movies: () => import("./packs/movies.json"),
};
export async function loadTheme(theme: Theme): Promise<DataPack> {
  const loader = loaders[theme];
  if (!loader) throw new Error("Unknown theme");
  return (await loader()).default as DataPack;
}
