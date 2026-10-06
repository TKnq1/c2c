import { useCurrentFrame } from "remotion";
import { ease, enterUp, pop, popIn } from "../anim";
import { Sfx } from "../audio";
import { FoundingScene, SlotGrid } from "../components/founding";
import { UrlPill } from "../components/shared-scenes";
import { Headline, Logo, Stage, Subline } from "../components/ui";
import { GUTTER } from "../theme";

export const B08Founding: React.FC = () => (
  <FoundingScene
    slots={50}
    who="Founding Brands"
    cell={78}
    gap={16}
    feePerk={
      <>
        <b>3 %</b> statt 10 % Gebühr auf jede Zahlung
      </>
    }
  />
);

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
          <SlotGrid slots={50} cell={44} gap={10} pulse={0.55 + 0.45 * Math.sin(frame / 8)} />
        </div>
      </div>
      <Sfx name="pop" at={40} volume={0.55} />
    </Stage>
  );
};
