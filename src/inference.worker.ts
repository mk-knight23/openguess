import {
  rankCandidates,
  selectQuestion,
  getRoundReadiness,
  type RoundReadiness,
} from "./engine";
import { validateQuestionMetadata } from "./questionMetadata";
import type { AnswerRecord, DataPack } from "./types";
export type WorkerRequest =
  | { type: "hydrate"; pack: DataPack }
  | {
      type: "compute";
      requestId: number;
      history: AnswerRecord[];
      rejected: string[];
      roundSeed?: number;
    };
export interface WorkerResult {
  requestId: number;
  candidates: { id: string; probability: number }[];
  questionId: string | null;
  informationGain: number;
  readiness?: RoundReadiness;
  error?: string;
}
let pack: DataPack | null = null;
let metadataErrors: string[] = [];
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "hydrate") {
    pack = request.pack;
    metadataErrors = validateQuestionMetadata(
      pack.questions,
      pack.theme,
      pack.characters,
    );
    return;
  }
  try {
    if (metadataErrors.length) throw new Error("Invalid question metadata");
    if (!pack) throw new Error("The catalog is not ready.");
    const candidates = rankCandidates(
      pack.characters,
      request.history,
      request.rejected,
      pack.questions,
    );
    const next = selectQuestion(
      candidates,
      pack.questions,
      request.history,
      request.roundSeed,
    );
    self.postMessage({
      requestId: request.requestId,
      readiness: getRoundReadiness(candidates, request.history, pack.questions),
      candidates: candidates.map((c) => ({
        id: c.character.id,
        probability: c.probability,
      })),
      questionId: next?.question.id ?? null,
      informationGain: next?.informationGain ?? 0,
    } satisfies WorkerResult);
  } catch {
    self.postMessage({
      requestId: request.requestId,
      candidates: [],
      questionId: null,
      informationGain: 0,
      error:
        "We could not calculate the next question. Please restart the game.",
    } satisfies WorkerResult);
  }
};
