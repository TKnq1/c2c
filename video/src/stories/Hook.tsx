import { Easing, useCurrentFrame } from "remotion";
import { mix, pop, ramp } from "../anim";
import { Sfx } from "../audio";
import { colors } from "../theme";
import { Bed, GREY } from "../pinned/kit";
import { AddressPill, StoryNight, TopMark } from "./kit";

export const HOOK_DURATION = 180;

// The three messages every creator knows; two get crossed out, then they all fall out of the frame.
const DMS = [
  { text: "Was kostet ein Post bei dir?", tilt: -2, in: 14, strike: 74 },
  { text: "Bezahlung dann nach dem Post?", tilt: 1.5, in: 28, strike: 86 },
  { text: "Schick mal deine Mediadaten.", tilt: -1, in: 42 },
];

const FALL = 104;
const HEAD = 118;

// Story, 6 s: the DMs pile up, get struck out and fall; "Schluss mit Preis-DMs." lands in their place.
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const intro = ramp(frame, 0, 12) * (1 - ramp(frame, FALL - 8, FALL + 2));
  const lead = pop(frame, HEAD - 6);
  const head = pop(frame, HEAD + 4);
  const sub = ramp(frame, 142, 154);
  const button = pop(frame, 156);

  return (
    <StoryNight>
      <Bed file="music/creator-bed.mp3" duration={HOOK_DURATION} volume={0.3} />
      <TopMark dark />

      <div style={{ position: "absolute", top: 410, left: 0, right: 0, textAlign: "center", fontSize: 60, fontWeight: 900, color: GREY, opacity: intro }}>Kennst du das?</div>

      <div style={{ position: "absolute", top: 560, left: 72, right: 72, display: "flex", flexDirection: "column", gap: 48 }}>
        {DMS.map((dm, i) => {
          const strike = dm.strike === undefined ? 0 : ramp(frame, dm.strike, dm.strike + 8);
          const fall = ramp(frame, FALL + i * 5, FALL + 26 + i * 5, Easing.in(Easing.quad));
          const appear = pop(frame, dm.in);
          return (
            <div
              key={dm.text}
              style={{
                position: "relative",
                alignSelf: "flex-start",
                opacity: mix(strike, 1, 0.5),
                transformOrigin: "left center",
                transform: `translateY(${fall * 1500}px) rotate(${dm.tilt + fall * (i % 2 ? 25 : -25)}deg) scale(${mix(appear, 0.5, 1)})`,
              }}
            >
              <div
                style={{
                  opacity: Math.min(1, appear * 2),
                  padding: "28px 40px",
                  borderRadius: 34,
                  borderBottomLeftRadius: 8,
                  backgroundColor: colors.fog,
                  color: colors.ink,
                  fontSize: 46,
                  lineHeight: 1.3,
                }}
              >
                {dm.text}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: -20,
                  right: -20,
                  top: "50%",
                  height: 8,
                  backgroundColor: colors.ink,
                  transformOrigin: "left center",
                  transform: `rotate(-3deg) scaleX(${strike})`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.02 }}>
        <div style={{ fontSize: 110, color: GREY, opacity: Math.min(1, lead * 2), transform: `translateY(${(1 - lead) * 50}px)` }}>Schluss mit</div>
        <div style={{ fontSize: 160, opacity: Math.min(1, head * 2), transform: `translateY(${(1 - head) * 70}px) scale(${mix(head, 0.9, 1)})` }}>Preis-DMs.</div>
      </div>

      <div style={{ position: "absolute", top: 940, left: 0, right: 0, textAlign: "center", fontSize: 56, lineHeight: 1.25, color: GREY, opacity: sub, transform: `translateY(${(1 - sub) * 24}px)` }}>
        Das Budget steht vorab
        <br />
        auf der Deal-Karte.
      </div>

      <div style={{ position: "absolute", top: 1200, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, button * 2), transform: `scale(${mix(button, 0.7, 1)})` }}>
        <AddressPill dark size={56} />
      </div>

      {DMS.map((dm) => (
        <Sfx key={dm.text} name="pop" at={dm.in} volume={0.45} />
      ))}
      {DMS.map((dm) => dm.strike !== undefined && <Sfx key={dm.text} name="strike" at={dm.strike} volume={0.6} />)}
      <Sfx name="swipe" at={FALL} volume={0.45} />
      <Sfx name="hit" at={HEAD + 4} volume={0.55} />
      <Sfx name="ding" at={156} volume={0.5} />
    </StoryNight>
  );
};
