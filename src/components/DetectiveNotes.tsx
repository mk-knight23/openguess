import { Eye } from "lucide-react";
import type { Answer, AnswerRecord, Candidate, Question } from "../types";
type Props = {
  explain: boolean;
  setExplain: (value: boolean) => void;
  next: { informationGain: number } | null;
  candidates: Candidate[];
  history: AnswerRecord[];
  questions: Question[];
  options: { value: Answer; label: string; key: string }[];
};
export function DetectiveNotes({
  explain,
  setExplain,
  next,
  candidates,
  history,
  questions,
  options,
}: Props) {
  return (
    <section className="explain-section">
      <button
        className="explain-toggle"
        aria-expanded={explain}
        onClick={() => setExplain(!explain)}
      >
        <Eye size={16} />
        {explain ? "Hide the detective notes" : "Peek inside the thinking"}
        <span>May reveal the answer</span>
      </button>
      {explain && (
        <div className="detective-notes">
          <div>
            <h3>Following the clues</h3>
            <p>
              Every answer adjusts a character’s weight. The next question
              separates the remaining possibilities. “Don’t know” adds no
              evidence.
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
                <meter
                  aria-label={`${c.character.name} relative weight`}
                  min="0"
                  max="1"
                  value={c.probability}
                />
                <span>{Math.round(c.probability * 100)}%</span>
              </div>
            ))}
            <p>
              Relative weights inside a limited catalog; not calibrated
              confidence.
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
  );
}
