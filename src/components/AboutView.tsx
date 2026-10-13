import type { RefObject } from "react";
import { ArrowUpRight, Github, ShieldCheck, RotateCcw } from "lucide-react";
import { characters } from "../data/catalog";
const REPO = "https://github.com/mk-knight23/openguess";

type Props = {
  stats: { wins: number; rounds: number };
  clearStats: () => void;
  focusRef: RefObject<HTMLHeadingElement | null>;
};
export function AboutView({ stats, clearStats, focusRef }: Props) {
  return (
    <section className="content-page about-page">
      <div className="eyebrow">BEHIND THE LITTLE BIT OF MAGIC</div>
      <h1 ref={focusRef} tabIndex={-1}>
        A little mystery. A little math.
      </h1>
      <p className="page-intro">
        No mind reading required. Just thoughtful questions, a small library,
        and an algorithm you can look inside.
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
            No answers leave your browser during play. Confirmed wins are stored
            locally; you can clear them below. Contribution downloads include
            your answers for review and are shared only if you choose to submit
            them.
          </p>
        </div>
      </div>
      <div className="local-stats">
        <span>{stats.wins} mysteries solved on this browser</span>
        <button className="light-secondary" onClick={clearStats}>
          <RotateCcw size={15} /> Clear local stats
        </button>
      </div>
      <p className="about-disclaimer">
        Inspired by the guessing-game genre. Independently built. OpenGuess is
        not affiliated with Akinator or Elokence, and does not use their API,
        artwork, code, or database.
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
  );
}
