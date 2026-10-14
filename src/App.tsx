import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Settings,
  BookOpen,
  Trophy,
  CalendarDays,
  Github,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Search,
  Download,
  Upload,
  Eye,
  Globe2,
  ShieldCheck,
  Star,
  Plus,
  UserRound,
  Film,
  PawPrint,
  Box,
  Users,
  Info,
  Volume2,
} from "lucide-react";
const CloudPanel = lazy(() =>
  import("./CloudPanel").then((module) => ({ default: module.CloudPanel })),
);
import { Genie } from "./components/Genie";
import { Avatar } from "./components/Artwork";
import { themeManifest } from "./data/manifest";
import { loadTheme } from "./data/loadTheme";
import { featuredPack } from "./data/featuredPack";
import { useInference } from "./useInference";
import { deriveRoundMood } from "./roundPresentation";
import {
  readProgress,
  saveProgress,
  recordWin,
  recordGame,
  updateProgress,
  exportProgress,
  parseProgress,
  dailyTargets,
  localDateKey,
  getAchievements,
} from "./progress";
import { languages, translate } from "./i18n";
import type { Progress } from "./progress";
import type { Answer, AnswerRecord, DataPack, Theme } from "./types";

const REPO = "https://github.com/mk-knight23/openguess";
const MAX_QUESTIONS = 40;
const choices: {
  value: Answer;
  key: "yes" | "no" | "dontKnow" | "probably" | "probablyNot";
  number: string;
}[] = [
  { value: "yes", key: "yes", number: "1" },
  { value: "no", key: "no", number: "2" },
  { value: "unknown", key: "dontKnow", number: "3" },
  { value: "probably", key: "probably", number: "4" },
  { value: "probably-not", key: "probablyNot", number: "5" },
];
const icons = {
  people: Users,
  fictional: UserRound,
  animals: PawPrint,
  objects: Box,
  movies: Film,
};
type View =
  | "home"
  | "game"
  | "library"
  | "collection"
  | "daily"
  | "settings"
  | "about"
  | "contribute";
