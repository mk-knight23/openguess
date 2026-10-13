import { BookOpen, Sparkles, Globe2 } from "lucide-react";
export function FeatureStrip() {
  return (
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
  );
}
