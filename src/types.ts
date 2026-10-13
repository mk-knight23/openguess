export type Answer = "yes" | "probably" | "unknown" | "probably-not" | "no";
export type TraitValue = boolean | null;
export interface Character {
  id: string;
  name: string;
  description: string;
  category: "fictional" | "real";
  tags: string[];
  color: string;
  initials: string;
  traits: Record<string, TraitValue>;
}
export interface Question {
  id: string;
  text: string;
  hint: string;
}
export interface AnswerRecord {
  questionId: string;
  answer: Answer;
}
export interface Candidate {
  character: Character;
  probability: number;
}