type Phase = "question" | "won" | "stumped";
function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safePack(pack: DataPack, enabled: boolean): DataPack {
  if (!enabled) return pack;
  const adult =
    /\b(pornograph(?:y|ic|er|ers)?|pornstars?|adult films?|sex toys?|sexual fetish(?:es)?|erotic|prostitutes?|prostitution)\b/i;
  return {
    ...pack,
    characters: pack.characters.filter(
      (c) => !adult.test(`${c.name} ${c.description} ${c.tags.join(" ")}`),
    ),
  };
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [theme, setTheme] = useState<Theme>("people");
  const [expandedCatalog, setExpandedCatalog] = useState(false);
  const [pack, setPack] = useState<DataPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [roundSeed, setRoundSeed] = useState(0);
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("question");
  const [pausedAt, setPausedAt] = useState(-1);
  const [recovering, setRecovering] = useState(false);
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [explain, setExplain] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");
  const [nickname, setNickname] = useState(progress.profile.nickname);
  const [proposal, setProposal] = useState({
    kind: "character",
    name: "",
    description: "",
    category: "people",
    photoUrl: "",
    rights: false,
  });
  const focus = useRef<HTMLHeadingElement>(null);
  const generation = useRef(0);
  const lang = progress.settings.language;
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);
  const locale = languages.find((l) => l.code === lang) ?? languages[0];
  const scopedPack = useMemo(
    () =>
      pack?.theme === theme
        ? safePack(pack, progress.settings.familyMode)
        : null,
    [pack, theme, progress.settings.familyMode],
  );
  const featuredCount =
    scopedPack?.characters.filter((c) => c.featured).length ?? 0;
  const activePack = useMemo(
    () =>
      !scopedPack ||
      expandedCatalog ||
      !scopedPack.characters.some((c) => c.featured)
        ? scopedPack
        : featuredPack(scopedPack),
    [scopedPack, expandedCatalog],
  );
  const inference = useInference(activePack, history, rejected, roundSeed);
  const { candidates, next, busy, error, readiness } = inference;
  const displayedQuestion = useRef<{
    pack: DataPack;
    next: NonNullable<typeof next>;
  } | null>(null);
  useEffect(() => {
    if (next && activePack)
      displayedQuestion.current = { pack: activePack, next };
  }, [next, activePack]);
  const visibleNext =
    next ??
    (busy && displayedQuestion.current?.pack === activePack
      ? displayedQuestion.current.next
      : null);
  const informative = history.filter((h) => h.answer !== "unknown").length;
  const readyToGuess = history.length > pausedAt && readiness?.ready === true;
  const exhausted =
    !busy &&
    !loading &&
    activePack &&
    (candidates.length === 0 ||
      ((!next || history.length >= MAX_QUESTIONS) && !readyToGuess));
  const guess =
    !busy &&
    !error &&
    candidates.length > 0 &&
    phase === "question" &&
    readyToGuess;
  const top = candidates[0];
  const meta = themeManifest.find((m) => m.id === theme)!;
  const total = themeManifest.reduce((n, m) => n + m.count, 0);
  const visible = useMemo(
    () =>
      scopedPack?.characters.filter((c) =>
        `${c.name} ${c.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ) ?? [],
    [scopedPack, search],
  );
  const today = localDateKey(new Date());
  const daily = useMemo(
    () =>
      activePack
        ? dailyTargets(
            `${today}:${theme}:${activePack.version}`,
            activePack.characters.map((c) => c.id),
            5,
          )
        : [],
    [today, theme, activePack],
  );
  const solved = new Set(progress.daily[`${today}:${theme}`] ?? []);
  const achievements = getAchievements(progress);
  useEffect(() => {
    const ticket = ++generation.current;
    setLoading(true);
    setPack(null);
    setLoadError("");
    loadTheme(theme)
      .then((p) => {
        if (ticket === generation.current) {
          setPack(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (ticket === generation.current) {
          setLoadError("This universe could not be loaded. Please try again.");
          setLoading(false);
        }
      });
    return () => {
      generation.current++;
    };
  }, [theme, loadAttempt]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = locale.dir;
  }, [lang, locale.dir]);
  useEffect(() => {
    if (view === "game") focus.current?.focus();
  }, [history.length, view, phase, guess, busy]);
  function persist(p: Progress) {
    setProgress(p);
    const saved = saveProgress(p);
    if (!saved)
      setNotice(
        "Your browser could not save progress. Export a backup to keep it.",
      );
    return saved;
  }
  function start() {
    if (!activePack || loading) return;
    setRoundSeed(crypto.getRandomValues(new Uint32Array(1))[0] || 1);
    setHistory([]);
    setRejected([]);
    setRecovering(false);
    setPausedAt(-1);
    setPhase("question");
    setExplain(false);
    setNotice("");
    setView("game");
  }
  function retry() {
    setRecovering(false);
    setHistory([]);
    setRejected([]);
    setPhase("question");
    setPausedAt(-1);
    setLoadAttempt((n) => n + 1);
  }
  function changeTheme(id: Theme) {
    setRecovering(false);
    setTheme(id);
    setHistory([]);
    setRejected([]);
    setPhase("question");
    setPausedAt(-1);
    setSearch("");
    setPage(0);
  }
  function answer(value: Answer) {
    if (busy || guess || exhausted || !next || phase !== "question") return;
    setRecovering(false);
    setHistory((h) => [...h, { questionId: next.question.id, answer: value }]);
  }
  function undo() {
    setRecovering(false);
    setHistory((h) => h.slice(0, -1));
    setPausedAt(history.length - 1);
    setPhase("question");
  }
  function reject() {
    if (!top) return;
    setRecovering(true);
    setRejected((r) => [...r, top.character.id]);
    setPausedAt(history.length);
    setPhase("question");
  }
  function confirm() {
    if (!top || phase === "won") return;
    persist(
      recordWin(progress, {
        id: top.character.id,
        name: top.character.name,
        theme,
        questionCount: history.length,
      }),
    );
    setPhase("won");
    if (progress.settings.sound) playTone();
  }
  function surrender() {
    if (top)
      persist(
        recordGame(progress, {
          entityId: top.character.id,
          name: top.character.name,
          theme,
          questions: history.length,
          won: false,
          playedAt: new Date().toISOString(),
        }),
      );
    setPhase("stumped");
  }
  function setting(patch: Parameters<typeof updateProgress>[1]) {
    try {
      if (persist(updateProgress(progress, patch))) setNotice("");
    } catch {
      setNotice(
        "Please enter a valid nickname with 1–40 plain-text characters.",
      );
    }
  }
  function playTone() {
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
      oscillator.frequency.value = 660;
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      oscillator.onended = () => void context.close();
    } catch {
      /* Sound is optional and must never block gameplay. */
    }
  }
  async function importBackup(file?: File) {
    if (!file) return;
    if (file.size > 10_000_000) {
      setNotice("The backup is too large. Limit: 10 MB.");
      return;
    }
    try {
      const p = parseProgress(await file.text());
      const saved = persist(p);
      setNickname(p.profile.nickname);
      if (saved)
        setNotice(
          "Progress imported. This replaces the progress on this browser.",
        );
    } catch {
      setNotice(
        "That file is not a valid OpenGuess progress backup. Nothing was changed.",
      );
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        view !== "game" ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      const c = choices.find((c) => c.number === e.key);
      if (c) {
        e.preventDefault();
        answer(c.value);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const mood = deriveRoundMood({
    status:
      view !== "game"
        ? "home"
        : phase === "won"
          ? "won"
          : phase === "stumped" || exhausted
            ? "lost"
            : guess
              ? "guess"
              : "playing",
    busy,
    confirming: readiness?.phase === "confirming",
    narrowing: readiness?.phase === "narrowing",
    rejectedGuess: recovering,
    answeredCount: history.length,
  });
  const themePicker = (
    <div className="theme-picker" aria-label="Choose a universe">
      {themeManifest.map((m) => {
        const Icon = icons[m.id];
        return (
          <button
            key={m.id}
            className={theme === m.id ? "selected" : ""}
            aria-pressed={theme === m.id}
            onClick={() => changeTheme(m.id)}
          >
            <Icon size={20} />
            <span>{m.label}</span>
            <small>{m.count.toLocaleString()}</small>
          </button>
        );
      })}
    </div>
  );
  const poolPicker = featuredCount > 0 && (
    <div className="pool-picker">
      <div role="group" aria-label="Gameplay knowledge pool">
        <button
          aria-pressed={!expandedCatalog}
          onClick={() => {
            setExpandedCatalog(false);
            setHistory([]);
            setRejected([]);
            setPhase("question");
            setPausedAt(-1);
          }}
        >
          Featured discoveries
        </button>
        <button
          aria-pressed={expandedCatalog}
          onClick={() => {
            setExpandedCatalog(true);
            setHistory([]);
            setRejected([]);
            setPhase("question");
            setPausedAt(-1);
          }}
        >
          Full catalog (experimental)
        </button>
      </div>
      <p>
        {featuredCount} featured choices with richer facts ·{" "}
        {scopedPack?.characters.length.toLocaleString()} total records.
      </p>
      <p>
        {expandedCatalog
          ? "Experimental: many imported records have incomplete facts and may remain unresolved."
          : "Default play uses well-described subjects and meaningful questions. Browse the full database in the library."}
      </p>
    </div>
  );
  const loadingView = (
    <div className="loading-state" role="status">
      <Sparkles className="loading-spark" size={27} />
      <h2>{loading ? "Opening your universe…" : "Connecting the clues…"}</h2>
      <p>The knowledge stays on your device.</p>
    </div>
  );

  return (
    <div
      className={`v2-shell${progress.settings.reducedMotion ? " motion-off" : ""}`}
      data-testid="app-shell"
      dir={locale.dir}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="sky-shapes" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <header className="v2-header">
        <button
          className="v2-logo"
          onClick={() => setView("home")}
          aria-label="OpenGuess home"
        >
          <Sparkles size={29} />
          <span>
            Open<span>Guess</span>
          </span>
          <sup>2</sup>
        </button>
        <nav aria-label="Main navigation">
          <button onClick={() => setView("home")}>{t("play")}</button>
          <button onClick={() => setView("library")}>
            <BookOpen size={16} />
            <span>Library</span>
          </button>
          <button onClick={() => setView("daily")}>
            <CalendarDays size={16} />
            <span>Daily challenge</span>
          </button>
          <button onClick={() => setView("collection")}>
            <Trophy size={16} />
            <span>Collection</span>
          </button>
        </nav>
        <div className="header-tools">
          <span className="stardust">
            <Star size={15} />
            {progress.points.toLocaleString()}
          </span>
          <button
            className="settings-button"
            aria-label="Settings"
            onClick={() => setView("settings")}
          >
            <Settings size={21} />
          </button>
        </div>
      </header>
      <main id="main">
        {view === "home" && (
          <>
            <div className="home-topline">
              <span className="edition">
                <Globe2 size={14} /> THE OPEN-SOURCE GUESSING GENIE
              </span>
              <span>
                {total.toLocaleString()} sourced entries · five universes · free
                to play
              </span>
            </div>
            <section className="genie-stage home-stage">
              <aside className="recent-panel">
                <h2>
                  Last 10 games <span>ON THIS DEVICE</span>
                </h2>
                {progress.recent.length ? (
                  <ol>
                    {progress.recent.slice(0, 10).map((r, i) => (
                      <li key={r.playedAt + i}>
                        {r.name}
                        <span>
                          {r.won ? <Check size={13} /> : <X size={13} />}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Your next mystery starts this story.</p>
                )}
                <div className="local-profile">
                  <UserRound size={16} />
                  {progress.profile.nickname}
                  <small>
                    {progress.wins} solved · {progress.streak} day streak
                  </small>
                </div>
              </aside>
              <div className="genie-holder">
                <Genie
                  mood={mood}
                  reducedMotion={progress.settings.reducedMotion}
                  theme={theme}
                />
                <span className="original-art">
                  Your curious companion. Original OpenGuess artwork.
                </span>
              </div>
              <div className="home-content">
                <div className="speech-bubble">
                  <span className="bubble-star">
                    <Sparkles size={18} />
                  </span>
                  <h1>
                    Hello, I am <em>OpenGuess.</em>
                  </h1>
                  <p>
                    Think of a real person, a fictional character,
                    <br />
                    an animal, an object, or a film.
                    <br />
                    <strong>I’ll try to guess what’s on your mind.</strong>
                  </p>
                </div>
                <h2 className="theme-caption">Select your next universe</h2>
                {themePicker}
                <p className="pack-scope">{meta.description}</p>
                {poolPicker}
                <button
                  className="big-play"
                  onClick={start}
                  disabled={loading || !activePack}
                >
                  {loading ? "Loading universe…" : "Start guessing"}
                  <ArrowRight size={22} />
                </button>
                <div>
                  {loadError && (
                    <>
                      <button onClick={retry}>Retry universe</button>
                    </>
                  )}
                </div>
                <button
                  className="link-button"
                  onClick={() => setView("library")}
                >
                  Not sure what to choose? Explore the library{" "}
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>
            <section className="free-ribbon">
              <span>
                <ShieldCheck size={18} /> No ads. No subscriptions. No paid AI.
              </span>
              <button onClick={() => setView("about")}>
                How does the magic work? <Info size={16} />
              </button>
              <a href={REPO} target="_blank" rel="noreferrer">
                <Github size={16} /> Build it with us
              </a>
            </section>
          </>
        )}
        {view === "game" && (
          <section className="genie-stage game-stage">
            <div className="genie-holder">
              <Genie
                mood={mood}
                reducedMotion={progress.settings.reducedMotion}
              />
              <span className="game-universe">
                <span>{meta.label}</span> ·{" "}
                {activePack?.characters.length.toLocaleString()} entries
              </span>
            </div>
            <div className="game-content" aria-busy={busy}>
              <div className="round-header">
                <button onClick={() => setView("home")}>
                  <ArrowLeft size={16} /> Change universe
                </button>
                <span>
                  {history.length}/{MAX_QUESTIONS} clues
                </span>
              </div>
              {loadError || error ? (
                <div className="speech-bubble">
                  <h2 ref={focus} tabIndex={-1}>
                    The magic paused.
                  </h2>
                  <p role="alert">{loadError || error}</p>
                  <button className="big-play" onClick={retry}>
                    Retry universe
                  </button>
                  <button onClick={() => setView("home")}>
                    Return to setup
                  </button>
                </div>
              ) : loading || !activePack || (busy && !visibleNext) ? (
                loadingView
              ) : phase === "stumped" || exhausted ? (
                <div className="speech-bubble result-bubble">
                  <span className="result-label">YOU WON THIS ROUND</span>
                  <h2 ref={focus} tabIndex={-1}>
                    You stumped me!
                  </h2>
                  <p>
                    {informative === 0
                      ? "I need a few known clues to make a useful guess."
                      : "Your thought may be outside this pack, or the source facts may be incomplete."}
                  </p>
                  <div className="result-actions">
                    <button className="big-play" onClick={start}>
                      Play again <RotateCcw size={17} />
                    </button>
                    <button
                      onClick={() => {
                        setProposal((p) => ({ ...p, category: theme }));
                        setView("contribute");
                      }}
                    >
                      Add a new possibility <Plus size={17} />
                    </button>
                  </div>
                </div>
              ) : guess || phase === "won" ? (
                <div className="speech-bubble result-bubble">
                  <span className="result-label">
                    {phase === "won" ? "MYSTERY SOLVED" : "I THINK OF"}
                  </span>
                  {top && (
                    <>
                      <Avatar character={top.character} />
                      <h2 ref={focus} tabIndex={-1}>
                        {top.character.name}
                      </h2>
                      <p>{top.character.description}</p>
                      <div className="confidence-pill">
                        {Math.round(top.probability * 100)}% relative weight in
                        this pack
                      </div>
                      <p className="honest-note">
                        A best match among sourced entries. It can be wrong.
                      </p>
                      {top.character.source && (
                        <a
                          className="source-link"
                          href={top.character.source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View source facts <ArrowRight size={13} />
                        </a>
                      )}
                      {phase === "won" ? (
                        <>
                          <div className="win-message">
                            <Star size={18} /> Collected! +
                            {100 + Math.max(0, 20 - history.length) * 5}{" "}
                            stardust
                          </div>
                          <button className="big-play" onClick={start}>
                            One more mystery <ArrowRight size={17} />
                          </button>
                        </>
                      ) : (
                        <div className="guess-choices">
                          <button onClick={confirm}>
                            <Check size={19} /> That’s correct
                          </button>
                          <button onClick={reject}>
                            <X size={19} /> No — keep going
                          </button>
                          <button className="link-button" onClick={surrender}>
                            My answer isn’t here
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : visibleNext ? (
                <>
                  <div className="question-bubble speech-bubble">
                    <span className="question-number">
                      {String(history.length + 1).padStart(2, "0")}
                    </span>
                    <div
                      className="question-transition"
                      key={visibleNext.question.id}
                    >
                      <span className="result-label">{t("question")}</span>
                      <h2 data-testid="question-text" ref={focus} tabIndex={-1}>
                        {visibleNext.question.text}
                      </h2>
                      <details className="question-help">
                        <summary>Help with this clue</summary>
                        <p>{visibleNext.question.hint}</p>
                      </details>
                    </div>
                  </div>
                  <p className="round-phase" role="status">
                    {busy
                      ? "Connecting the clues…"
                      : recovering
                        ? "Let’s try another angle."
                        : readiness?.phase === "confirming"
                          ? "One more detail…"
                          : "Follow the clues."}
                  </p>
                  <div className="answer-card">
                    {choices.map((c) => (
                      <button
                        key={c.value}
                        disabled={busy}
                        onClick={() => answer(c.value)}
                        aria-keyshortcuts={c.number}
                      >
                        <span>{t(c.key)}</span>
                        <kbd aria-hidden="true">{c.number}</kbd>
                        <span className="answer-chevron" aria-hidden="true">
                          »
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                loadingView
              )}
              <div className="round-bottom">
                {history.length > 0 && phase !== "won" && (
                  <button onClick={undo} disabled={busy}>
                    <ArrowLeft size={16} />
                    {guess || phase === "stumped" || exhausted
                      ? "Undo last answer"
                      : "Undo"}
                  </button>
                )}
                <button onClick={start} disabled={loading}>
                  <RotateCcw size={15} /> Restart
                </button>
                {phase === "question" &&
                  !guess &&
                  !exhausted &&
                  history.length > 0 && (
                    <button onClick={surrender}>Give up</button>
                  )}
                <button
                  aria-expanded={explain}
                  onClick={() => setExplain(!explain)}
                >
                  <Eye size={16} /> Detective notes
                </button>
              </div>
              {explain && (
                <div className="v2-notes">
                  <p>
                    These are model weights, not calibrated real-world accuracy.
                    Missing source facts remain unknown. Questions use
                    meaningful facts; a sparse profile can leave the mystery
                    unresolved.
                  </p>
                  <div>
                    {candidates.slice(0, 5).map((c) => (
                      <p key={c.character.id}>
                        <span>{c.character.name}</span>
                        <meter
                          aria-label={`${c.character.name} relative weight`}
                          min={0}
                          max={1}
                          value={c.probability}
                        />
                        <strong>{Math.round(c.probability * 100)}%</strong>
                      </p>
                    ))}
                  </div>
                  <ol>
                    {history.map((h, i) => (
                      <li key={h.questionId}>
                        <span>
                          {
                            activePack?.questions.find(
                              (q) => q.id === h.questionId,
                            )?.text
                          }
                        </span>
                        <strong>
                          {choices.find((c) => c.value === h.answer)?.key}
                        </strong>
                        <button
                          onClick={() => {
                            setHistory(history.slice(0, i));
                            setPhase("question");
                            setPausedAt(i);
                          }}
                        >
                          Correct from here
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}
        {view === "library" && (
          <section className="hub-page">
            <div className="page-heading">
              <span>FIVE WORLDS OF POSSIBILITIES</span>
              <h1>The knowledge library</h1>
              <p>
                {total.toLocaleString()} sourced records. Browse a pack before
                choosing your secret.
              </p>
            </div>
            {themePicker}
            <p className="pack-scope">{meta.description}</p>
            {poolPicker}
            <div className="library-bar">
              <label>
                <Search size={19} />
                <input
                  type="search"
                  aria-label="Search entries"
                  placeholder="Search a name or description…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <button
                className="solid-button"
                onClick={start}
                disabled={loading}
              >
                Play this universe <ArrowRight size={18} />
              </button>
            </div>
            {loading ? (
              loadingView
            ) : loadError ? (
              <p role="alert">{loadError}</p>
            ) : (
              <>
                <p className="result-count">
                  {visible.length.toLocaleString()} records · Wikidata facts
                  (CC0) and authored profiles (MIT) · semantic questions only
                </p>
                <div className="v2-library-grid">
                  {visible.slice(page * 24, (page + 1) * 24).map((c) => (
                    <article key={c.id}>
                      <Avatar character={c} />
                      <div>
                        <h2>{c.name}</h2>
                        <p>{c.description}</p>
                        {c.source && (
                          <a
                            href={c.source.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Source facts
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {visible.length === 0 && <p>No entries match this search.</p>}
                <div className="pagination">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!page}
                  >
                    <ArrowLeft size={16} /> Previous
                  </button>
                  <span>
                    Page {page + 1} of{" "}
                    {Math.max(1, Math.ceil(visible.length / 24))}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(page + 1) * 24 >= visible.length}
                  >
                    Next <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            <button
              className="link-button"
              onClick={() => {
                setProposal((p) => ({ ...p, category: theme }));
                setView("contribute");
              }}
            >
              Suggest an entry, a question, or a licensed photo{" "}
              <Plus size={16} />
            </button>
          </section>
        )}
        {view === "collection" && (
          <section className="hub-page">
            <div className="page-heading">
              <span>YOUR HALL OF DISCOVERIES · LOCAL TO THIS BROWSER</span>
              <h1>Your collection</h1>
              <p>
                {progress.profile.nickname}, you’ve solved {progress.wins}{" "}
                mysteries and earned {progress.points.toLocaleString()}{" "}
                stardust.
              </p>
            </div>
            <div className="achievement-grid">
              {achievements.map((a) => (
                <article key={a.id} className={a.unlocked ? "unlocked" : ""}>
                  <Trophy size={25} />
                  <h2>{a.title}</h2>
                  <p>{a.description}</p>
                  <span>{a.unlocked ? "Unlocked" : "Keep exploring"}</span>
                </article>
              ))}
            </div>
            <div className="collection-summary">
              <span>{progress.collection.length} unique discoveries</span>
              <span>{progress.streak} day streak</span>
            </div>
            {progress.collection.length ? (
              <div className="v2-library-grid">
                {progress.collection
                  .slice(-48)
                  .reverse()
                  .map((c) => (
                    <article key={`${c.theme}:${c.entityId}`}>
                      <Star size={25} />
                      <div>
                        <h2>{c.name}</h2>
                        <p>
                          {c.theme} · best in {c.bestQuestions} clues
                        </p>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="empty-collection">
                <Sparkles size={40} />
                <h2>Your collection is waiting.</h2>
                <p>Confirm a correct guess to collect your first discovery.</p>
                <button
                  className="solid-button"
                  onClick={() => setView("home")}
                >
                  Find a mystery
                </button>
              </div>
            )}
            <p className="honest-note">
              This is your personal collection. No worldwide ranking is invented
              from local scores.
            </p>
          </section>
        )}
        {view === "daily" && (
          <section className="hub-page">
            <div className="page-heading">
              <span>{today} · A NEW SET EVERY DAY</span>
              <h1>Five mysteries. One curious mind.</h1>
              <p>
                Use each clue to choose a thought, then get the genie to
                identify it. Daily targets are deterministic for this pack and
                date.
              </p>
            </div>
            {themePicker}
            {loading ? (
              loadingView
            ) : (
              <>
                <div className="daily-progress">
                  {daily.filter((id) => solved.has(id)).length}/5 discoveries
                  found · {meta.label}
                </div>
                <div className="daily-grid">
                  {daily.map((id, i) => {
                    const c = activePack!.characters.find((c) => c.id === id)!;
                    const found = solved.has(id);
                    return (
                      <article key={id}>
                        <span className="daily-number">0{i + 1}</span>
                        <span className="daily-status">
                          {found ? "Solved" : "MYSTERY CLUE"}
                        </span>
                        <h2>{found ? c.name : c.description}</h2>
                        <p>
                          {found
                            ? "Collected in your personal hall."
                            : `Name clue: ${c.name[0]}… · ${c.name.replace(/\s/g, "").length} characters without spaces`}
                        </p>
                        {found ? (
                          <Check size={22} />
                        ) : (
                          <details>
                            <summary>Reveal identity</summary>
                            <p>{c.name}</p>
                            <small>
                              Revealing is a hint; it does not automatically
                              complete the challenge.
                            </small>
                          </details>
                        )}
                        <button className="solid-button" onClick={start}>
                          Play the clue <ArrowRight size={15} />
                        </button>
                      </article>
                    );
                  })}
                </div>
                <p className="honest-note">
                  Confirming one of today’s five targets marks it solved.
                  Challenges and rewards are local and have no monetary value.
                </p>
              </>
            )}
          </section>
        )}
        {view === "settings" && (
          <section className="hub-page settings-page">
            <div className="page-heading">
              <span>MAKE THE MAGIC YOURS</span>
              <h1>Settings & profile</h1>
              <p>
                Play freely as a guest. Your profile, settings and discoveries
                are stored on this browser.
              </p>
            </div>
            <div className="settings-grid">
              <section className="settings-card">
                <h2>
                  <UserRound size={21} /> Your local profile
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setting({ nickname });
                  }}
                >
                  <label>
                    Nickname
                    <input
                      value={nickname}
                      maxLength={40}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </label>
                  <button className="solid-button" type="submit">
                    Save profile
                  </button>
                </form>
                <p>No email is needed for local play.</p>
              </section>
              <section className="settings-card">
                <h2>
                  <Globe2 size={21} /> Language
                </h2>
                <label>
                  Interface language
                  <select
                    value={lang}
                    onChange={(e) => setting({ language: e.target.value })}
                  >
                    {languages.map((l) => (
                      <option value={l.code} key={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  18 interface languages. Catalog descriptions, questions and
                  some controls remain in English; full translation is still in
                  progress.
                </p>
              </section>
              <section className="settings-card">
                <h2>
                  <Settings size={21} /> Gameplay
                </h2>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!progress.settings.reducedMotion}
                    onChange={(e) =>
                      setting({ reducedMotion: !e.target.checked })
                    }
                  />{" "}
                  Genie animations
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={progress.settings.sound}
                    onChange={(e) => setting({ sound: e.target.checked })}
                  />{" "}
                  Celebration sound
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={progress.settings.familyMode}
                    onChange={(e) => {
                      setting({ familyMode: e.target.checked });
                      setView("home");
                      setHistory([]);
                      setRejected([]);
                    }}
                  />{" "}
                  Sensitive content filter
                </label>
                <p>
                  Best-effort filtering of explicit adult wording. Source data
                  is not fully moderated; this is not a child-safety guarantee.
                  System reduced-motion preferences are always respected.
                </p>
              </section>
              <section className="settings-card">
                <h2>
                  <ShieldCheck size={21} /> Keep your discoveries
                </h2>
                <button
                  className="outline-button"
                  onClick={() =>
                    download(
                      "openguess-progress.json",
                      JSON.parse(exportProgress(progress)),
                    )
                  }
                >
                  <Download size={17} /> Export progress
                </button>
                <label className="outline-button upload-button">
                  <Upload size={17} /> Import progress
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void importBackup(file);
                    }}
                  />
                </label>
                <p>
                  Imports replace this browser’s progress. Review the backup
                  before sharing it.
                </p>
                <button
                  className="danger-link"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear your local collection, profile and settings? This cannot be undone without a backup.",
                      )
                    ) {
                      const p = readProgress({
                        getItem: () => null,
                      } as unknown as Storage);
                      if (persist(p)) setNotice("Local progress cleared.");
                      setNickname(p.profile.nickname);
                    }
                  }}
                >
                  Clear local progress
                </button>
              </section>
            </div>
            <Suspense fallback={<p>Loading optional accounts…</p>}>
              <CloudPanel
                progress={progress}
                onReplace={(p) => {
                  const saved = persist(p);
                  setNickname(p.profile.nickname);
                  return saved;
                }}
                onNotice={setNotice}
              />
            </Suspense>
          </section>
        )}
        {view === "contribute" && (
          <section className="hub-page contribution-page">
            <div className="page-heading">
              <span>MAKE THE KNOWLEDGE BETTER</span>
              <h1>Add a little possibility.</h1>
              <p>
                Suggest an entry, a better question, or a licensed photo. Export
                a proposal and submit it for review. Nothing is uploaded
                automatically.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  proposal.kind === "photo" &&
                  (!proposal.rights || !/^https:\/\//i.test(proposal.photoUrl))
                ) {
                  setNotice(
                    "Photo proposals need an HTTPS URL and a rights confirmation.",
                  );
                  return;
                }
                download("openguess-proposal.json", {
                  schema: "openguess.proposal/v2",
                  ...proposal,
                  answers: history,
                  packVersion: pack?.version,
                  notice: "Unreviewed; no live data changed.",
                });
                setNotice(
                  "Proposal exported. Review the file, then submit it on GitHub.",
                );
              }}
            >
              <label>
                Proposal type
                <select
                  value={proposal.kind}
                  onChange={(e) =>
                    setProposal((p) => ({ ...p, kind: e.target.value }))
                  }
                >
                  <option value="character">New entry / correction</option>
                  <option value="question">New question</option>
                  <option value="photo">Licensed photo</option>
                </select>
              </label>
              <label>
                Universe
                <select
                  value={proposal.category}
                  onChange={(e) =>
                    setProposal((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  {themeManifest.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {proposal.kind === "question" ? "Question text" : "Entry name"}
                <input
                  required
                  maxLength={160}
                  value={proposal.name}
                  onChange={(e) =>
                    setProposal((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </label>
              <label>
                Description, source facts and evidence
                <textarea
                  required
                  maxLength={2000}
                  value={proposal.description}
                  onChange={(e) =>
                    setProposal((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </label>
              {proposal.kind === "photo" && (
                <>
                  <label>
                    HTTPS photo URL
                    <input
                      type="url"
                      required
                      value={proposal.photoUrl}
                      onChange={(e) =>
                        setProposal((p) => ({ ...p, photoUrl: e.target.value }))
                      }
                    />
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      required
                      checked={proposal.rights}
                      onChange={(e) =>
                        setProposal((p) => ({ ...p, rights: e.target.checked }))
                      }
                    />{" "}
                    I have checked the image license and can share it.
                  </label>
                </>
              )}
              <p>
                Export includes {history.length} answers. Public figures or
                fictional characters only; do not add private individuals.
              </p>
              <button className="solid-button" type="submit">
                <Download size={17} /> Export proposal
              </button>
              <a
                className="outline-button"
                href={`${REPO}/issues/new`}
                target="_blank"
                rel="noreferrer"
              >
                <Github size={17} /> Submit for review
              </a>
            </form>
          </section>
        )}
        {view === "about" && (
          <section className="hub-page about-page">
            <div className="page-heading">
              <span>OPEN CODE, OPEN KNOWLEDGE</span>
              <h1>The magic is a question.</h1>
              <p>
                OpenGuess weighs possibilities from your answers and asks the
                question expected to reduce uncertainty most. It runs in a
                browser worker so the interface stays responsive.
              </p>
            </div>
            <div className="settings-grid">
              <section className="settings-card">
                <h2>Thousands of real records</h2>
                <p>
                  The catalog contains {total.toLocaleString()} records across
                  five themes: CC0 Wikidata facts and MIT authored annotations.
                  Public facts are incomplete. Mammal taxa and
                  vehicle/tool/instrument types broaden the animal and object
                  packs, including many specialized entries.
                </p>
              </section>
              <section className="settings-card">
                <h2>Honest guessing</h2>
                <p>
                  Missing facts remain unknown. A percentage is a relative model
                  weight, not a certified probability of being correct.
                  Questions use meaningful facts. If those facts cannot
                  distinguish entries, the game admits uncertainty. It can still
                  guess incorrectly.
                </p>
              </section>
              <section className="settings-card">
                <h2>Free, by design</h2>
                <p>
                  No advertisements, payment gates or paid AI. Core inference
                  happens locally. Source code is MIT licensed; Wikidata
                  structured records are CC0. Hosting and online-service free
                  tiers have limits.
                </p>
              </section>
              <section className="settings-card">
                <h2>Original OpenGuess</h2>
                <p>
                  The genie, motion and interface are independently created in
                  the classic genie-game direction. OpenGuess is not affiliated
                  with Akinator or Elokence. REA research observes public
                  behavior, not the private algorithm or database.
                </p>
              </section>
            </div>
            <a
              className="solid-button"
              href={`${REPO}/tree/main/docs`}
              target="_blank"
              rel="noreferrer"
            >
              Research, data quality & scaling <ArrowRight size={17} />
            </a>
          </section>
        )}
        {loadError && view === "home" && (
          <p className="v2-notice" role="alert">
            {loadError}
          </p>
        )}
        {notice && (
          <p className="v2-notice" role="status">
            {notice}
          </p>
        )}
      </main>
      <footer className="v2-footer">
        <span>
          <Sparkles size={16} /> OpenGuess · version 0.2.1
        </span>
        <button onClick={() => setView("about")}>About & data sources</button>
        <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
          MIT licensed
        </a>
        <a href={REPO} target="_blank" rel="noreferrer">
          <Github size={16} /> GitHub
        </a>
        <span>Made for curiosity. Always free.</span>
      </footer>
    </div>
  );
}
