import type { Character } from "../types";

export function Avatar({ character }: { character: Character }) {
  const hex = character.color.replace("#", "");
  const channels = [0, 2, 4].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  const luminance =
    0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return (
    <div
      className="avatar"
      style={{
        background: character.color,
        color: luminance > 0.179 ? "#000000" : "#ffffff",
      }}
      aria-hidden="true"
    >
      {character.initials}
    </div>
  );
}
