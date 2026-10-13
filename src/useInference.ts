import { useEffect, useRef, useState } from "react";
import { rankCandidates, selectQuestion } from "./engine";
import type { AnswerRecord, Candidate, DataPack, Question } from "./types";
import type { WorkerResult } from "./inference.worker";
interface Inference {
  candidates: Candidate[];
  next: { question: Question; informationGain: number } | null;
  busy: boolean;
  error: string | null;
}
const empty: Inference = {
  candidates: [],
  next: null,
  busy: false,
  error: null,
};
export function useInference(
  pack: DataPack | null,
  history: AnswerRecord[],
  rejected: string[],
): Inference {
  const [state, setState] = useState<Inference>(empty);
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const currentPack = useRef<DataPack | null>(null);
  const historyKey = JSON.stringify(history);
  const rejectedKey = JSON.stringify(rejected);
  useEffect(() => {
    currentPack.current = pack;
    sequence.current++;
    setState(pack ? { ...empty, busy: true } : empty);
    if (!pack || typeof Worker === "undefined") return;
    let instance: Worker;
    try {
      instance = new Worker(new URL("./inference.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      setState({
        ...empty,
        error:
          "The game could not start its calculation worker. Please reload the page.",
      });
      return;
    }
    worker.current = instance;
    const characters = new Map(pack.characters.map((c) => [c.id, c]));
    const questions = new Map(pack.questions.map((q) => [q.id, q]));
    instance.onmessage = (event: MessageEvent<WorkerResult>) => {
      const result = event.data;
      if (
        instance !== worker.current ||
        currentPack.current !== pack ||
        result.requestId !== sequence.current
      )
        return;
      const candidates: Candidate[] = [];
      for (const row of result.candidates) {
        const character = characters.get(row.id);
        if (character)
          candidates.push({ character, probability: row.probability });
      }
      const question = result.questionId
        ? questions.get(result.questionId)
        : null;
      setState({
        candidates,
        next: question
          ? { question, informationGain: result.informationGain }
          : null,
        busy: false,
        error: result.error ?? null,
      });
    };
    instance.onerror = () => {
      if (instance !== worker.current || currentPack.current !== pack) return;
      sequence.current++;
      setState({
        ...empty,
        error:
          "The game could not calculate its next question. Please restart or reload the page.",
      });
    };
    instance.postMessage({ type: "hydrate", pack });
    return () => {
      sequence.current++;
      instance.terminate();
      if (worker.current === instance) worker.current = null;
    };
  }, [pack]);
  useEffect(() => {
    if (!pack) return;
    const requestId = ++sequence.current;
    setState({ ...empty, busy: true });
    const evidence = JSON.parse(historyKey) as AnswerRecord[];
    const rejectedIds = JSON.parse(rejectedKey) as string[];
    if (worker.current)
      worker.current.postMessage({
        type: "compute",
        requestId,
        history: evidence,
        rejected: rejectedIds,
      });
    else if (typeof Worker === "undefined") {
      try {
        const candidates = rankCandidates(
          pack.characters,
          evidence,
          rejectedIds,
        );
        setState({
          candidates,
          next: selectQuestion(candidates, pack.questions, evidence),
          busy: false,
          error: null,
        });
      } catch {
        setState({
          ...empty,
          error:
            "We could not calculate the next question. Please restart the game.",
        });
      }
    } else
      setState({
        ...empty,
        error:
          "The game could not start its calculation worker. Please reload the page.",
      });
  }, [pack, historyKey, rejectedKey]);
  return state;
}
