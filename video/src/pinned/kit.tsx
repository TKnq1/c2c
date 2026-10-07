import type { ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FONT } from "../theme";

// The pinned posts: App Store style on plain black. A headline in two tones (what it is in white, the rest in
// grey), the app's screen without a phone around it, one piece of it lifted out.

export const GREY = "#8a8a8a";

export const Black: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: "#000", color: "#fff", fontFamily: FONT, overflow: "hidden" }}>{children}</AbsoluteFill>
);

export const Wordmark: React.FC<{ top?: number }> = ({ top = 76 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
    <Img src={staticFile("logo.png")} style={{ width: 44, height: 44, filter: "invert(1)", mixBlendMode: "screen" }} />
    <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -0.6 }}>comtor</span>
  </div>
);

// One line per entry; `grey` lines are the second tone.
export const TwoTone: React.FC<{ lines: { text: string; grey?: boolean }[]; size: number; top: number }> = ({ lines, size, top }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontSize: size, fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.035em" }}>
    {lines.map(({ text, grey }) => (
      <div key={text} style={{ whiteSpace: "nowrap", color: grey ? GREY : "#fff" }}>
        {text}
      </div>
    ))}
  </div>
);
