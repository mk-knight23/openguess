import { describe, it, expect } from "vitest";
import {
  createProgress,
  recordWin,
  recordGame,
  dailyTargets,
  parseProgress,
  exportProgress,
  getAchievements,
  updateProgress,
  readProgress,
  saveProgress,
} from "./progress";
describe("private local progress", () => {
  it("tracks points, unique collection, recent games and calendar streaks", () => {
    let p = createProgress();
    p = recordWin(
      p,
      { id: "a", name: "Alice", theme: "people", questionCount: 8 },
      new Date("2026-10-14T10:00:00Z"),
    );
    p = recordWin(
      p,
      { id: "a", name: "Alice", theme: "people", questionCount: 12 },
      new Date("2026-10-14T11:00:00Z"),
    );
    p = recordWin(
      p,
      { id: "b", name: "Bird", theme: "animals", questionCount: 10 },
      new Date("2026-10-15T10:00:00Z"),
    );
    expect(p.wins).toBe(3);
    expect(p.collection).toHaveLength(2);
    expect(p.recent).toHaveLength(3);
    expect(p.streak).toBe(2);
    expect(p.points).toBeGreaterThan(0);
    expect(p.daily["2026-10-14:people"]).toEqual(["a"]);
    expect(
      getAchievements(p).find((x) => x.id === "quick-thinker")?.unlocked,
    ).toBe(true);
    expect(createProgress().wins).toBe(0);
  });
  it("records failed rounds without rewards", () => {
    const p = recordGame(createProgress(), {
      entityId: "a",
      name: "Alice",
      theme: "people",
      questions: 25,
      won: false,
      playedAt: "2026-10-14T10:00:00.000Z",
    });
    expect(p.wins).toBe(0);
    expect(p.recent).toHaveLength(1);
  });
  it("daily targets are stable across source ordering, unique and bounded", () => {
    expect(dailyTargets("2026-10-14", ["c", "a", "b", "a"], 5)).toEqual(
      dailyTargets("2026-10-14", ["b", "c", "a"], 5),
    );
    expect(new Set(dailyTargets("today", ["a", "b", "c"], 2)).size).toBe(2);
    expect(dailyTargets("today", [], 5)).toEqual([]);
  });
  it("roundtrips a validated export and rejects hostile or malformed imports", () => {
    expect(parseProgress(exportProgress(createProgress()))).toEqual(
      createProgress(),
    );
    for (const text of [
      "{}",
      '{"__proto__":{"polluted":true}}',
      exportProgress({ ...createProgress(), wins: -1 }),
      exportProgress({
        ...createProgress(),
        profile: { nickname: "https://evil.test" },
      }),
      "x".repeat(1_000_001),
    ])
      expect(() => parseProgress(text)).toThrow();
  });
  it("rejects invalid collection and timestamps even inside valid envelope", () => {
    const p = createProgress();
    p.collection = [
      {
        entityId: "https://bad.test",
        name: "Bad",
        theme: "people",
        collectedAt: "today",
        bestQuestions: 1,
      },
    ];
    expect(() => parseProgress(JSON.stringify(p))).toThrow();
  });
  it("updates plain profile and preferences without mutating input", () => {
    const p = createProgress();
    const next = updateProgress(p, {
      nickname: "  Player  ",
      familyMode: true,
      language: "hi",
    });
    expect(next.profile.nickname).toBe("Player");
    expect(next.settings.familyMode).toBe(true);
    expect(p.profile.nickname).toBe("Guest");
    expect(() => updateProgress(p, { nickname: "x".repeat(41) })).toThrow();
  });
  it("handles unavailable and corrupted storage", () => {
    const storage = {
      getItem: () => "{broken",
      setItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(readProgress(storage)).toEqual(createProgress());
    expect(saveProgress(createProgress(), storage)).toBe(false);
  });
});
