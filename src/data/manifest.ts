import type { Theme } from "../types";
export const themeManifest: {
  id: Theme;
  label: string;
  description: string;
  count: number;
}[] = [
  {
    id: "people",
    label: "People",
    description:
      "Real people from Wikidata, with occupations and biographical claims.",
    count: 1123,
  },
  {
    id: "fictional",
    label: "Characters",
    description:
      "Fictional characters, their universes, appearances and creators.",
    count: 1114,
  },
  {
    id: "animals",
    label: "Animals",
    description: "Mammal taxa, their classification and scientific authorship.",
    count: 1120,
  },
  {
    id: "objects",
    label: "Objects",
    description:
      "Vehicle, tool and musical-instrument types, materials and purposes.",
    count: 1120,
  },
  {
    id: "movies",
    label: "Films",
    description: "Films with directors, genres, countries and release years.",
    count: 1107,
  },
];
