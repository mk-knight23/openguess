import { useId } from "react";
import "./Genie.css";

export type GenieMood =
  "idle" | "thinking" | "confident" | "celebrate" | "stumped";

/** Original OpenGuess companion. Decorative; its state is described by the game UI. */
export function Genie({
  mood = "idle",
  reducedMotion = false,
  theme,
}: {
  mood?: GenieMood;
  reducedMotion?: boolean;
  theme?: string;
}) {
  const id = useId().replace(/:/g, "");
  const thinking = mood === "thinking";
  const surprised = mood === "stumped";
  const happy = mood === "celebrate" || mood === "confident";
  return (
    <div
      className={`genie-art genie-${mood}${reducedMotion ? " genie-still" : ""}`}
      data-theme={theme}
      aria-hidden="true"
    >
      <svg viewBox="0 0 400 600" focusable="false">
        <defs>
          <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#286eae" />
            <stop offset=".5" stopColor="#164d84" />
            <stop offset="1" stopColor="#0e365e" />
          </linearGradient>
          <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e6ae72" />
            <stop offset="1" stopColor="#bc754b" />
          </linearGradient>
          <linearGradient id={`${id}-smoke`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#5ec7df" stopOpacity=".8" />
            <stop offset="1" stopColor="#b9edf4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-gold`}>
            <stop stopColor="#ffe4a0" />
            <stop offset=".45" stopColor="#edb347" />
            <stop offset="1" stopColor="#c88328" />
          </linearGradient>
        </defs>
        <ellipse
          className="genie-shadow"
          cx="197"
          cy="555"
          rx="86"
          ry="12"
          fill="#17618b"
          opacity=".15"
        />
        <g className="genie-sparkles" fill="#fff1b9">
          <path d="m63 204 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" />
          <path d="m326 153 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
          <path d="m304 429 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" />
          <circle cx="92" cy="403" r="3" />
          <circle cx="285" cy="74" r="3" />
        </g>
        <g className="genie-float">
          <path
            className="genie-mist"
            d="M166 414c-51 54 75 59 45 91-14 16-55 7-47 28 8 22 56 18 71 7-36 8-46-6-20-20 65-35 58-75 29-105Z"
            fill={`url(#${id}-smoke)`}
          />
          <path
            d="M132 290c-18 39-15 99 8 130 19 28 55 22 71 45 10 13 5 26-7 36 30-12 57-36 51-64-3-17 21-43 18-88-1-22-7-44-16-59Z"
            fill={`url(#${id}-coat)`}
          />
          <path
            d="M150 318c-7 37-6 64 9 90 10 15 35 15 48 29"
            fill="none"
            stroke="#5993b8"
            strokeWidth="5"
            opacity=".5"
          />
          <g className="genie-arm genie-arm-left">
            <path
              d="M143 289c-29-16-45 0-47 27l-7 54c-1 20 20 29 37 16l36-37-22-25-17 18 8-30"
              fill={`url(#${id}-coat)`}
              stroke="#103858"
              strokeWidth="3"
            />
            <path d="m138 323 26 24-16 15-26-24Z" fill={`url(#${id}-gold)`} />
            <path
              d="M157 344c12-7 35-8 42-19l-2-9c-3-4-8-3-10 1l-5 7 1-28c0-9-11-10-12-1l-2 24-6-15c-4-7-12-3-9 4l6 15-10 8Z"
              fill={`url(#${id}-skin)`}
              stroke="#925c3e"
              strokeWidth="2"
            />
          </g>
          <g className="genie-arm genie-arm-right">
            <path
              d="M247 285c23-7 38 11 44 34l19 50c9 24-12 41-32 27l-42-34 17-30 29 23-15-37"
              fill={`url(#${id}-coat)`}
              stroke="#103858"
              strokeWidth="3"
            />
            <path d="m232 338 28-7 6 27-29 7Z" fill={`url(#${id}-gold)`} />
            <path
              d={
                thinking
                  ? "M249 341c-6-13-21-26-24-40l5-19c2-7 11-5 10 1l-1 14 13 9 8 17-1 17Z"
                  : "M239 339c-10-2-21-7-27-15-6-9-14-4-9 4l8 10-27-6c-9-2-11 8-3 11l26 7-17 2c-8 1-7 11 1 11l30-4 19-2Z"
              }
              fill={`url(#${id}-skin)`}
              stroke="#925c3e"
              strokeWidth="2"
            />
          </g>
          <path
            d="M171 266v25c14 19 39 18 54 0v-29"
            fill={`url(#${id}-skin)`}
          />
          <path
            d="m161 279 38 25 36-25 18 17-19 32-35-16-36 16-18-31Z"
            fill="#f8e9cb"
          />
          <path d="m198 310-4 111" stroke="#e9b451" strokeWidth="5" />
          <circle cx="199" cy="341" r="5" fill="#ffd877" />
          <circle cx="197" cy="371" r="5" fill="#ffd877" />
          <ellipse cx="141" cy="219" rx="12" ry="22" fill="#bd7b50" />
          <ellipse cx="255" cy="219" rx="12" ry="22" fill="#bd7b50" />
          <path
            d="M142 166c4-42 104-48 112 1l-5 72c-2 31-23 51-51 51-28 0-50-20-53-51Z"
            fill={`url(#${id}-skin)`}
            stroke="#925c3e"
            strokeWidth="2"
          />
          <path
            d="M145 186c-2-15-3-26 6-35l9 33-4 24-11-8Zm100 0c3-16 4-26-5-35l-10 33 5 25 10-9Z"
            fill="#27323e"
          />
          <g className="genie-eyes">
            <path
              d="M158 211c7-10 20-11 28-2-4 13-21 15-28 2Zm53-2c8-9 21-8 28 2-7 13-24 11-28-2Z"
              fill="#fff8e8"
            />
            <ellipse
              cx={thinking ? 180 : 177}
              cy="210"
              rx="4.5"
              ry="6"
              fill="#253841"
            />
            <ellipse
              cx={thinking ? 231 : 222}
              cy="210"
              rx="4.5"
              ry="6"
              fill="#253841"
            />
            <circle cx="176" cy="208" r="1.5" fill="white" />
            <circle cx="221" cy="208" r="1.5" fill="white" />
          </g>
          <g fill="none" stroke="#29313b" strokeWidth="6" strokeLinecap="round">
            <path
              d={
                surprised
                  ? "m158 192 25-4"
                  : thinking
                    ? "m158 193 25 5"
                    : "M158 195q13-9 25-1"
              }
            />
            <path
              d={
                surprised
                  ? "m214 188 25 4"
                  : thinking
                    ? "m214 190 25 5"
                    : "M214 194q13-8 25 1"
              }
            />
          </g>
          <path
            d="m194 216-5 18q9 7 18 0"
            fill="none"
            stroke="#a56b43"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M198 240c-10-11-21-4-28 5 11 7 22 5 28-1 6 6 18 8 29 1-8-9-19-16-29-5Z"
            fill="#27323e"
          />
          {surprised ? (
            <ellipse cx="198" cy="257" rx="7" ry="9" fill="#6c3e31" />
          ) : (
            <path
              d={happy ? "M180 255q18 24 36 0Z" : "M181 257q17 13 34-2"}
              fill={happy ? "#fff5df" : "none"}
              stroke="#7d4434"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
          <path d="M183 278q15 19 30 0l-9 19h-13Z" fill="#27323e" />
          <path
            d="M133 171c-17-25-7-66 24-78 20-8 60-7 83 2 29 12 41 47 22 77-38-21-89-23-129-1Z"
            fill="#fff9ec"
            stroke="#d7d4c6"
            strokeWidth="3"
          />
          <path
            d="M133 153c36-31 76-43 117-41M135 132c35 0 70 9 113 42M156 97c-3 23 10 42 26 57"
            fill="none"
            stroke="#e4e2d6"
            strokeWidth="7"
          />
          <path
            d="M137 169c38-18 75-20 122 1l-2 12c-40-18-80-18-117 0Z"
            fill={`url(#${id}-gold)`}
            stroke="#bb822f"
            strokeWidth="2"
          />
          <path
            d="M198 150c-5-31 3-53 19-75-4 23 11 44 1 65"
            fill="#2eafbf"
            stroke="#187c98"
            strokeWidth="2"
          />
          <path d="m209 83-7 68" stroke="#b5e7dd" strokeWidth="2" />
          <path
            d="m198 150 13 15-13 18-13-18Z"
            fill="#38b9c8"
            stroke="#ffe2a2"
            strokeWidth="5"
          />
        </g>
      </svg>
    </div>
  );
}
