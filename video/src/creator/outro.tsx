import { Easing, useCurrentFrame } from "remotion";
import { IoCheckmarkCircle } from "react-icons/io5";
import { Sfx, SfxRepeat } from "../audio";
import { ease, enterUp, euro, mix, pop, popIn, ramp } from "../anim";
import { UrlPill } from "../components/shared-scenes";
import { Headline, Logo, SampleNote, SceneHeader, Stage, Subline } from "../components/ui";
import { colors, GUTTER } from "../theme";

// Final resting place of each piece: x, y, width, height, rotation.
const CONFETTI = [
  [120, 820, 20, 50, 30],
  [920, 760, 24, 60, -25],
  [200, 1560, 18, 44, 60],
  [880, 1620, 22, 54, -50],
  [60, 1180, 16, 40, -15],
  [990, 1150, 20, 48, 35],
  [520, 740, 18, 46, 80],
  [600, 1740, 20, 50, 10],
] as const;

// Frame the amount lands on: confetti and the success sound.
const PAYOUT_AT = 68;

const Row: React.FC<{ label: string; value: string; muted?: boolean; p: number }> = ({ label, value, muted, p }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36, color: muted ? colors.graphite : colors.ink, ...enterUp(p, 30) }}>
    <span>{label}</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);

export const C10Payout: React.FC = () => {
  const frame = useCurrentFrame();
  const amount = 225 * ramp(frame, 40, PAYOUT_AT, Easing.out(Easing.cubic));
  const burst = ease(frame, PAYOUT_AT, { damping: 16, stiffness: 120 });
  const drift = Math.max(0, frame - PAYOUT_AT);

  return (
    <Stage>
      <SceneHeader parts={["Du behältst", { mark: "90 %." }]} size={130} start={0} />
      {CONFETTI.map(([x, y, w, h, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: mix(burst, 540, x),
            top: mix(burst, 1150, y) + drift * 1.2,
            width: w,
            height: h,
            backgroundColor: i % 2 ? colors.stone : colors.ink,
            transform: `rotate(${r * burst + drift * (i % 2 ? 3 : -3)}deg)`,
            borderRadius: 3,
            opacity: burst > 0.01 ? 1 : 0,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: 820,
          left: GUTTER + 30,
          right: GUTTER + 30,
          padding: "56px 56px",
          borderRadius: 16,
          backgroundColor: colors.paper,
          boxShadow: "0 50px 100px rgba(7,7,7,0.18), 0 0 0 2px rgba(7,7,7,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 30,
          ...popIn(ease(frame, 6), 0.85),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 900 }}>
          <IoCheckmarkCircle size={48} /> Zahlung freigegeben
        </div>
        <Row label="Odd Bloom hat gezahlt" value="250,00 €" p={ease(frame, 16)} />
        <Row label="comtor-Gebühr (10 %)" value="−25,00 €" muted p={ease(frame, 24)} />
        <div style={{ height: 3, backgroundColor: colors.ink, transformOrigin: "left", transform: `scaleX(${ramp(frame, 32, 42)})` }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", ...enterUp(ease(frame, 38), 30) }}>
          <span style={{ fontSize: 40, fontWeight: 700 }}>Du bekommst</span>
          <span style={{ fontSize: 120, fontWeight: 900, letterSpacing: -3, transform: `scale(${1 + 0.06 * Math.max(0, 1 - Math.abs(frame - PAYOUT_AT - 3) / 6)})` }}>{euro(amount)}</span>
        </div>
      </div>
      <SampleNote />
      <Sfx name="tick" at={16} volume={0.3} />
      <Sfx name="tick" at={24} volume={0.3} />
      <SfxRepeat name="tick" from={40} to={PAYOUT_AT} every={3} volume={0.18} />
      <Sfx name="success" at={PAYOUT_AT} volume={0.8} />
      <Sfx name="coin" at={PAYOUT_AT} volume={0.35} />
    </Stage>
  );
};

export const C11Cta: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage dark>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center", ...enterUp(ease(frame, 2), 30) }}>
        <Logo size={80} dark />
      </div>
      <div style={{ position: "absolute", top: 640, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 70 }}>
        <Headline parts={["Wisch bezahlte Marken-Deals", { mark: "nach rechts." }]} size={120} align="center" dark start={6} style={{ letterSpacing: -3, lineHeight: 1.05 }} />
        <UrlPill style={popIn(pop(frame, 40), 0.6)} />
        <div style={enterUp(ease(frame, 52), 30)}>
          <Subline dark style={{ textAlign: "center" }}>
            Jetzt im Web · Bald für iOS & Android
          </Subline>
        </div>
      </div>
      <Sfx name="pop" at={40} volume={0.55} />
    </Stage>
  );
};
