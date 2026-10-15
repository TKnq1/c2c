import { AbsoluteFill, Easing, interpolate, Sequence } from "remotion";
import { mix, ramp } from "../anim";
import { useFrame } from "../frame";
import { type LaunchScene, LAUNCH_SCENES } from "./scenes";

// The launch video (LAUNCH.md), 16:9: the scenes end to end. Each one comes in over the last OVERLAP frames of the
// one before, out of a blur ("fade") or out of the previous scene's zoom ("zoom"); a scene with an `exit` leaves by
// zooming hard into that point, the reference's whip into a word. No sound yet: this is the cut to judge the picture.
const OVERLAP = 10;
// The exit zoom starts a little before the next scene does, so the two overlap.
const EXIT = 14;

const STARTS = LAUNCH_SCENES.reduce<number[]>((starts, _, i) => [...starts, i === 0 ? 0 : starts[i - 1] + LAUNCH_SCENES[i - 1].duration - OVERLAP], []);

export const LAUNCH_DURATION = STARTS[STARTS.length - 1] + LAUNCH_SCENES[LAUNCH_SCENES.length - 1].duration;

const Shell: React.FC<{ scene: LaunchScene; first: boolean; children: React.ReactNode }> = ({ scene, first, children }) => {
  const frame = useFrame();
  const p = first ? 1 : ramp(frame, 0, OVERLAP);
  const zoomIn = scene.enter === "zoom";
  // Coming in: opacity and blur, plus a settle from slightly too big after a whip.
  let transform = zoomIn ? `scale(${mix(p, 1.5, 1)})` : undefined;
  let blur = (1 - p) * (zoomIn ? 22 : 16);
  if (scene.exit) {
    const out = interpolate(frame, [scene.duration - EXIT, scene.duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    if (out > 0) {
      transform = `${transform ?? ""} scale(${mix(out, 1, 7)})`;
      blur = Math.max(blur, out * 30);
    }
  }
  return (
    <AbsoluteFill style={{ opacity: p, transform, transformOrigin: scene.exit ?? "50% 50%", filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>{children}</AbsoluteFill>
  );
};

export const LaunchVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#070707" }}>
    {LAUNCH_SCENES.map((scene, i) => (
      <Sequence key={scene.id} from={STARTS[i]} durationInFrames={scene.duration} name={scene.id}>
        <Shell scene={scene} first={i === 0}>
          <scene.component />
        </Shell>
      </Sequence>
    ))}
  </AbsoluteFill>
);
