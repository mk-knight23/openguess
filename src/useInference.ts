import { useEffect, useRef, useState } from "react";
import {
  rankCandidates,
  selectQuestion,
  getRoundReadiness,
  type RoundReadiness,
} from "./engine";
import type { AnswerRecord, Candidate, DataPack, Question } from "./types";
import type { WorkerResult } from "./inference.worker";
import { validateQuestionMetadata } from "./questionMetadata";
interface Inference {
  candidates: Candidate[];
  next: { question: Question; informationGain: number } | null;
  readiness: RoundReadiness | null;
  busy: boolean;
  error: string | null;
}
const empty: Inference = {
  candidates: [],
  next: null,
  readiness: null,
  busy: false,
  error: null,
};
export function useInference(
  pack: DataPack | null,
  history: AnswerRecord[],
  rejected: string[],
  roundSeed = 0,
): Inference {
  const [stored, setStored] = useState<{
    pack: DataPack | null;
    key: string;
    value: Inference;
  }>({ pack: null, key: "", value: empty });
  const pendingInput = useRef<{ pack: DataPack | null; key: string }>({
    pack: null,
    key: "",
  });
  const worker = useRef<Worker | null>(null);
  const sequence = useRef(0);
  const currentPack = useRef<DataPack | null>(null);
  const historyKey = JSON.stringify(history);
  const rejectedKey = JSON.stringify(rejected);
  const inputKey = `${historyKey}:${rejectedKey}:${roundSeed}`;
  function setState(value: Inference, input = { pack, key: inputKey }) {
    setStored({ ...input, value });
  }
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
      setState(
        {
          candidates,
          next: question
            ? { question, informationGain: result.informationGain }
            : null,
          readiness: result.readiness ?? null,
          busy: false,
          error: result.error ?? null,
        },
        pendingInput.current,
      );
    };
    instance.onerror = () => {
      if (instance !== worker.current || currentPack.current !== pack) return;
      sequence.current++;
      setState(
        {
          ...empty,
          error:
            "The game could not calculate its next question. Please restart or reload the page.",
        },
        pendingInput.current,
      );
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
    pendingInput.current = { pack, key: inputKey };
    setState({ ...empty, busy: true });
    const evidence = JSON.parse(historyKey) as AnswerRecord[];
    const rejectedIds = JSON.parse(rejectedKey) as string[];
    if (worker.current)
      worker.current.postMessage({
        type: "compute",
        requestId,
        history: evidence,
        rejected: rejectedIds,
        roundSeed,
      });
    else if (typeof Worker === "undefined") {
      try {
        if (
          validateQuestionMetadata(pack.questions, pack.theme, pack.characters)
            .length
        )
          throw new Error("Invalid question metadata");
        const candidates = rankCandidates(
          pack.characters,
          evidence,
          rejectedIds,
          pack.questions,
        );
        setState({
          candidates,
          next: selectQuestion(candidates, pack.questions, evidence, roundSeed),
          readiness: getRoundReadiness(candidates, evidence, pack.questions),
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
  }, [pack, historyKey, rejectedKey, roundSeed]);
  // Passive effects run after render. Never expose the preceding question during
  // that interval: keyboard or rapid clicks must see the current inputs as busy.
  if (stored.pack !== pack || stored.key !== inputKey)
    return pack ? { ...empty, busy: true } : empty;
  return stored.value;
}
