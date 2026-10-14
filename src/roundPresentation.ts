import type { GenieMood } from "./components/Genie";
export interface RoundPresentation {
  status: "home" | "playing" | "guess" | "won" | "lost";
  busy?: boolean;
  confirming?: boolean;
  rejectedGuess?: boolean;
  answeredCount?: number;
  narrowing?: boolean;
}
export function deriveRoundMood(state: RoundPresentation): GenieMood {
  if (state.status === "home") return "idle";
  if (state.status === "won") return "celebrate";
  if (state.status === "lost") return "stumped";
  if (state.status === "guess") return "confident";
  if (state.busy) return "thinking";
  if (state.rejectedGuess) return "recovering";
  if (state.confirming) return "confirming";
  return (state.narrowing ?? (state.answeredCount ?? 0) >= 5)
    ? "narrowing"
    : "curious";
}
