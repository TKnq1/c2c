import type { ReactNode } from "react";
import { Easing, useCurrentFrame } from "remotion";
import { IoCheckmark } from "react-icons/io5";
import { ease, enterUp, pop, popIn, ramp } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { UrlPill } from "../components/shared-scenes";
import { Headline, Logo, Stage, Subline } from "../components/ui";
import { colors, GUTTER } from "../theme";

// All 50 founding places, all still free.
const SLOTS = 50;

// `appear` gives each square's entrance (0..1), `glow` a brief light-up (0..1); without them the grid is static.
const SlotGrid: React.FC<{ cell: number; gap: number; appear?: (i: number) => number; glow?: (i: number) => number; pulse?: number }> = ({
  cell,
  gap,
  appear = () => 1,
  glow = () => 0,
  pulse = 1,
}) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(10, ${cell}px)`, gap }}>
    {Array.from({ length: SLOTS }, (_, i) => (
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

const COUNT = [4, 34] as const;
const GRID_FROM = 36;
const WAVE_AT = 80;
const PRO_AT = 108;
const PERKS_AT = [118, 126, 134];
const STRIKE_AT = 142;
const ZERO_AT = 152;

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

export const B08Founding: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(50 * ramp(frame, COUNT[0], COUNT[1], Easing.out(Easing.cubic)));
  const strike = ramp(frame, STRIKE_AT, STRIKE_AT + 8);
  const zero = pop(frame, ZERO_AT);

  return (
    <Stage dark>
      <div style={{ position: "absolute", top: 170, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 220, fontWeight: 900, lineHeight: 0.95, letterSpacing: -8, ...popIn(ease(frame, 0, { stiffness: 140 }), 0.8) }}>{count} Plätze</div>
        <Headline parts={["für", { mark: "Founding Brands." }]} size={84} dark start={30} />
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <SlotGrid cell={78} gap={16} appear={(i) => pop(frame, GRID_FROM + i * 0.7)} glow={(i) => wave(frame, WAVE_AT, i)} />
      </div>
      <div style={{ position: "absolute", top: 1150, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 34 }}>
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, ...enterUp(ease(frame, PRO_AT), 40) }}>Pro kostenlos. Solange dein Konto besteht.</div>
        <Perk p={ease(frame, PERKS_AT[0])}>
          <b>3 %</b> statt 10 % Gebühr auf jede Zahlung
        </Perk>
        <Perk p={ease(frame, PERKS_AT[1])}>
          <span style={{ position: "relative", color: strike > 0.5 ? colors.graphite : colors.paper }}>
            49 € im Monat
            <span style={{ position: "absolute", left: -4, right: -4, top: "52%", height: 4, backgroundColor: colors.graphite, transformOrigin: "left", transform: `scaleX(${strike})` }} />
          </span>{" "}
          <b style={{ display: "inline-block", transform: `scale(${zero})`, opacity: Math.min(1, zero * 2) }}>0 €</b>
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

export const B09Cta: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage dark>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center", ...enterUp(ease(frame, 2), 30) }}>
        <Logo size={80} dark />
      </div>
      <div style={{ position: "absolute", top: 560, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 70 }}>
        <Headline parts={["Sichere dir", { mark: "deinen Platz." }]} size={130} align="center" dark start={6} style={{ letterSpacing: -3, lineHeight: 1.05 }} />
        <UrlPill style={popIn(pop(frame, 40), 0.6)} />
        <div style={enterUp(ease(frame, 52), 30)}>
          <Subline dark style={{ textAlign: "center" }}>
            Die ersten 50 Marken bekommen Pro kostenlos.
          </Subline>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, ...enterUp(ease(frame, 60), 40) }}>
          <SlotGrid cell={44} gap={10} pulse={0.55 + 0.45 * Math.sin(frame / 8)} />
        </div>
      </div>
      <Sfx name="pop" at={40} volume={0.55} />
    </Stage>
  );
};
