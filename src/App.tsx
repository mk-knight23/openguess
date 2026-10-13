import { Header } from "./components/Header";
import { DetectiveNotes } from "./components/DetectiveNotes";
import { FeatureStrip } from "./components/FeatureStrip";
import { Introduction } from "./components/Introduction";
import { ContributionView } from "./components/ContributionView";
import { AboutView } from "./components/AboutView";
import { LibraryView } from "./components/LibraryView";
import { Avatar } from "./components/Artwork";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  WandSparkles,
  Plus,
  ChevronRight,
  Orbit,
  Lightbulb,
} from "lucide-react";
import { characters, questions, CATALOG_VERSION } from "./data/catalog";
import { rankCandidates, selectQuestion, shouldGuess } from "./engine";
import type { Answer, AnswerRecord } from "./types";

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
  const [proposalCategory, setProposalCategory] = useState<
    "real" | "fictional"
  >("fictional");
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
  function clearStats() {
    setStats({ wins: 0, rounds: 0 });
    try {
      localStorage.removeItem("openguess.stats");
    } catch {
      /* Ignore unavailable local storage. */
    }
  }
  function contribute() {
    setProposalCategory(scope === "real" ? "real" : "fictional");
    setExported(false);
    setView("contribute");
  }
  function downloadProposal() {
    const payload = {
      schema: "openguess.proposal/v1",
      catalogVersion: CATALOG_VERSION,
      name: proposalName.trim(),
      description: proposalDescription.trim(),
      category: proposalCategory,
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
      <Header view={view} setView={setView} repo={REPO} />
      <main id="main">
        {view === "play" && (
          <>
            <section className="play-layout">
              <Introduction />
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
                  {round !== "idle" &&
                    round !== "won" &&
                    (guessVisible || exhausted) && (
                      <div className="result-controls round-controls">
                        <button onClick={undo} disabled={!history.length}>
                          <ArrowLeft size={15} /> Undo last answer
                        </button>
                        <button onClick={begin}>
                          <RotateCcw size={14} /> Restart
                        </button>
                      </div>
                    )}
                </div>
                <div className="panel-under">
                  <span>
                    <ShieldCheck size={14} /> Your answers stay on this device.
                  </span>
                  {round === "idle" ? (
                    <span>Built to be curious.</span>
                  ) : (
                    <button
                      className="universe-change"
                      onClick={() => {
                        setRound("idle");
                        setExplain(false);
                      }}
                    >
                      Change universe
                    </button>
                  )}
                </div>
              </div>
            </section>
            {round !== "idle" && (
              <DetectiveNotes
                explain={explain}
                setExplain={setExplain}
                next={next}
                candidates={candidates}
                history={history}
                questions={questions}
                options={options}
              />
            )}
            <FeatureStrip />
          </>
        )}
        {view === "library" && (
          <LibraryView
            search={search}
            setSearch={setSearch}
            filtered={filtered}
            contribute={contribute}
            focusRef={focusRef}
            begin={() => {
              setScope("all");
              begin();
            }}
          />
        )}
        {view === "about" && (
          <AboutView
            stats={stats}
            clearStats={clearStats}
            focusRef={focusRef}
          />
        )}
        {view === "contribute" && (
          <ContributionView
            proposalName={proposalName}
            setProposalName={setProposalName}
            proposalDescription={proposalDescription}
            setProposalDescription={setProposalDescription}
            proposalCategory={proposalCategory}
            setProposalCategory={setProposalCategory}
            exported={exported}
            historyCount={history.length}
            downloadProposal={downloadProposal}
            back={() => setView("play")}
            focusRef={focusRef}
          />
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
