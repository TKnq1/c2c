import { AbsoluteFill, Sequence } from "remotion";
import { ramp } from "../anim";
import { useFrame } from "../frame";
import { LAUNCH_SCENES } from "./scenes";

// The launch video (LAUNCH.md), 16:9: the scenes end to end, each one fading in out of a blur over the last
// frames of the one before. No sound yet; this is the cut to judge the picture by.
const OVERLAP = 10;

const STARTS = LAUNCH_SCENES.reduce<number[]>((starts, scene, i) => [...starts, i === 0 ? 0 : starts[i - 1] + LAUNCH_SCENES[i - 1].duration - OVERLAP], []);

export const LAUNCH_DURATION = STARTS[STARTS.length - 1] + LAUNCH_SCENES[LAUNCH_SCENES.length - 1].duration;

const FadeIn: React.FC<{ first: boolean; children: React.ReactNode }> = ({ first, children }) => {
  const frame = useFrame();
  const p = first ? 1 : ramp(frame, 0, OVERLAP);
  return <AbsoluteFill style={{ opacity: p, filter: p >= 1 ? undefined : `blur(${(1 - p) * 16}px)` }}>{children}</AbsoluteFill>;
};

export const LaunchVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#070707" }}>
    {LAUNCH_SCENES.map(({ id, component: Scene, duration }, i) => (
      <Sequence key={id} from={STARTS[i]} durationInFrames={duration} name={id}>
        <FadeIn first={i === 0}>
          <Scene />
        </FadeIn>
      </Sequence>
    ))}
  </AbsoluteFill>
);
