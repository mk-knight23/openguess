export type Answer = "yes" | "probably" | "unknown" | "probably-not" | "no";
export type TraitValue = boolean | null;
export interface Character {
  id: string;
  name: string;
  description: string;
  category: "fictional" | "real" | "animal" | "object" | "movie";
  tags: string[];
  color: string;
  initials: string;
  traits: Record<string, TraitValue>;
  source?: { url: string; license: string; retrievedAt: string };
  facts?: Record<string, string[]>;
  factSources?: Record<string, { url: string; scope: string }>;
  featured?: boolean;
  annotationLicense?: string;
  annotationSources?: string[];
}
export interface Question {
  id: string;
  text: string;
  hint: string;
  kind?: "semantic" | "spelling";
  family?: string;
  tier?: "broad" | "signature";
  answerability?: "familiar" | "specialist";
  relatedGroup?: string;
  equivalenceGroup?: string;
  prerequisites?: { questionId: string; value: boolean }[];
  themes?: Theme[];
  property?: string;
  value?: string;
}
export interface AnswerRecord {
  questionId: string;
  answer: Answer;
}
export interface Candidate {
  character: Character;
  probability: number;
}
export type Theme = "people" | "fictional" | "animals" | "objects" | "movies";
export interface DataPack {
  theme: Theme;
  version: string;
  characters: Character[];
  questions: Question[];
  source: {
    url: string;
    license: string;
    retrievedAt: string;
    [key: string]: unknown;
  };
  quality: Record<string, unknown>;
}
