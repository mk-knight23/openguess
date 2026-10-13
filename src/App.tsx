import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Github,
  RotateCcw,
  Eye,
  ShieldCheck,
  Search,
  BookOpen,
  WandSparkles,
  Globe2,
  Download,
  Plus,
  ChevronRight,
  Orbit,
  Lightbulb,
} from "lucide-react";
import { characters, questions, CATALOG_VERSION } from "./data/catalog";
import { rankCandidates, selectQuestion, shouldGuess } from "./engine";
import type { Answer, AnswerRecord, Character } from "./types";

const REPO = "https://github.com/mk-knight23/openguess";
const options: { value: Answer; label: string; key: string }[] = [
  { value: "yes", label: "Yes", key: "1" },
  { value: "probably", label: "Probably", key: "2" },
  { value: "unknown", label: "Don't know", key: "3" },
  { value: "probably-not", label: "Probably not", key: "4" },
  { value: "no", label: "No", key: "5" },
];
type Scope = "all" | "fictional" | "real";
type View = "play" | "library" | "about" | "contribute";
type Stats = { wins: number; rounds: number };
function readStats(): Stats {
  try {
    const x = JSON.parse(localStorage.getItem("openguess.stats") ?? "{}");
    return {
      wins: Number.isSafeInteger(x.wins) && x.wins >= 0 ? x.wins : 0,
      rounds: Number.isSafeInteger(x.rounds) && x.rounds >= 0 ? x.rounds : 0,
    };
  } catch {
    return { wins: 0, rounds: 0 };
  }
}
function Orb({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "orb small" : "orb"}
      viewBox="0 0 420 380"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={small ? "orbSmall" : "orbBig"} cx="35%" cy="25%">
          <stop stopColor="#305b55" />
          <stop offset=".65" stopColor="#172c32" />
          <stop offset="1" stopColor="#0d1925" />
        </radialGradient>
        <linearGradient id="ring" x2="1" y2="1">
          <stop stopColor="#8aa99c" />
          <stop offset="1" stopColor="#dfba6f" />
        </linearGradient>
      </defs>
      <ellipse
        cx="210"
        cy="326"
        rx="106"
        ry="12"
        fill="#172b32"
        opacity=".07"
      />
      <circle
        cx="210"
        cy="179"
        r="111"
        fill={`url(#${small ? "orbSmall" : "orbBig"})`}
      />
      <path
        d="M125 111c41-31 91-36 128-14"
        fill="none"
        stroke="#b8d6c6"
        opacity=".3"
        strokeWidth="2"
      />
      <ellipse
        cx="210"
        cy="179"
        rx="173"
        ry="50"
        transform="rotate(-23 210 179)"
        fill="none"
        stroke="url(#ring)"
        strokeWidth="2"
      />
      <path
        d="M56 247c9 26 91 14 179-24s147-90 131-110"
        stroke="#e8c16c"
        strokeWidth="6"
        fill="none"
      />
      <ellipse cx="181" cy="170" rx="12" ry="18" fill="#f6e8b4" />
      <ellipse cx="239" cy="170" rx="12" ry="18" fill="#f6e8b4" />
      <circle cx="185" cy="165" r="4" fill="white" />
      <circle cx="243" cy="165" r="4" fill="white" />
      <path
        d="M195 202q15 12 30 0"
        stroke="#f6e8b4"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="72" cy="106" r="10" fill="#dbad55" />
      <circle cx="330" cy="273" r="7" fill="#77988b" />
      <path
        d="M317 69v20m-10-10h20M98 279v14m-7-7h14"
        stroke="#81968c"
        strokeWidth="2"
      />
      <circle cx="275" cy="46" r="2" fill="#658175" />
      <circle cx="42" cy="190" r="2" fill="#658175" />
      <path d="M283 280l9 13m3-25 13 4" stroke="#cdb880" strokeWidth="2" />
    </svg>
  );
}
function Avatar({ character }: { character: Character }) {
  return (
    <div
      className="avatar"
      style={{ background: character.color }}
      aria-hidden="true"
    >
      {character.initials}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("play");
  const [scope, setScope] = useState<Scope>("all");
  const [round, setRound] = useState<
    "idle" | "playing" | "guess" | "won" | "exhausted"
  >("idle");
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [pausedAt, setPausedAt] = useState(-1);
  const [explain, setExplain] = useState(false);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats>(readStats);
  const [proposalName, setProposalName] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [exported, setExported] = useState(false);
  const focusRef = useRef<HTMLHeadingElement>(null);
  const pool = useMemo(
    () => characters.filter((c) => scope === "all" || c.category === scope),
    [scope],
  );
  const candidates = useMemo(
    () => rankCandidates(pool, history, rejected),
    [pool, history, rejected],
  );
  const next = useMemo(
    () => selectQuestion(candidates, questions, history),
    [candidates, history],
  );
  const informative = history.filter((h) => h.answer !== "unknown").length;
  const guessVisible =
    round === "guess" ||
    round === "won" ||
    (round === "playing" &&
      candidates.length > 0 &&
      ((history.length > pausedAt && shouldGuess(candidates, informative)) ||
        (informative > 0 && (!next || history.length >= 25))));
  const exhausted =
    round === "exhausted" ||
    (round === "playing" &&
      (!candidates.length ||
        (informative === 0 && (!next || history.length >= 25))));
  const top = candidates[0];
  const question = next?.question;
  const filtered = characters.filter((c) =>
    `${c.name} ${c.description} ${c.tags.join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function begin() {
    setHistory([]);
    setRejected([]);
    setPausedAt(-1);
    setRound("playing");
    setExplain(false);
    setView("play");
  }
  function answer(value: Answer) {
    if (round === "playing" && !guessVisible && !exhausted && question)
      setHistory((h) => [...h, { questionId: question.id, answer: value }]);
  }
  function undo() {
    setHistory((h) => h.slice(0, -1));
    setRound("playing");
    setPausedAt(history.length - 1);
  }
  function reject() {
    if (!top) return;
    setRejected((r) => [...r, top.character.id]);
    setPausedAt(history.length);
    setRound("playing");
  }
  function confirm() {
    const updated = { wins: stats.wins + 1, rounds: stats.rounds + 1 };
    setStats(updated);
    try {
      localStorage.setItem("openguess.stats", JSON.stringify(updated));
    } catch {
      /* Play remains available when storage is disabled. */
    }
    setRound("won");
  }
  function contribute() {
    setExported(false);
    setView("contribute");
  }
  function downloadProposal() {
    const payload = {
      schema: "openguess.proposal/v1",
      catalogVersion: CATALOG_VERSION,
      name: proposalName.trim(),
      description: proposalDescription.trim(),
      category: scope === "real" ? "real" : "fictional",
      answers: history,
      notice: "Unreviewed proposal; not an automatic catalog update.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "openguess-proposal.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }
  useEffect(() => {
    if (round !== "idle" || view !== "play") focusRef.current?.focus();
  }, [history.length, view, round, rejected.length]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        view !== "play" ||
        round !== "playing" ||
        guessVisible ||
        exhausted ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      const choice = options.find((o) => o.key === event.key);
      if (choice) {
        event.preventDefault();
        answer(choice.value);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <button
          className="wordmark"
          onClick={() => setView("play")}
          aria-label="OpenGuess home"
        >
          <span className="brand-symbol">
            <Orbit size={25} />
          </span>
          open<span>guess</span>
          <span className="version">BETA</span>
        </button>
        <nav aria-label="Main navigation">
          <button
            className={view === "play" ? "active" : ""}
            onClick={() => setView("play")}
          >
            Play
          </button>
          <button
            className={view === "about" ? "active" : ""}
            onClick={() => setView("about")}
          >
            How it works
          </button>
          <button
            className={view === "library" ? "active" : ""}
            onClick={() => setView("library")}
          >
            Library
          </button>
        </nav>
        <a className="github-link" href={REPO} target="_blank" rel="noreferrer">
          <Github size={17} />
          <span>Open source</span>
          <ArrowUpRight size={15} />
        </a>
      </header>
      <main id="main">
        {view === "play" && (
          <>
            <section className="play-layout">
              <div className="intro">
                <div className="eyebrow">
                  <span className="live-dot" /> A LITTLE MYSTERY. A LITTLE MATH.
                </div>
                <h1>
                  Your mind.
                  <br />
                  Our next <em>mystery.</em>
                </h1>
                <p className="intro-copy">
                  Think of a character. Keep it a secret.
                  <br />
                  We’ll connect the clues.
                </p>
                <div className="illustration">
                  <Orb />
                  <span className="orbit-label top">
                    <Sparkles size={13} /> The possibilities are out there.
                  </span>
                  <span className="orbit-label bottom">
                    Meet Orbit. Your curious companion.
                  </span>
                </div>
                <div className="privacy-note">
                  <ShieldCheck size={17} />
                  <span>No account. No ads. Just curiosity.</span>
                </div>
              </div>
              <div className="game-wrap">
                <div className="game-panel">
                  <div className="panel-top">
                    <span>
                      <span className="live-dot" /> THE GUESSING ROOM
                    </span>
                    <span className="panel-version">V.01</span>
                  </div>
                  {round === "idle" ? (
                    <div className="welcome-state">
                      <span className="mini-icon">
                        <WandSparkles size={26} />
                      </span>
                      <h2>
                        Got someone
                        <br />
                        in mind?
                      </h2>
                      <p>
                        A superhero, a scientist, a familiar face.
                        <br />
                        Pick someone from our starter library.
                      </p>
                      <div className="scope-title">CHOOSE YOUR UNIVERSE</div>
                      <div className="scope-options">
                        {(["all", "fictional", "real"] as Scope[]).map((s) => (
                          <button
                            key={s}
                            aria-pressed={scope === s}
                            onClick={() => setScope(s)}
                          >
                            {s === "all"
                              ? "Everyone"
                              : s === "fictional"
                                ? "Fictional"
                                : "Real people"}
                          </button>
                        ))}
                      </div>
                      <button className="primary start" onClick={begin}>
                        Start guessing <ArrowRight size={19} />
                      </button>
                      <span className="small-note">
                        {pool.length} characters · five simple answers
                      </span>
                      <div className="starter-preview">
                        <span>Need inspiration?</span>
                        <button onClick={() => setView("library")}>
                          Peek at the library <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  ) : exhausted ? (
                    <div className="result-state">
                      <span className="mini-icon">
                        <Lightbulb size={26} />
                      </span>
                      <h2 ref={focusRef} tabIndex={-1}>
                        You stumped me.
                      </h2>
                      <p>
                        {informative === 0
                          ? "I need a few clues to make a useful guess."
                          : "Your character may be outside my starter library, or I need better clues."}
                      </p>
                      <button className="primary" onClick={begin}>
                        Try another round <ArrowRight size={17} />
                      </button>
                      <button className="secondary" onClick={contribute}>
                        Suggest a character <Plus size={16} />
                      </button>
                    </div>
                  ) : guessVisible && top ? (
                    <div className="result-state">
                      <span className="result-kicker">
                        {round === "won"
                          ? "MYSTERY SOLVED"
                          : "THE CLUES POINT TO…"}
                      </span>
                      <Avatar character={top.character} />
                      <h2 ref={focusRef} tabIndex={-1}>
                        {top.character.name}
                      </h2>
                      <p>{top.character.description}</p>
                      <span className="model-note">
                        {Math.round(top.probability * 100)}% relative model
                        weight · {history.length} clues
                        <br />A best match in this library, not a guarantee.
                      </span>
                      {round === "won" ? (
                        <>
                          <div className="solved">
                            <Check size={17} /> A good bit of detective work.
                          </div>
                          <button className="primary" onClick={begin}>
                            One more mystery <ArrowRight size={17} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="primary" onClick={confirm}>
                            <Check size={17} /> That’s my character
                          </button>
                          <button className="secondary" onClick={reject}>
                            <X size={16} /> Not this time — keep going
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              setRound("exhausted");
                              contribute();
                            }}
                          >
                            It’s not in the library
                          </button>
                        </>
                      )}
                    </div>
                  ) : question ? (
                    <div className="question-state">
                      <div className="question-count">
                        QUESTION{" "}
                        <strong>
                          {String(history.length + 1).padStart(2, "0")}
                        </strong>
                        <span>up to 25 clues</span>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{ width: `${(history.length / 25) * 100}%` }}
                        />
                      </div>
                      <h2
                        data-testid="question-text"
                        ref={focusRef}
                        tabIndex={-1}
                      >
                        {question.text}
                      </h2>
                      <p className="question-hint">{question.hint}</p>
                      <div className="answer-options">
                        {options.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => answer(o.value)}
                            aria-keyshortcuts={o.key}
                            className={`answer answer-${o.value}`}
                          >
                            <span>{o.label}</span>
                            <kbd aria-hidden="true">{o.key}</kbd>
                            {o.value === "yes" ? (
                              <Check size={18} />
                            ) : o.value === "no" ? (
                              <X size={18} />
                            ) : (
                              <ChevronRight size={17} />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="round-controls">
                        <button onClick={undo} disabled={!history.length}>
                          <ArrowLeft size={15} /> Undo
                        </button>
                        <button onClick={begin}>
                          <RotateCcw size={14} /> Restart
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="panel-under">
                  <span>
                    <ShieldCheck size={14} /> Your answers stay on this device.
                  </span>
                  <span>Built to be curious.</span>
                </div>
              </div>
            </section>
            {round !== "idle" && (
              <section className="explain-section">
                <button
                  className="explain-toggle"
                  aria-expanded={explain}
                  onClick={() => setExplain(!explain)}
                >
                  <Eye size={16} />
                  {explain
                    ? "Hide the detective notes"
                    : "Peek inside the thinking"}
                  <span>May reveal the answer</span>
                </button>
                {explain && (
                  <div className="detective-notes">
                    <div>
                      <h3>Following the clues</h3>
                      <p>
                        Every answer adjusts a character’s weight. The next
                        question separates the remaining possibilities. “Don’t
                        know” adds no evidence.
                      </p>
                      <span>
                        {next
                          ? `${next.informationGain.toFixed(3)} bits of expected information in the next question.`
                          : "No useful unasked question remains."}
                      </span>
                    </div>
                    <div className="candidate-list">
                      {candidates.slice(0, 4).map((c) => (
                        <div key={c.character.id}>
                          <span>{c.character.name}</span>
                          <meter min="0" max="1" value={c.probability} />
                          <span>{Math.round(c.probability * 100)}%</span>
                        </div>
                      ))}
                      <p>
                        Relative weights inside a limited catalog; not
                        calibrated confidence.
                      </p>
                    </div>
                    <ol className="history-list">
                      {history.map((h) => (
                        <li key={h.questionId}>
                          <span>
                            {questions.find((q) => q.id === h.questionId)?.text}
                          </span>
                          <strong>
                            {options.find((o) => o.value === h.answer)?.label}
                          </strong>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>
            )}
            <section className="feature-strip" aria-label="Game features">
              <div>
                <span className="feature-number">01</span>
                <div>
                  <h3>A familiar face</h3>
                  <p>Real people & fictional characters</p>
                </div>
                <BookOpen size={22} />
              </div>
              <div>
                <span className="feature-number">02</span>
                <div>
                  <h3>Follow the clues</h3>
                  <p>Every answer shapes the next question</p>
                </div>
                <Sparkles size={22} />
              </div>
              <div>
                <span className="feature-number">03</span>
                <div>
                  <h3>Open by nature</h3>
                  <p>Free to play. Yours to improve.</p>
                </div>
                <Globe2 size={22} />
              </div>
            </section>
          </>
        )}
        {view === "library" && (
          <section className="content-page">
            <div className="eyebrow">OUR STARTER UNIVERSE</div>
            <h1 ref={focusRef} tabIndex={-1}>
              Familiar faces.
              <br />
              <em>Endless curiosity.</em>
            </h1>
            <p className="page-intro">
              {characters.length} people and characters Orbit knows today. Pick
              one, keep it secret, and start a round. This is a curated first
              edition, not a worldwide database.
            </p>
            <div className="library-tools">
              <label className="search-field">
                <Search size={18} />
                <input
                  type="search"
                  aria-label="Search characters"
                  placeholder="Find a character, a story, a familiar face…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button className="light-primary" onClick={begin}>
                Let’s play <ArrowRight size={17} />
              </button>
            </div>
            <div className="library-grid">
              {filtered.map((c) => (
                <article key={c.id} className="character-card">
                  <Avatar character={c} />
                  <div>
                    <span className="character-type">
                      {c.category === "real" ? "REAL PERSON" : "FICTIONAL"}
                    </span>
                    <h2>{c.name}</h2>
                    <p>{c.description}</p>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <p className="empty-result">
                No match in this edition. Try another name or{" "}
                <button onClick={contribute}>suggest a character</button>.
              </p>
            )}
            <button className="light-secondary" onClick={contribute}>
              <Plus size={17} /> Help grow the library
            </button>
          </section>
        )}
        {view === "about" && (
          <section className="content-page about-page">
            <div className="eyebrow">BEHIND THE LITTLE BIT OF MAGIC</div>
            <h1 ref={focusRef} tabIndex={-1}>
              A little mystery. A little math.
            </h1>
            <p className="page-intro">
              No mind reading required. Just thoughtful questions, a small
              library, and an algorithm you can look inside.
            </p>
            <div className="about-grid">
              {[
                [
                  "01",
                  "Start with possibilities",
                  "Every character in your chosen universe starts with the same weight. Our first edition contains " +
                    characters.length +
                    " independently authored entries.",
                ],
                [
                  "02",
                  "Connect the clues",
                  "Yes and no strongly shift the weights. Probably and probably not offer softer clues. Don’t know leaves the weights unchanged.",
                ],
                [
                  "03",
                  "Ask a better question",
                  "Orbit chooses a question expected to reduce uncertainty the most. It does not follow a fixed script or make calls to a paid AI service.",
                ],
                [
                  "04",
                  "Make an honest guess",
                  "When one candidate leads, Orbit offers a guess. Its percentage is a relative model weight, not a proven chance of being right. You can reject it and continue.",
                ],
              ].map(([n, title, body]) => (
                <article key={n}>
                  <span className="feature-number">{n}</span>
                  <h2>{title}</h2>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <div className="privacy-card">
              <ShieldCheck size={26} />
              <div>
                <h2>Curiosity without a data trail.</h2>
                <p>
                  No answers leave your browser during play. Confirmed wins are
                  stored locally; you can clear them below. Contribution
                  downloads include your answers for review and are shared only
                  if you choose to submit them.
                </p>
              </div>
            </div>
            <div className="local-stats">
              <span>{stats.wins} mysteries solved on this browser</span>
              <button
                className="light-secondary"
                onClick={() => {
                  setStats({ wins: 0, rounds: 0 });
                  try {
                    localStorage.removeItem("openguess.stats");
                  } catch {
                    /* Ignore unavailable local storage. */
                  }
                }}
              >
                <RotateCcw size={15} /> Clear local stats
              </button>
            </div>
            <p className="about-disclaimer">
              Inspired by the guessing-game genre. Independently built.
              OpenGuess is not affiliated with Akinator or Elokence, and does
              not use their API, artwork, code, or database.
            </p>
            <a
              className="light-primary inline-link"
              href={REPO}
              target="_blank"
              rel="noreferrer"
            >
              <Github size={17} /> Explore the source <ArrowUpRight size={16} />
            </a>
          </section>
        )}
        {view === "contribute" && (
          <section className="content-page proposal-page">
            <button className="back-button" onClick={() => setView("play")}>
              <ArrowLeft size={16} /> Back to the game
            </button>
            <div className="eyebrow">A LIBRARY BUILT TO GROW</div>
            <h1 ref={focusRef} tabIndex={-1}>
              Someone <em>missing?</em>
            </h1>
            <p className="page-intro">
              Help us add a new possibility. Export a proposal, then submit it
              with a GitHub issue or pull request. Nothing is uploaded
              automatically.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                downloadProposal();
              }}
            >
              <label>
                Character name
                <input
                  required
                  maxLength={100}
                  value={proposalName}
                  onChange={(e) => setProposalName(e.target.value)}
                  placeholder="A public figure or fictional character"
                />
              </label>
              <label>
                A short description
                <textarea
                  required
                  maxLength={500}
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  placeholder="Who are they? Which story or field are they known for?"
                />
              </label>
              <p className="proposal-notice">
                Your download includes {history.length} answers from this round.
                Review the file before sharing it. Suggest public figures or
                fictional characters, not private individuals.
              </p>
              <button
                className="light-primary"
                type="submit"
                disabled={!proposalName.trim() || !proposalDescription.trim()}
              >
                <Download size={17} /> Export proposal
              </button>
              {exported && (
                <p role="status">
                  Proposal exported. Review it, then{" "}
                  <a
                    href={`${REPO}/issues/new`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    open a GitHub issue
                  </a>{" "}
                  to share it. It has not changed the catalog.
                </p>
              )}
            </form>
          </section>
        )}
      </main>
      <footer>
        <span className="footer-brand">
          <Orbit size={18} /> An open experiment in curiosity.
        </span>
        <span>
          {characters.length} characters · catalog {CATALOG_VERSION}
        </span>
        <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
          Free, forever. MIT licensed. <ArrowUpRight size={13} />
        </a>
      </footer>
    </div>
  );
}
