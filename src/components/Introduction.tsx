import { Sparkles, ShieldCheck } from "lucide-react";
import { Orb } from "./Artwork";
export function Introduction() {
  return (
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
  );
}
