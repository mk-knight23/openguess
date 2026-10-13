import type { RefObject } from "react";
import { ArrowRight, Search, Plus } from "lucide-react";
import { characters } from "../data/catalog";
import type { Character } from "../types";
import { Avatar } from "./Artwork";
type Props = {
  search: string;
  setSearch: (value: string) => void;
  filtered: Character[];
  contribute: () => void;
  focusRef: RefObject<HTMLHeadingElement | null>;
  begin: () => void;
};
export function LibraryView({
  search,
  setSearch,
  filtered,
  contribute,
  focusRef,
  begin,
}: Props) {
  return (
    <section className="content-page">
      <div className="eyebrow">OUR STARTER UNIVERSE</div>
      <h1 ref={focusRef} tabIndex={-1}>
        Familiar faces.
        <br />
        <em>Endless curiosity.</em>
      </h1>
      <p className="page-intro">
        {characters.length} people and characters Orbit knows today. Pick one,
        keep it secret, and start a round. This is a curated first edition, not
        a worldwide database.
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
  );
}
