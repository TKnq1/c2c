import { useCurrentFrame } from "remotion";
import { mix, pop, ramp } from "../anim";
import { Sfx } from "../audio";
import { Bed } from "../pinned/kit";
import { StoryExample } from "./kit";
import { Card, Frame, NAKAR_DEAL, NOTE, RAW_DEAL, VINTAGE_DEAL } from "./Intro";

export const INTRO_TITLE_DURATION = 180;

// Card 1 of the highlight, 6 s: "Was ist comtor?" comes in word by word, the line under it rises, then the three deals
// slide up and fan out. It ends on the picture the still version showed.
export const IntroTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const word = (delay: number) => {
    const p = pop(frame, delay);
    return { display: "inline-block", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 70}px) scale(${mix(p, 0.85, 1)})` } as const;
  };
  const sub = ramp(frame, 40, 54);
  const card = (delay: number) => {
    const p = pop(frame, delay);
    return { position: "absolute", inset: 0, opacity: Math.min(1, p * 3), transform: `translateY(${(1 - p) * 900}px)` } as const;
  };
  const note = ramp(frame, 112, 126);

  return (
    <Frame>
      <Bed file="music/creator-bed.mp3" duration={INTRO_TITLE_DURATION} volume={0.3} />

      <div style={{ position: "absolute", top: 420, left: 0, right: 0, textAlign: "center", fontSize: 156, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.035em" }}>
        <div>
          <span style={word(6)}>Was</span> <span style={word(13)}>ist</span>
        </div>
        <div>
          <span style={word(21)}>comtor?</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: 790, left: 0, right: 0, textAlign: "center", fontSize: 62, fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.035em", color: "#737373", opacity: sub, transform: `translateY(${(1 - sub) * 30}px)` }}>
        Der Marktplatz für
        <br />
        Marken und Creator.
      </div>

      <div style={card(80)}>
        <Card deal={VINTAGE_DEAL} x={320} y={1290} rotate={-9} scale={1.25} />
      </div>
      <div style={card(88)}>
        <Card deal={NAKAR_DEAL} x={760} y={1290} rotate={9} scale={1.25} />
      </div>
      <div style={card(70)}>
        <Card deal={RAW_DEAL} x={540} y={1270} rotate={0} scale={1.35} />
      </div>

      <div style={{ opacity: note }}>
        <StoryExample>{NOTE}</StoryExample>
      </div>

      <Sfx name="pop" at={6} volume={0.45} />
      <Sfx name="pop" at={13} volume={0.45} />
      <Sfx name="pop" at={21} volume={0.5} />
      <Sfx name="whoosh" at={66} volume={0.4} />
      <Sfx name="swipe" at={72} volume={0.4} />
      <Sfx name="swipe" at={80} volume={0.35} />
      <Sfx name="swipe" at={88} volume={0.35} />
      <Sfx name="ding" at={104} volume={0.45} />
    </Frame>
  );
};
