import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { focusIn } from "../ads/kit";
import { Sfx, type SfxName } from "../audio";
import { useFrame } from "../frame";
import { colors } from "../theme";
import { Caret, type Part, slamStyle, spr } from "./kit";

// Pieces the launch video's scenes share: typed lines, words slamming or coming into focus, key sounds.

// The caret is solid while typing and blinks while the line stands.
export function caretOn(frame: number, idleFrom: number) {
  return frame < idleFrom || Math.floor((frame - idleFrom) / 14) % 2 === 0;
}

const KEYS: SfxName[] = ["key-1", "key-2", "key-3"];

// A key click at each of `times` (a line's typingTimes), a little uneven in volume like real typing.
export const Keys: React.FC<{ times: number[]; del?: boolean; volume?: number }> = ({ times, del, volume = 0.55 }) => (
  <>
    {times.map((at, k) => (
      <Sfx key={k} name={del ? "key-del" : KEYS[(k * 7 + 3) % 3]} at={at} volume={volume * (0.65 + 0.35 * Math.abs(Math.sin(k * 2.7 + 0.4)))} />
    ))}
  </>
);

function words(parts: Part[]) {
  return parts.flatMap((part) => part.text.split(" ").filter(Boolean).map((text) => ({ ...part, text })));
}

// Words that slam in one after another from `start`, each a little sooner than the last (`accel`), alternating how
// far out of scale they come from, so the line lands with a rhythm instead of a metronome.
export const SlamWords: React.FC<{
  parts: Part[];
  size: number;
  start: number;
  stagger?: number;
  accel?: number;
  from?: number;
  dark?: boolean;
  gap?: number;
  fade?: (i: number) => number;
}> = ({ parts, size, start, stagger = 6, accel = 0.35, from = 1.8, dark, gap = 0.25, fade }) => {
  const frame = useFrame();
  const list = words(parts);
  let at = start;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * gap, fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.03 }}>
      {list.map((w, i) => {
        const p = spr(frame, at, "land");
        at += stagger * (1 - (accel * i) / Math.max(1, list.length));
        const style = slamStyle(p, i % 2 ? from * 0.8 : from * 1.15, 26);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontWeight: w.bold === false ? 400 : 900,
              color: w.soft ? (dark ? colors.graphite : colors.stone) : undefined,
              ...style,
              ...(fade ? { opacity: (style.opacity as number) * fade(i) } : {}),
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

// Words coming into focus one after another from `start`. With `limit`, only the words that have started take up
// room, so the line grows as it is written (the camera can fit it).
export const FocusWords: React.FC<{ parts: Part[]; size: number; start: number; stagger?: number; dark?: boolean; spacing?: number; limit?: boolean; style?: CSSProperties }> = ({
  parts,
  size,
  start,
  stagger = 4,
  dark,
  spacing = 0,
  limit,
  style,
}) => {
  const frame = useFrame();
  const all = words(parts);
  const list = limit ? all.slice(0, Math.max(1, Math.floor((frame - start) / stagger) + 1)) : all;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * (0.25 + spacing), fontSize: size, lineHeight: 1.1, letterSpacing: -size * 0.03 + spacing * size * 0.1, ...style }}>
      {list.map((w, i) => (
        <span key={i} style={{ display: "inline-block", fontWeight: w.bold === false ? 400 : 900, color: w.soft ? (dark ? colors.graphite : colors.stone) : undefined, ...focusIn(spr(frame, start + i * stagger, i % 2 ? "land" : "snap"), size) }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

// A line with a selected range [from, to), the selection drawn like the reference's highlighted word.
export const Typed: React.FC<{ text: string; size: number; select?: [number, number]; caret: boolean; dark?: boolean }> = ({ text, size, select, caret, dark }) => {
  const [a, b] = select ?? [text.length, text.length];
  return (
    <div style={{ fontSize: size, letterSpacing: -size * 0.015, whiteSpace: "pre", display: "flex", alignItems: "center", lineHeight: 1.2 }}>
      <span>{text.slice(0, a)}</span>
      {b > a && <span style={{ backgroundColor: dark ? colors.paper : colors.ink, color: dark ? colors.ink : colors.paper, borderRadius: size * 0.06 }}>{text.slice(a, b)}</span>}
      <span>{text.slice(b)}</span>
      {b <= a && <Caret size={size} on={caret} />}
    </div>
  );
};

// A full-frame layer, for stacking pieces of a scene.
export const Layer: React.FC<{ style?: CSSProperties; children: ReactNode }> = ({ style, children }) => <AbsoluteFill style={style}>{children}</AbsoluteFill>;

export function last(list: number[]) {
  return list[list.length - 1];
}
