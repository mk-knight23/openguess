import type { Character } from "../types";
export function Orb({ small = false }: { small?: boolean }) {
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
export function Avatar({ character }: { character: Character }) {
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
