import { describe, expect, it } from "vitest";
import { deriveRoundMood } from "./roundPresentation";

describe("round presentation", () => {
  it("follows discovery depth and confirmation without timers", () => {
    expect(deriveRoundMood({ status: "playing" })).toBe("curious");
    expect(deriveRoundMood({ status: "playing", answeredCount: 5 })).toBe(
      "narrowing",
    );
    expect(deriveRoundMood({ status: "playing", confirming: true })).toBe(
      "confirming",
    );
  });
  it("shows recovery and real processing before discovery", () => {
    expect(
      deriveRoundMood({
        status: "playing",
        rejectedGuess: true,
        confirming: true,
      }),
    ).toBe("recovering");
    expect(
      deriveRoundMood({ status: "playing", busy: true, rejectedGuess: true }),
    ).toBe("thinking");
  });
  it("restores terminal and idle states regardless of previous discovery", () => {
    expect(deriveRoundMood({ status: "won", busy: true })).toBe("celebrate");
    expect(deriveRoundMood({ status: "lost", confirming: true })).toBe(
      "stumped",
    );
    expect(deriveRoundMood({ status: "guess" })).toBe("confident");
    expect(deriveRoundMood({ status: "home", answeredCount: 8 })).toBe("idle");
    expect(deriveRoundMood({ status: "playing", answeredCount: 4 })).toBe(
      "curious",
    );
  });
});
