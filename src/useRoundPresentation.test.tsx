import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRoundPresentation } from "./useRoundPresentation";

interface Snapshot {
  question: string | null;
  guess: string | null;
  exhausted: boolean;
  mood: string;
}
const first: Snapshot = {
  question: "First clue",
  guess: null,
  exhausted: false,
  mood: "curious",
};
const second: Snapshot = {
  ...first,
  question: "Second clue",
  mood: "narrowing",
};
function input(identityKey = "round:0", snapshot: Snapshot | null = first) {
  return {
    identityKey,
    resultKey: snapshot ? identityKey : null,
    snapshot,
    busy: !snapshot,
    error: null as string | null,
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("round presentation reveal gate", () => {
  it("keeps the complete preceding snapshot until 2200ms after acceptance", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => expect(result.current.accept("round:1")).toBe(true));
    rerender(input("round:1", second));
    expect(result.current.thinking).toBe(true);
    expect(result.current.snapshot).toEqual(first);
    act(() => vi.advanceTimersByTime(1999));
    expect(result.current.snapshot).toEqual(first);
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.snapshot).toEqual(first);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.snapshot).toEqual(second);
    expect(result.current.thinking).toBe(false);
  });

  it("waits for current inference when the deadline completes first", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    rerender(input("round:1", null));
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.thinking).toBe(true);
    expect(result.current.snapshot).toEqual(first);
    rerender(input("round:1", second));
    expect(result.current.snapshot).toEqual(second);
    expect(result.current.thinking).toBe(false);
  });

  it("rejects two inputs in the same event tick before React commits", () => {
    const { result } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    const accepted: boolean[] = [];
    act(() => {
      accepted.push(result.current.accept("round:1"));
      accepted.push(result.current.accept("round:1"));
    });
    expect(accepted).toEqual([true, false]);
  });

  it("starts a new deadline for the second accepted answer", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    rerender(input("round:1", second));
    act(() => vi.advanceTimersByTime(2200));
    act(() => vi.advanceTimersByTime(700));
    act(() => expect(result.current.accept("round:2")).toBe(true));
    const terminal = {
      question: null,
      guess: "Ada",
      exhausted: false,
      mood: "confident",
    };
    rerender(input("round:2", terminal));
    act(() => vi.advanceTimersByTime(2199));
    expect(result.current.snapshot).toEqual(second);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.snapshot).toEqual(terminal);
  });

  it.each([
    "undo",
    "correction",
    "give-up",
    "navigation",
    "restart",
    "theme",
    "active-pack",
    "settings",
    "rejection",
  ])(
    "invalidates pending publication when %s changes the identity",
    (action) => {
      const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
        initialProps: input(),
      });
      act(() => result.current.accept("round:1"));
      rerender(input("round:1", second));
      act(() => vi.advanceTimersByTime(1000));
      const replacement = { ...first, question: action };
      rerender(input(`changed:${action}`, replacement));
      expect(result.current.thinking).toBe(false);
      expect(result.current.snapshot).toEqual(replacement);
      act(() => vi.advanceTimersByTime(3000));
      expect(result.current.snapshot).toEqual(replacement);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("cancels synchronously before an action has committed its new identity", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    rerender(input("round:1", second));
    act(() => {
      result.current.cancel();
      vi.advanceTimersByTime(2200);
    });
    rerender(input("home", null));
    expect(result.current.thinking).toBe(false);
    expect(result.current.snapshot).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not publish stale results even after the deadline", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    rerender({ ...input("round:1", second), resultKey: "round:0" });
    act(() => vi.advanceTimersByTime(2200));
    expect(result.current.thinking).toBe(true);
    expect(result.current.snapshot).toEqual(first);
    rerender(input("round:1", second));
    expect(result.current.snapshot).toEqual(second);
  });

  it("rejects an old event handler and inputs while inference is busy", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    const staleAccept = result.current.accept;
    rerender(input("new-round", second));
    act(() => expect(staleAccept("round:1")).toBe(false));
    rerender(input("new-round", null));
    act(() => expect(result.current.accept("new-round:1")).toBe(false));
    expect(result.current.snapshot).toBeNull();
  });

  it("does not leak exhaustion or terminal mood before the reveal", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    const exhausted = {
      question: null,
      guess: null,
      exhausted: true,
      mood: "stumped",
    };
    rerender(input("round:1", exhausted));
    expect(result.current.snapshot).toEqual(first);
    act(() => vi.advanceTimersByTime(2200));
    expect(result.current.snapshot).toEqual(exhausted);
  });

  it("cancels the lock immediately on an error", () => {
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    rerender({
      ...input("round:1", null),
      busy: false,
      error: "Calculation failed",
    });
    expect(result.current.thinking).toBe(false);
    expect(result.current.snapshot).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    act(() => expect(result.current.accept("round:2")).toBe(false));
    rerender(input("round:1", second));
    act(() => expect(result.current.accept("round:2")).toBe(true));
  });

  it("invalidates a retained answer handler synchronously on cancel", () => {
    const { result } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    const answer = result.current.accept;
    act(() => {
      result.current.cancel();
      expect(answer("round:1")).toBe(false);
    });
  });

  it("cleans up timers and rejects retained callbacks after unmount", () => {
    const { result, unmount } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    const accept = result.current.accept;
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(accept("round:2")).toBe(false);
  });

  it("retains the deadline when the user prefers reduced motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("reduced-motion"),
    }));
    const { result, rerender } = renderHook(useRoundPresentation<Snapshot>, {
      initialProps: input(),
    });
    act(() => result.current.accept("round:1"));
    rerender(input("round:1", second));
    act(() => vi.advanceTimersByTime(2199));
    expect(result.current.snapshot).toEqual(first);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.snapshot).toEqual(second);
    vi.unstubAllGlobals();
  });
});
