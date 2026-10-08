import type { CSSProperties, ReactNode } from "react";
import { IoCheckmark } from "react-icons/io5";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ease, mix, path, popIn, ramp } from "../anim";
import { Sfx } from "../audio";
import { SlotGrid } from "../components/founding";
import { Cursor, pressAt, UrlPill } from "../components/shared-scenes";
import { type HeadlinePart, Stage } from "../components/ui";
import { useFrame } from "../frame";
import { colors, GUTTER } from "../theme";

// Apple-style building blocks for the 15 s ads (ADS.md): one thought per screen, big centred type that resolves out
// of a blur, objects floating on soft shadows, nothing bouncy.

// Frames between two words of a reveal.
const WORD_STAGGER = 4;

export function revealLength(parts: HeadlinePart[]) {
  return parts.reduce((n, part) => n + (typeof part === "string" ? part.split(" ").length : 1), 0) * WORD_STAGGER;
}

// A word coming into focus: rises a little, fades in, unblurs.
export function focusIn(p: number, size: number): CSSProperties {
  return {
    opacity: Math.min(1, p * 1.3),
    transform: `translateY(${(1 - p) * size * 0.28}px)`,
    filter: p >= 0.99 ? undefined : `blur(${(1 - p) * 14}px)`,
  };
}

export const SOFT_SHADOW = "0 60px 120px rgba(7,7,7,0.14), 0 12px 30px rgba(7,7,7,0.06)";

