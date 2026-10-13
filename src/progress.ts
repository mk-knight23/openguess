export interface GameRecord {
  entityId: string;
  name: string;
  theme: string;
  questions: number;
  won: boolean;
  playedAt: string;
}
export interface CollectedEntry {
  entityId: string;
  name: string;
  theme: string;
  collectedAt: string;
  bestQuestions: number;
}
export interface Progress {
  schema: "openguess.progress/v2";
  profile: { nickname: string };
  settings: {
    language: string;
    sound: boolean;
    reducedMotion: boolean;
    familyMode: boolean;
  };
  wins: number;
  points: number;
  streak: number;
  lastWinDate: string | null;
  collection: CollectedEntry[];
  recent: GameRecord[];
  daily: Record<string, string[]>;
}
const KEY = "openguess.progress.v2";
export function createProgress(): Progress {
  return {
    schema: "openguess.progress/v2",
    profile: { nickname: "Guest" },
    settings: {
      language: "en",
      sound: false,
      reducedMotion: false,
      familyMode: true,
    },
    wins: 0,
    points: 0,
    streak: 0,
    lastWinDate: null,
    collection: [],
    recent: [],
    daily: {},
  };
}
function plain(value: unknown): value is Record<string, unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
function text(value: unknown, max = 160): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= max &&
    !/[\u0000-\u001f]|https?:\/\/|javascript:|data:/i.test(value)
  );
}
function integer(value: unknown, max = 1_000_000_000): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= max
  );
}
function dateKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
function timestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
function id(value: unknown): value is string {
  return (
    text(value, 160) &&
    /^[\w.:-]+$/.test(value) &&
    !["__proto__", "constructor", "prototype"].includes(value)
  );
}
function fail(): never {
  throw new Error("Invalid OpenGuess progress file.");
}
export function parseProgress(input: string): Progress {
  if (input.length > 1_000_000) fail();
  const p: unknown = JSON.parse(input, (key, value) => {
    if (["__proto__", "constructor", "prototype"].includes(key)) fail();
    return value;
  });
  if (
    !plain(p) ||
    p.schema !== "openguess.progress/v2" ||
    !plain(p.profile) ||
    !text(p.profile.nickname, 40) ||
    !plain(p.settings) ||
    !id(p.settings.language) ||
    !["sound", "reducedMotion", "familyMode"].every(
      (k) => typeof (p.settings as Record<string, unknown>)[k] === "boolean",
    ) ||
    !["wins", "points", "streak"].every((k) => integer(p[k])) ||
    (p.lastWinDate !== null && !dateKey(p.lastWinDate))
  )
    fail();
  if (
    !Array.isArray(p.collection) ||
    p.collection.length > 20_000 ||
    !p.collection.every(
      (c) =>
        plain(c) &&
        id(c.entityId) &&
        text(c.name) &&
        id(c.theme) &&
        timestamp(c.collectedAt) &&
        integer(c.bestQuestions, 200),
    ) ||
    !Array.isArray(p.recent) ||
    p.recent.length > 100 ||
    !p.recent.every(
      (c) =>
        plain(c) &&
        id(c.entityId) &&
        text(c.name) &&
        id(c.theme) &&
        timestamp(c.playedAt) &&
        integer(c.questions, 200) &&
        typeof c.won === "boolean",
    ) ||
    !plain(p.daily) ||
    Object.keys(p.daily).length > 400 ||
    !Object.entries(p.daily).every(
      ([k, v]) =>
        /^\d{4}-\d{2}-\d{2}:[\w-]+$/.test(k) &&
        dateKey(k.slice(0, 10)) &&
        Array.isArray(v) &&
        v.length <= 20_000 &&
        v.every(id),
    )
  )
    fail();
  // Rebuild only known fields so unexpected imported properties never reach application state.
  return {
    schema: "openguess.progress/v2",
    profile: { nickname: p.profile.nickname },
    settings: {
      language: p.settings.language as string,
      sound: p.settings.sound as boolean,
      reducedMotion: p.settings.reducedMotion as boolean,
      familyMode: p.settings.familyMode as boolean,
    },
    wins: p.wins as number,
    points: p.points as number,
    streak: p.streak as number,
    lastWinDate: p.lastWinDate as string | null,
    collection: p.collection.map((c) => ({
      entityId: c.entityId,
      name: c.name,
      theme: c.theme,
      collectedAt: c.collectedAt,
      bestQuestions: c.bestQuestions,
    })),
    recent: p.recent.map((c) => ({
      entityId: c.entityId,
      name: c.name,
      theme: c.theme,
      questions: c.questions,
      won: c.won,
      playedAt: c.playedAt,
    })),
    daily: Object.fromEntries(
      Object.entries(p.daily).map(([k, v]) => [k, [...(v as string[])]]),
    ),
  };
}
export function exportProgress(p: Progress): string {
  return JSON.stringify(p, null, 2);
}
export function readProgress(storage?: Storage): Progress {
  try {
    const s = storage ?? globalThis.localStorage;
    const value = s?.getItem(KEY);
    return value ? parseProgress(value) : createProgress();
  } catch {
    return createProgress();
  }
}
export function saveProgress(p: Progress, storage?: Storage): boolean {
  try {
    const s = storage ?? globalThis.localStorage;
    if (!s) return false;
    s.setItem(KEY, exportProgress(parseProgress(exportProgress(p))));
    return true;
  } catch {
    return false;
  }
}
export function updateProgress(
  p: Progress,
  patch: {
    nickname?: string;
    language?: string;
    sound?: boolean;
    reducedMotion?: boolean;
    familyMode?: boolean;
  },
): Progress {
  return parseProgress(
    exportProgress({
      ...p,
      profile: { nickname: patch.nickname?.trim() ?? p.profile.nickname },
      settings: {
        ...p.settings,
        ...Object.fromEntries(
          Object.entries(patch).filter(([k]) => k !== "nickname"),
        ),
      },
    }),
  );
}
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function recordGame(p: Progress, game: GameRecord): Progress {
  let next: Progress = { ...p, recent: [game, ...p.recent].slice(0, 100) };
  if (game.won) {
    const day = localDateKey(new Date(game.playedAt));
    const previous = p.lastWinDate;
    const difference = previous
      ? (Date.parse(day + "T12:00:00Z") - Date.parse(previous + "T12:00:00Z")) /
        86400000
      : null;
    const existing = p.collection.find(
      (c) => c.entityId === game.entityId && c.theme === game.theme,
    );
    const collection = existing
      ? p.collection.map((c) =>
          c === existing
            ? { ...c, bestQuestions: Math.min(c.bestQuestions, game.questions) }
            : c,
        )
      : [
          ...p.collection,
          {
            entityId: game.entityId,
            name: game.name,
            theme: game.theme,
            collectedAt: game.playedAt,
            bestQuestions: game.questions,
          },
        ];
    const daily = {
      ...p.daily,
      [`${day}:${game.theme}`]: [
        ...new Set([...(p.daily[`${day}:${game.theme}`] ?? []), game.entityId]),
      ],
    };
    const keys = Object.keys(daily).sort();
    for (const key of keys.slice(0, Math.max(0, keys.length - 400)))
      delete daily[key];
    next = {
      ...next,
      wins: p.wins + 1,
      points: p.points + 100 + Math.max(0, 20 - game.questions) * 5,
      streak: difference === 0 ? p.streak : difference === 1 ? p.streak + 1 : 1,
      lastWinDate: day,
      collection,
      daily,
    };
  }
  return parseProgress(exportProgress(next));
}
export function recordWin(
  p: Progress,
  entity: { id: string; name: string; theme: string; questionCount: number },
  date = new Date(),
): Progress {
  return recordGame(p, {
    entityId: entity.id,
    name: entity.name,
    theme: entity.theme,
    questions: entity.questionCount,
    won: true,
    playedAt: date.toISOString(),
  });
}
export function dailyTargets(
  date: string,
  entityIds: string[],
  count = 5,
): string[] {
  let seed = 2166136261;
  for (const c of date)
    seed = Math.imul(seed ^ c.charCodeAt(0), 16777619) >>> 0;
  const pool = [...new Set(entityIds)].sort();
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(pool.length, Math.floor(count))));
}
export function getAchievements(
  p: Progress,
): { id: string; title: string; description: string; unlocked: boolean }[] {
  return [
    {
      id: "first-spark",
      title: "First spark",
      description: "Confirm your first correct guess.",
      unlocked: p.wins >= 1,
    },
    {
      id: "five-stars",
      title: "Five stars",
      description: "Confirm five correct guesses.",
      unlocked: p.wins >= 5,
    },
    {
      id: "world-explorer",
      title: "World explorer",
      description: "Collect entries in all five themes.",
      unlocked: ["people", "fictional", "animals", "objects", "movies"].every(
        (t) => p.collection.some((c) => c.theme === t),
      ),
    },
    {
      id: "quick-thinker",
      title: "Quick thinker",
      description: "Confirm a guess in ten questions or fewer.",
      unlocked: p.collection.some((c) => c.bestQuestions <= 10),
    },
    {
      id: "three-day-trail",
      title: "Three day trail",
      description: "Win on three consecutive calendar days.",
      unlocked: p.streak >= 3,
    },
  ];
}
