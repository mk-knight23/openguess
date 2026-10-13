import type { RefObject } from "react";
import { ArrowLeft, Download } from "lucide-react";
const REPO = "https://github.com/mk-knight23/openguess";

type Props = {
  proposalName: string;
  setProposalName: (value: string) => void;
  proposalDescription: string;
  setProposalDescription: (value: string) => void;
  proposalCategory: "real" | "fictional";
  setProposalCategory: (value: "real" | "fictional") => void;
  exported: boolean;
  historyCount: number;
  downloadProposal: () => void;
  back: () => void;
  focusRef: RefObject<HTMLHeadingElement | null>;
};
export function ContributionView({
  proposalName,
  setProposalName,
  proposalDescription,
  setProposalDescription,
  proposalCategory,
  setProposalCategory,
  exported,
  historyCount,
  downloadProposal,
  back,
  focusRef,
}: Props) {
  return (
    <section className="content-page proposal-page">
      <button className="back-button" onClick={back}>
        <ArrowLeft size={16} /> Back to the game
      </button>
      <div className="eyebrow">A LIBRARY BUILT TO GROW</div>
      <h1 ref={focusRef} tabIndex={-1}>
        Someone <em>missing?</em>
      </h1>
      <p className="page-intro">
        Help us add a new possibility. Export a proposal, then submit it with a
        GitHub issue or pull request. Nothing is uploaded automatically.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          downloadProposal();
        }}
      >
        <label>
          Character type
          <select
            value={proposalCategory}
            onChange={(e) =>
              setProposalCategory(e.target.value as "real" | "fictional")
            }
          >
            <option value="fictional">Fictional character</option>
            <option value="real">Real public figure</option>
          </select>
        </label>
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
          Your download includes {historyCount} answers from this round. Review
          the file before sharing it. Suggest public figures or fictional
          characters, not private individuals.
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
            <a href={`${REPO}/issues/new`} target="_blank" rel="noreferrer">
              open a GitHub issue
            </a>{" "}
            to share it. It has not changed the catalog.
          </p>
        )}
      </form>
    </section>
  );
}
