import type { ReactNode } from "react";
import { Easing } from "remotion";
import { useFrame } from "../frame";
import { IoCheckmark } from "react-icons/io5";
import { ease, enterUp, pop, popIn, ramp } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { colors, GUTTER } from "../theme";
import { Headline, Stage } from "./ui";

// The app's Pro price (src/lib/constants.ts, PRO_SUBSCRIPTION_PRICE_CENTS), struck out in the founding offer.
export const PRO_PRICE_LABEL = "10 € im Monat";

// The founding places, all still free: ten to a row. `appear` gives each square's entrance (0..1), `glow` a brief
// light-up (0..1); without them the grid is static.
export const SlotGrid: React.FC<{
  slots: number;
  cell: number;
  gap: number;
  appear?: (i: number) => number;
  glow?: (i: number) => number;
  pulse?: number;
}> = ({ slots, cell, gap, appear = () => 1, glow = () => 0, pulse = 1 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(10, ${cell}px)`, gap }}>
    {Array.from({ length: slots }, (_, i) => (
      <div key={i} style={{ width: cell, height: cell, position: "relative", ...popIn(appear(i), 0.3) }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 4, border: `3px solid ${colors.graphite}`, opacity: pulse }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 4, backgroundColor: colors.paper, opacity: glow(i) * 0.9 }} />
      </div>
    ))}
  </div>
);

// A light wave running across the grid, diagonally from the top left, peaking at `at` for the first square.
function wave(frame: number, at: number, i: number) {
  const offset = (i % 10) + Math.floor(i / 10);
  return Math.max(0, 1 - Math.abs(frame - at - offset * 1.6) / 5);
}

const Perk: React.FC<{ p: number; children: ReactNode }> = ({ p, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 40, ...enterUp(p, 30) }}>
    <span
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        backgroundColor: colors.paper,
        color: colors.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: `scale(${p})`,
      }}
    >
      <IoCheckmark size={34} />
    </span>
    <span>{children}</span>
  </div>
);

const COUNT = [4, 34] as const;
const GRID_FROM = 36;
const WAVE_AT = 80;
const PRO_AT = 108;
const PERKS_AT = [118, 126, 134];
const STRIKE_AT = 142;
const ZERO_AT = 152;

// "N Plätze für Founding …": the places count up, the grid builds, a light wave runs over it, then what the
// place gets. Same scene for brands (50) and creators (100); only the numbers and the first perk differ.
export const FoundingScene: React.FC<{
  slots: number;
  who: string;
  // First perk line, e.g. the fee.
  feePerk: ReactNode;
  cell: number;
  gap: number;
}> = ({ slots, who, feePerk, cell, gap }) => {
  const frame = useFrame();
  const count = Math.round(slots * ramp(frame, COUNT[0], COUNT[1], Easing.out(Easing.cubic)));
  const strike = ramp(frame, STRIKE_AT, STRIKE_AT + 8);
  const zero = pop(frame, ZERO_AT);
  const gridTop = 640;
  const rows = Math.ceil(slots / 10);
  const perksTop = gridTop + rows * cell + (rows - 1) * gap + 80;
  // Bigger grids build a little faster per square, so both finish at about the same time.
  const stagger = 35 / slots;

  return (
    <Stage dark>
      <div style={{ position: "absolute", top: 170, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Three digits need a smaller size to stay on one line. */}
        <div
          style={{
            fontSize: slots >= 100 ? 186 : 220,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -8,
            whiteSpace: "nowrap",
            ...popIn(ease(frame, 0, { stiffness: 140 }), 0.8),
          }}
        >
          {count} Plätze
        </div>
        <Headline parts={["für", { mark: `${who}.` }]} size={84} dark start={30} />
      </div>
      <div style={{ position: "absolute", top: gridTop, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <SlotGrid slots={slots} cell={cell} gap={gap} appear={(i) => pop(frame, GRID_FROM + i * stagger)} glow={(i) => wave(frame, WAVE_AT, i)} />
      </div>
      <div style={{ position: "absolute", top: perksTop, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, ...enterUp(ease(frame, PRO_AT), 40) }}>Pro kostenlos. Solange dein Konto besteht.</div>
        <Perk p={ease(frame, PERKS_AT[0])}>{feePerk}</Perk>
        <Perk p={ease(frame, PERKS_AT[1])}>
          <span style={{ position: "relative", color: strike > 0.5 ? colors.graphite : colors.paper }}>
            {PRO_PRICE_LABEL}
            <span
              style={{
                position: "absolute",
                left: -4,
                right: -4,
                top: "52%",
                height: 4,
                backgroundColor: colors.graphite,
                transformOrigin: "left",
                transform: `scaleX(${strike})`,
              }}
            />
          </span>{" "}
          <b style={{ display: "inline-block", marginLeft: 12, transform: `scale(${zero})`, opacity: Math.min(1, zero * 2) }}>0 €</b>
        </Perk>
        <Perk p={ease(frame, PERKS_AT[2])}>Kein Abo, nichts zu kündigen</Perk>
      </div>
      <SfxRepeat name="tick" from={COUNT[0]} to={COUNT[1]} every={2} volume={0.18} />
      <Sfx name="swipe" at={WAVE_AT} volume={0.35} />
      <Sfx name="success" at={PRO_AT} volume={0.6} />
      {PERKS_AT.map((at) => (
        <Sfx key={at} name="pop" at={at} volume={0.35} />
      ))}
      <Sfx name="strike" at={STRIKE_AT} volume={0.55} />
      <Sfx name="pop" at={ZERO_AT} volume={0.5} />
    </Stage>
  );
};
