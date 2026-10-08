import { Easing, useCurrentFrame } from "remotion";
import { mix, pop, ramp } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { Bed, GREY } from "../pinned/kit";
import { AddressPill, StoryNight, TopMark } from "./kit";

export const NUMBER_DURATION = 150;

const TRACK = 936;
const COUNT = [12, 54];

// Story, 5 s: "Du behältst 90 %" counts up with a bar filling in step; then Pro, then the address.
export const Number90: React.FC = () => {
  const frame = useCurrentFrame();
  const count = ramp(frame, COUNT[0], COUNT[1], Easing.out(Easing.cubic));
  const label = ramp(frame, 0, 12);
  const under = ramp(frame, 56, 68);
  const pro = pop(frame, 80);
  const small = ramp(frame, 94, 106);
  const button = pop(frame, 110);

  return (
    <StoryNight>
      <Bed file="music/creator-bed.mp3" duration={NUMBER_DURATION} volume={0.3} />
      <TopMark dark />

      <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", fontSize: 76, fontWeight: 900, color: GREY, opacity: label, transform: `translateY(${(1 - label) * 24}px)` }}>
        Du behältst
      </div>
      <div
        style={{
          position: "absolute",
          top: 500,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 360,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(90 * count)} %
      </div>
      <div style={{ position: "absolute", top: 880, left: 0, right: 0, textAlign: "center", fontSize: 72, fontWeight: 900, color: GREY, opacity: under, transform: `translateY(${(1 - under) * 20}px)` }}>
        von jedem Deal.
      </div>

      <div style={{ position: "absolute", top: 1040, left: (1080 - TRACK) / 2, width: TRACK, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)" }}>
        <div style={{ width: TRACK * 0.9 * count, height: "100%", borderRadius: 999, backgroundColor: "#fff" }} />
      </div>

      <div style={{ position: "absolute", top: 1140, left: 0, right: 0, textAlign: "center", fontSize: 84, fontWeight: 900, opacity: Math.min(1, pro * 2), transform: `translateY(${(1 - pro) * 40}px) scale(${mix(pro, 0.92, 1)})` }}>
        Mit Pro 97 %.
      </div>
      <div style={{ position: "absolute", top: 1260, left: 0, right: 0, textAlign: "center", fontSize: 38, color: GREY, opacity: small }}>Pro: für die ersten 100 Creator kostenlos.</div>

      <div style={{ position: "absolute", top: 1380, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, button * 2), transform: `scale(${mix(button, 0.7, 1)})` }}>
        <AddressPill dark size={48} />
      </div>

      <Sfx name="pop" at={2} volume={0.4} />
      <SfxRepeat name="tick" from={COUNT[0]} to={COUNT[1]} every={3} volume={0.3} />
      <Sfx name="ding" at={COUNT[1] + 2} volume={0.5} />
      <Sfx name="pop" at={80} volume={0.5} />
      <Sfx name="pop" at={110} volume={0.45} />
    </StoryNight>
  );
};
