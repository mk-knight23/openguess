import { useLayoutEffect, useRef, useState } from "react";

interface RoundPresentationInput<T> {
  identityKey: string;
  resultKey: string | null;
  snapshot: T | null;
  busy: boolean;
  error?: string | null;
}

/** Gates publication, never computation. The ref locks before React commits. */
export function useRoundPresentation<T>(input: RoundPresentationInput<T>) {
  const [, refresh] = useState(0);
  const current = useRef(input);
  const mounted = useRef(true);
  const epoch = useRef(0);
  const handlerEpoch = epoch.current;
  const pending = useRef<{
    from: string;
    target: string;
    snapshot: T | null;
    deadline: boolean;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  current.current = input;
  function clear() {
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
  }
  const operation = pending.current;
  const valid =
    operation &&
    !input.error &&
    (input.identityKey === operation.from ||
      input.identityKey === operation.target);
  const complete =
    valid &&
    operation.deadline &&
    !input.busy &&
    input.identityKey === operation.target &&
    input.resultKey === operation.target;
  const thinking = Boolean(valid && !complete);
  const snapshot = thinking ? operation!.snapshot : input.snapshot;
  useLayoutEffect(() => {
    if (operation && (!valid || complete)) clear();
  });
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clear();
    };
  }, []);
  return {
    snapshot,
    thinking,
    accept(nextIdentityKey: string) {
      if (
        !mounted.current ||
        epoch.current !== handlerEpoch ||
        current.current.identityKey !== input.identityKey ||
        pending.current ||
        current.current.busy ||
        current.current.error ||
        current.current.snapshot === null
      )
        return false;
      const nextOperation = {
        from: input.identityKey,
        target: nextIdentityKey,
        snapshot,
        deadline: false,
        timer: setTimeout(() => {
          if (!mounted.current || pending.current !== nextOperation) return;
          nextOperation.deadline = true;
          refresh((n) => n + 1);
        }, 2200),
      };
      pending.current = nextOperation;
      refresh((n) => n + 1);
      return true;
    },
    cancel() {
      epoch.current++;
      clear();
      if (mounted.current) refresh((n) => n + 1);
    },
  };
}
