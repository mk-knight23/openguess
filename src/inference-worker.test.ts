import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useInference } from "./useInference";
import type { DataPack } from "./types";
const pack: DataPack = {
  theme: "people",
  version: "test",
  source: {
    url: "https://example.com",
    license: "CC0",
    retrievedAt: "2026-10-14",
  },
  quality: {},
  characters: [
    {
      id: "a",
      name: "A",
      traits: { q: true },
      category: "real",
      description: "",
      tags: [],
      color: "#fff",
      initials: "A",
    },
    {
      id: "b",
      name: "B",
      traits: { q: false },
      category: "real",
      description: "",
      tags: [],
      color: "#fff",
      initials: "B",
    },
  ],
  questions: [{ id: "q", text: "Q", hint: "" }],
};
class FakeWorker {
  static instances: FakeWorker[] = [];
  messages: any[] = [];
  onmessage: ((event: { data: any }) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  terminated = false;
  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(message: any) {
    this.messages.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply(requestId: number) {
    this.onmessage?.({
      data: {
        requestId,
        candidates: [
          { id: "a", probability: 0.8 },
          { id: "b", probability: 0.2 },
        ],
        questionId: "q",
        informationGain: 0.2,
      },
    });
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  FakeWorker.instances = [];
});
it("hydrates once, sends compact evidence, and ignores stale responses", async () => {
  vi.stubGlobal("Worker", FakeWorker);
  const { result, rerender, unmount } = renderHook(
    ({ history }) => useInference(pack, history, []),
    { initialProps: { history: [] as import("./types").AnswerRecord[] } },
  );
  const worker = FakeWorker.instances[0];
  const first = worker.messages.find((m) => m.type === "compute");
  rerender({ history: [{ questionId: "q", answer: "yes" }] });
  const latest = worker.messages.filter((m) => m.type === "compute").at(-1);
  expect(worker.messages.filter((m) => m.type === "hydrate")).toHaveLength(1);
  expect(latest).not.toHaveProperty("pack");
  act(() => worker.reply(first.requestId));
  expect(result.current.busy).toBe(true);
  act(() => worker.reply(latest.requestId));
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(result.current.candidates[0].character).toBe(pack.characters[0]);
  expect(result.current.next?.question).toBe(pack.questions[0]);
  unmount();
  expect(worker.terminated).toBe(true);
});
it("provides a synchronous fallback without Worker", async () => {
  vi.stubGlobal("Worker", undefined);
  const { result } = renderHook(() => useInference(pack, [], []));
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(result.current.candidates).toHaveLength(2);
  expect(result.current.next?.question.id).toBe("q");
});
it("terminates the previous pack worker and ignores its late results", async () => {
  vi.stubGlobal("Worker", FakeWorker);
  const { result, rerender } = renderHook(
    ({ catalog }) => useInference(catalog, [], []),
    { initialProps: { catalog: pack } },
  );
  const previous = FakeWorker.instances[0];
  const oldRequest = previous.messages.find((m) => m.type === "compute");
  const nextPack = { ...pack, theme: "animals" as const };
  rerender({ catalog: nextPack });
  expect(previous.terminated).toBe(true);
  act(() => previous.reply(oldRequest.requestId));
  expect(result.current.busy).toBe(true);
  const current = FakeWorker.instances[1];
  act(() => current.onerror?.({}));
  await waitFor(() => expect(result.current.error).toContain("restart"));
  expect(result.current.busy).toBe(false);
});
it("hides preceding inference during the render before new input effects run", async () => {
  vi.stubGlobal("Worker", FakeWorker);
  const observed: { busy: boolean; next: string | null }[] = [];
  const { rerender } = renderHook(
    ({ history }) => {
      const inference = useInference(pack, history, []);
      observed.push({
        busy: inference.busy,
        next: inference.next?.question.id ?? null,
      });
      return inference;
    },
    { initialProps: { history: [] as import("./types").AnswerRecord[] } },
  );
  const worker = FakeWorker.instances[0];
  act(() =>
    worker.reply(worker.messages.find((m) => m.type === "compute").requestId),
  );
  expect(observed.at(-1)?.busy).toBe(false);
  observed.length = 0;
  rerender({ history: [{ questionId: "q", answer: "yes" }] });
  expect(observed.length).toBeGreaterThan(0);
  expect(observed.every((value) => value.busy && value.next === null)).toBe(
    true,
  );
});
it("sends a changed round seed without rehydrating and hides the previous round", () => {
  vi.stubGlobal("Worker", FakeWorker);
  const { result, rerender } = renderHook(
    ({ seed }) => useInference(pack, [], [], seed),
    { initialProps: { seed: 1 } },
  );
  const worker = FakeWorker.instances[0];
  const first = worker.messages.find((message) => message.type === "compute");
  expect(first.roundSeed).toBe(1);
  act(() => worker.reply(first.requestId));
  expect(result.current.busy).toBe(false);
  rerender({ seed: 2 });
  expect(result.current.busy).toBe(true);
  expect(result.current.next).toBeNull();
  expect(
    worker.messages.filter((message) => message.type === "hydrate"),
  ).toHaveLength(1);
  expect(
    worker.messages.filter((message) => message.type === "compute").at(-1)
      .roundSeed,
  ).toBe(2);
  act(() => worker.reply(first.requestId));
  expect(result.current.busy).toBe(true);
});
it("fallback propagates explicit readiness and discounts related evidence", async () => {
  vi.stubGlobal("Worker", undefined);
  const qualityPack = {
    ...pack,
    questions: [
      { ...pack.questions[0], tier: "broad" as const, relatedGroup: "one" },
      {
        id: "r",
        text: "R",
        hint: "",
        tier: "broad" as const,
        relatedGroup: "one",
      },
    ],
    characters: pack.characters.map((c) => ({
      ...c,
      traits: { ...c.traits, r: c.traits.q },
    })),
  };
  const { result } = renderHook(() =>
    useInference(
      qualityPack,
      [
        { questionId: "q", answer: "yes" },
        { questionId: "r", answer: "yes" },
      ],
      [],
    ),
  );
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(result.current.readiness?.ready).toBe(false);
  expect(result.current.readiness?.independentEvidence).toBe(1);
  expect(result.current.candidates[0].probability).toBeLessThan(0.999);
});
it("worker replays the same readiness and question for identical evidence and seed", async () => {
  const replies: import("./inference.worker").WorkerResult[] = [];
  const scope = {
    onmessage: null as
      | ((event: { data: import("./inference.worker").WorkerRequest }) => void)
      | null,
    postMessage: (result: import("./inference.worker").WorkerResult) =>
      replies.push(result),
  };
  vi.stubGlobal("self", scope);
  vi.resetModules();
  await import("./inference.worker");
  scope.onmessage!({ data: { type: "hydrate", pack } });
  for (const requestId of [1, 2])
    scope.onmessage!({
      data: {
        type: "compute",
        requestId,
        history: [],
        rejected: [],
        roundSeed: 44,
      },
    });
  expect(replies[0].readiness?.phase).toBe("discovery");
  expect({ ...replies[0], requestId: 2 }).toEqual(replies[1]);
});
it("fallback rejects invalid prerequisite metadata just as the worker does", async () => {
  vi.stubGlobal("Worker", undefined);
  const invalid = {
    ...pack,
    questions: [
      {
        ...pack.questions[0],
        prerequisites: [{ questionId: "missing", value: true }],
      },
    ],
  };
  const { result } = renderHook(() => useInference(invalid, [], []));
  await waitFor(() => expect(result.current.busy).toBe(false));
  expect(result.current.error).toContain("restart");
  expect(result.current.candidates).toEqual([]);
});
