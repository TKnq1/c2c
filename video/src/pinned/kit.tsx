import type { ReactNode } from "react";
import { AbsoluteFill, Html5Audio, interpolate, staticFile } from "remotion";
import { Img } from "remotion";
import { FONT } from "../theme";

// The pinned posts: the emails' night backdrop (public/email/band-mark.jpg in the app) with the mark huge behind
// everything, a headline in two tones (what it is in white, the rest in grey) and the app on an iPhone.

export const GREY = "#8a8a8a";
export const FPS = 30;

// Film grain over the dark, as in the emails and the launch video.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export const Night: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: "#0b0b0b", color: "#fff", fontFamily: FONT, overflow: "hidden" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 45%, #1d1d1d 0%, #0b0b0b 100%)" }} />
    <Img
      src={staticFile("logo.png")}
      style={{ position: "absolute", left: "50%", top: 780, width: 1640, height: 1640, transform: "translate(-50%, -50%)", filter: "invert(1)", opacity: 0.16 }}
    />
    <AbsoluteFill style={{ opacity: 0.22, mixBlendMode: "overlay", backgroundImage: GRAIN }} />
    {children}
  </AbsoluteFill>
);

// One line per entry; `grey` lines are the second tone.
export const TwoTone: React.FC<{ lines: { text: string; grey?: boolean }[]; size: number; top: number }> = ({ lines, size, top }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontSize: size, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
    {lines.map(({ text, grey }) => (
      <div key={text} style={{ whiteSpace: "nowrap", color: grey ? GREY : "#fff" }}>
        {text}
      </div>
    ))}
  </div>
);

export const SampleNote: React.FC = () => (
  <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", fontSize: 22, color: "#6f6f6f" }}>
    Beispiel: Marken, Preise und Bewertungen sind erfunden.
  </div>
);

// The video's music bed under the cover, faded out at the end.
export const Bed: React.FC<{ file: string; duration: number; volume?: number }> = ({ file, duration, volume = 0.35 }) => (
  <Html5Audio
    src={staticFile(file)}
    volume={(f) => volume * interpolate(f, [0, 6, duration - 20, duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
  />
);