// Centred headline, word by word from `start`. A mark is set in grey instead of an inverted bar: quieter, more Apple.
export const Reveal: React.FC<{
  parts: HeadlinePart[];
  size?: number;
  start?: number;
  dark?: boolean;
  align?: "center" | "left";
  style?: CSSProperties;
}> = ({ parts, size = 112, start = 0, dark, align = "center", style }) => {
  const frame = useFrame();
  let word = 0;
  const muted = dark ? colors.stone : colors.graphite;
  return (
    <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: -size * 0.035, textAlign: align, ...style }}>
      {parts.map((part, i) => {
        const text = typeof part === "string" ? part : part.mark;
        const color = typeof part === "string" ? undefined : muted;
        // Each part is its own line, so the grey mark never breaks mid-phrase.
        return (
          <div key={i}>
            {text.split(" ").map((w, j) => {
              const p = ease(frame, start + word++ * WORD_STAGGER, { stiffness: 90 });
              return (
                <span key={j}>
                  <span style={{ display: "inline-block", color, ...focusIn(p, size) }}>{w}</span>{" "}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Headline block at the top of a scene, inside the Reels safe area.
export const Title: React.FC<{ parts: HeadlinePart[]; sub?: ReactNode; size?: number; start?: number; top?: number; dark?: boolean }> = ({
  parts,
  sub,
  size = 100,
  start = 0,
  top = 250,
  dark,
}) => {
  const frame = useFrame();
  return (
    <div style={{ position: "absolute", top, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <Reveal parts={parts} size={size} start={start} dark={dark} />
      {sub && (
        <div style={{ fontSize: 42, lineHeight: 1.3, textAlign: "center", color: dark ? colors.stone : colors.graphite, ...focusIn(ease(frame, start + revealLength(parts) + 2), 42) }}>
          {sub}
        </div>
      )}
    </div>
  );
};

// A slow hover for floating objects.
export function hover(frame: number, phase = 0, amount = 8) {
  return Math.sin(frame / 22 + phase) * amount;
}

// White card on a soft shadow: the surface every UI element in the ads sits on.
export const Card: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div style={{ borderRadius: 28, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, ...style }}>{children}</div>
);

// Rises into place out of a blur, after `delay`.
export function floatIn(frame: number, delay: number, distance = 120): CSSProperties {
  const p = ease(frame, delay, { stiffness: 70 });
  return { opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * distance}px) scale(${mix(p, 0.94, 1)})`, filter: p >= 0.99 ? undefined : `blur(${(1 - p) * 10}px)` };
}

export const Check: React.FC<{ p: number; size?: number; dark?: boolean }> = ({ p, size = 56, dark }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: dark ? colors.paper : colors.ink,
      color: dark ? colors.ink : colors.paper,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transform: `scale(${p})`,
    }}
  >
    <IoCheckmark size={size * 0.62} />
  </span>
);

// The small "example data" note, kept clear of the Reels caption area.
export const Sample: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, textAlign: "center", fontSize: 22, color: dark ? colors.graphite : colors.stone }}>Beispieldaten</div>
);

// ---------------------------------------------------------------------------------------------------------------
// Black screens

const GRAIN_FRAMES = 6;

// Film grain over a black screen: six noise frames (scripts/make-grain.py), a new one every other frame.
export const Grain: React.FC<{ strength?: number }> = ({ strength = 0.9 }) => {
  const frame = useFrame();
  const i = Math.floor(frame / 2) % GRAIN_FRAMES;
  return (
    <AbsoluteFill
      style={{ backgroundImage: `url(${staticFile(`grain/g${i}.png`)})`, backgroundSize: "cover", mixBlendMode: "screen", opacity: strength, pointerEvents: "none" }}
    />
  );
};

// The logo mark, huge and faint behind everything, drifting slowly. It replaces the small logo of the first round.
export const BackdropLogo: React.FC<{ y?: number }> = ({ y = 880 }) => {
  const frame = useFrame();
  const size = 1500;
  return (
    <Img
      src={staticFile("logo.png")}
      style={{
        position: "absolute",
        left: (1080 - size) / 2 + Math.sin(frame / 40) * 18,
        top: y - size / 2 + Math.cos(frame / 47) * 14,
        width: size,
        height: size,
        filter: "invert(1) blur(1.5px)",
        mixBlendMode: "screen",
        opacity: 0.09,
        transform: `scale(${1 + frame / 1400}) rotate(${Math.sin(frame / 90) * 1.2}deg)`,
      }}
    />
  );
};

// A black scene as the ads use them: ink with a soft light in the middle, the logo behind, grain and a vignette on top.
export const DarkStage: React.FC<{ children: ReactNode; logoY?: number }> = ({ children, logoY }) => (
  <Stage dark>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(ellipse 75% 45% at 50% 42%, rgba(255,255,255,0.07), rgba(255,255,255,0) 70%)" }} />
    <BackdropLogo y={logoY} />
    {children}
    <Grain />
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />
  </Stage>
);

// ---------------------------------------------------------------------------------------------------------------
// Clicks

// A cursor route through [frame, x, y] keys (eased between them), for pointing, grabbing and clicking.
export function cursorAt(frame: number, keys: [number, number, number][]) {
  const frames = keys.map(([f]) => f);
  return { x: path(frame, frames, keys.map(([, x]) => x)), y: path(frame, frames, keys.map(([, , y]) => y)) };
}

// The ring that spreads from a click.
export const Ripple: React.FC<{ x: number; y: number; at: number; dark?: boolean }> = ({ x, y, at, dark }) => {
  const frame = useFrame();
  const t = ramp(frame, at, at + 14);
  if (t <= 0 || t >= 1) return null;
  const size = 30 + t * 130;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        border: `4px solid ${dark ? colors.paper : colors.ink}`,
        opacity: (1 - t) * 0.5,
        pointerEvents: "none",
        zIndex: 40,
      }}
    />
  );
};

export type Click = {
  // Frame of the click: the button gives way here, its state changes one frame later.
  at: number;
  // Centre of the button on the 1080 x 1920 frame; the cursor's tip lands exactly here.
  target: [number, number];
  // Frame the cursor has arrived (a few frames before the click).
  arrive: number;
  // Stops on the way to the target: [frame, x, y].
  via?: [number, number, number][];
};

export type ClickPlan = {
  from: [number, number];
  start: number;
  clicks: Click[];
  // The cursor leaves towards `away` after the last click and is gone by `gone`.
  away?: [number, number];
  gone?: number;
};

// The cursor's whole route over one or more clicks, and the feedback of each click, so cursor, buttons and results
// can't drift apart: `press[i]` is 1 around click i, `done[i]` is true from the frame after it.
export function useClicks(frame: number, { from, start, clicks, away, gone }: ClickPlan) {
  const last = clicks[clicks.length - 1];
  const end = gone ?? last.at + 16;
  const leave = away ?? [last.target[0] + 120, last.target[1] + 160];
  const keys: [number, number, number][] = [[start, from[0], from[1]]];
  for (const click of clicks) {
    keys.push(...(click.via ?? []), [click.arrive, click.target[0], click.target[1]], [click.at + 2, click.target[0], click.target[1]]);
  }
  keys.push([end, leave[0], leave[1]]);
  const { x, y } = cursorAt(frame, keys);
  return {
    x,
    y,
    opacity: ramp(frame, start, start + 6) * (1 - ramp(frame, end - 6, end)),
    press: clicks.map((click) => pressAt(frame, click.at)),
    done: clicks.map((click) => frame >= click.at + 1),
    clicks,
  };
}

// A cursor with the ripples of its clicks.
export const ClickCursor: React.FC<{ route: ReturnType<typeof useClicks>; dark?: boolean }> = ({ route, dark }) => (
  <>
    {route.clicks.map((click) => (
      <Ripple key={click.at} x={click.target[0]} y={click.target[1]} at={click.at} dark={dark} />
    ))}
    <Cursor x={route.x} y={route.y} pressed={Math.max(0, ...route.press)} opacity={route.opacity} />
  </>
);

// ---------------------------------------------------------------------------------------------------------------
// Shared scenes

// The turn: black with grain, one short line coming into focus, the logo big and faint behind it.
export function turnScene(parts: HeadlinePart[]): React.FC {
  const Turn: React.FC = () => (
    <DarkStage logoY={960}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: `0 ${GUTTER}px` }}>
        <Reveal parts={parts} size={132} dark start={2} />
      </div>
    </DarkStage>
  );
  return Turn;
}

// The payoff: white, the promise in huge type, an optional line under it.
export function payoffScene(parts: HeadlinePart[], sub?: string): React.FC {
  const Payoff: React.FC = () => {
    const frame = useFrame();
    return (
      <Stage>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, padding: `0 ${GUTTER}px 120px` }}>
          <Reveal parts={parts} size={150} start={0} />
          {sub && <div style={{ fontSize: 46, color: colors.graphite, textAlign: "center", ...focusIn(ease(frame, revealLength(parts) + 6), 46) }}>{sub}</div>}
        </div>
      </Stage>
    );
  };
  return Payoff;
}

export type Audience = "creator" | "brand";

const OFFER: Record<Audience, { slots: number; line: string; cell: number }> = {
  creator: { slots: 100, line: "Die ersten 100 Creator bekommen Pro kostenlos.", cell: 30 },
  brand: { slots: 50, line: "Die ersten 50 Marken bekommen Pro kostenlos.", cell: 44 },
};

// Offer and call to action in one: black, the logo, one line to act on, the URL, the founding places.
export function ctaScene(audience: Audience, parts: HeadlinePart[]): React.FC {
  const { slots, line, cell } = OFFER[audience];
  const Cta: React.FC = () => {
    const frame = useFrame();
    const gridAt = 30;
    const wave = (i: number) => {
      const offset = (i % 10) + Math.floor(i / 10);
      return Math.max(0, 1 - Math.abs(frame - 56 - offset * 1.4) / 5);
    };
    return (
      <DarkStage logoY={620}>
        <div style={{ position: "absolute", top: 380, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", alignItems: "center", gap: 64 }}>
          <Reveal parts={parts} size={118} dark start={4} />
          <UrlPill style={popIn(ease(frame, 22, { stiffness: 120 }), 0.85)} />
        </div>
        <div style={{ position: "absolute", top: 1180, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
          <SlotGrid slots={slots} cell={cell} gap={8} appear={(i) => ramp(frame, gridAt + i * (24 / slots), gridAt + i * (24 / slots) + 8)} glow={wave} />
          <div style={{ fontSize: 38, fontWeight: 700, textAlign: "center", ...focusIn(ease(frame, 40), 38) }}>{line}</div>
          <div style={{ fontSize: 30, color: colors.stone, ...focusIn(ease(frame, 48), 30) }}>Jetzt im Web · Bald für iOS & Android</div>
        </div>
        <Sfx name="pop" at={22} volume={0.45} />
        <Sfx name="swipe" at={56} volume={0.25} />
      </DarkStage>
    );
  };
  return Cta;
}

