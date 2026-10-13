import { rankCandidates, selectQuestion } from "./engine";
import type { AnswerRecord, DataPack } from "./types";
export type WorkerRequest =
  | { type: "hydrate"; pack: DataPack }
  | {
      type: "compute";
      requestId: number;
      history: AnswerRecord[];
      rejected: string[];
    };
export interface WorkerResult {
  requestId: number;
  candidates: { id: string; probability: number }[];
  questionId: string | null;
  informationGain: number;
  error?: string;
}
let pack: DataPack | null = null;
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "hydrate") {
    pack = request.pack;
    return;
  }
  try {
    if (!pack) throw new Error("The catalog is not ready.");
    const candidates = rankCandidates(
      pack.characters,
      request.history,
      request.rejected,
    );
    const next = selectQuestion(candidates, pack.questions, request.history);
    self.postMessage({
      requestId: request.requestId,
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
