import { Easing, useCurrentFrame } from "remotion";
import { ease, enterUp, mix, pop, popIn, ramp, shake } from "../anim";
import { Sfx } from "../audio";
import { DealCard, ODD_BLOOM, SampleNote, SceneHeader, Stage, Subline } from "../components/ui";
import { colors, GUTTER } from "../theme";

// The frame the card lands on: impact, shake, the hit in the sound.
const SLAM = 8;
const STAMP = 13;

// First second decides whether people keep watching: no empty frame, motion and the money from frame 0.
export const C00Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const fall = ramp(frame, 0, SLAM, Easing.in(Easing.quad));
  const settle = frame < SLAM ? 0 : Math.exp(-(frame - SLAM) / 5) * Math.cos((frame - SLAM) / 1.6);
  const { x, y } = shake(frame, SLAM);
  const stamp = pop(frame, STAMP);

  return (
    <Stage>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${x}px, ${y}px)` }}>
        <SceneHeader parts={[{ mark: "250 €" }, "für ein TikTok?"]} size={124} start={-6} />
        <DealCard
          deal={ODD_BLOOM}
          width={600}
          height={840}
          style={{
            position: "absolute",
            left: 240,
            top: 700,
            transform: `translateY(${mix(fall, -1500, 0)}px) rotate(${mix(fall, -24, -4) + settle * 3}deg) scale(${1 + settle * 0.05}, ${1 - settle * 0.05})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 640,
            padding: "14px 40px",
            borderRadius: 999,
            backgroundColor: colors.ink,
            color: colors.paper,
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: -3,
            boxShadow: "0 30px 60px rgba(7,7,7,0.35)",
            transform: `rotate(-8deg) scale(${mix(stamp, 2.6, 1)})`,
            opacity: Math.min(1, stamp * 3),
          }}
        >
          250 €
        </div>
        <div style={{ position: "absolute", top: 1600, left: GUTTER, right: GUTTER, textAlign: "center", ...enterUp(ease(frame, 36), 30) }}>
          <Subline style={{ fontSize: 46, color: colors.ink, fontWeight: 700 }}>So verdienst du mit deinen Posts.</Subline>
        </div>
      </div>
      <SampleNote />
      <Sfx name="swipe" at={0} volume={0.6} />
      <Sfx name="hit" at={SLAM} volume={0.9} />
      <Sfx name="stamp" at={STAMP} volume={0.7} />
      <Sfx name="coin" at={STAMP + 2} volume={0.35} />
    </Stage>
  );
};

export const HOOK_BLUR: [number, number][] = [[0, STAMP + 6]];
