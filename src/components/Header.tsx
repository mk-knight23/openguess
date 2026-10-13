import { Orbit, Github, ArrowUpRight } from "lucide-react";
type View = "play" | "library" | "about" | "contribute";
type Props = { view: View; setView: (view: View) => void; repo: string };
export function Header({ view, setView, repo }: Props) {
  return (
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
      <a
        className="github-link"
        aria-label="OpenGuess source on GitHub"
        href={repo}
        target="_blank"
        rel="noreferrer"
      >
        <Github size={17} />
        <span>Open source</span>
        <ArrowUpRight size={15} />
      </a>
    </header>
  );
}
