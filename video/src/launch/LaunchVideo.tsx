import { AbsoluteFill, Easing, Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { mix } from "../anim";
import { Sfx, SfxEnabled, SfxGain } from "../audio";
import { SceneSpeed, useFrame } from "../frame";
import { LAUNCH_HEIGHT, LAUNCH_WIDTH } from "./kit";
import { LAUNCH_DURATION, LAUNCH_SCENES, OVERLAP, STEPS_PER_FRAME, type TimedScene } from "./scenes";

// The launch video (LAUNCH.md), 16:9: the scenes end to end on the music's beat grid, handed over so the camera seems
// to keep moving through one take (scenes.tsx, `exit`). A dive pushes into a point, gathering speed, and the next
// scene lands out of the blur around its own focus, settling the last bit like a camera coming to rest, with a soft
// shimmer; a pan slides the camera on and the next scene arrives from the other side, the two meeting edge to edge,
// motion-blurred along the move.
// The music (scripts/make-audio.py --launch) follows the same grid.
// Everything here counts in drawn frames (30 per second); the composition runs at 60 and plays each drawn frame in
// two steps (SceneSpeed), so every animation gets the in-between positions.
// The dive starts a little before the next scene does, so the two overlap.
const EXIT = 24;
const MUSIC_VOLUME = 0.7;
// The reference's effects are minimal: quiet under the music, never on top of it.
const SFX_GAIN = 0.6;
// How close the next scene starts after a dive, settling to 1.
const ARRIVE = 1.12;
const PAN_BLUR = 30;

export const LAUNCH_FRAMES = LAUNCH_DURATION * STEPS_PER_FRAME;

const clampEase = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) } as const;

// A zoom that feels even: interpolated on the logarithm of the scale, so each step looks like the same push.
function zoom(p: number, from: number, to: number) {
  return Math.exp(mix(p, Math.log(from), Math.log(to)));
}

const Shell: React.FC<{ scene: TimedScene; first: boolean; children: React.ReactNode }> = ({ scene, first, children }) => {
  const frame = useFrame();
  const transforms: string[] = [];
  let opacity = 1;
  let blur = 0;
  const motion = { x: 0, y: 0 };
  let origin = "50% 50%";
  // Coming in.
  const p = first ? 1 : interpolate(frame, [0, OVERLAP], [0, 1], clampEase);
  if (!first && p < 1) {
    const came = scene.came;
    if (came && "pan" in came) {
      if (came.pan === "left") transforms.push(`translateX(${(1 - p) * LAUNCH_WIDTH}px)`);
      else transforms.push(`translateY(${(1 - p) * LAUNCH_HEIGHT}px)`);
      motion[came.pan === "left" ? "x" : "y"] = Math.sin(Math.PI * p) * PAN_BLUR;
    } else if (came) {
      // Out of the dive: quickest as it takes over, settling softly into place.
      const e = interpolate(frame, [0, OVERLAP + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
      origin = scene.focus ?? "50% 50%";
      transforms.push(`scale(${zoom(e, ARRIVE, 1)})`);
      blur = (1 - e) * 18;
      opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
    } else {
      opacity = p;
      blur = (1 - p) * 16;
    }
  }
  // Going out.
  const exit = scene.exit;
  if (exit && "pan" in exit) {
    const q = interpolate(frame, [scene.duration - OVERLAP, scene.duration], [0, 1], clampEase);
    if (q > 0) {
      transforms.push(exit.pan === "left" ? `translateX(${-q * LAUNCH_WIDTH}px)` : `translateY(${-q * LAUNCH_HEIGHT}px)`);
      motion[exit.pan === "left" ? "x" : "y"] = Math.max(motion[exit.pan === "left" ? "x" : "y"], Math.sin(Math.PI * q) * PAN_BLUR);
    }
  } else if (exit) {
    // Into the dive: a gentle start that keeps accelerating, handed to the next scene at speed.
    const out = interpolate(frame, [scene.duration - EXIT, scene.duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
    if (out > 0) {
      transforms.push(`scale(${zoom(out, 1, exit.scale ?? 7)})`);
      origin = exit.dive;
      blur = Math.max(blur, out * out * 26);
    }
  }
  const filterId = `move-${scene.id}`;
  const moving = motion.x > 0.3 || motion.y > 0.3;
  const filter = [moving ? `url(#${filterId})` : "", blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : ""].join(" ").trim();
  return (
    <AbsoluteFill style={{ opacity, transform: transforms.join(" ") || undefined, transformOrigin: origin, filter: filter || undefined }}>
      {moving && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${motion.x.toFixed(1)} ${motion.y.toFixed(1)}`} />
          </filter>
        </svg>
      )}
      {/* A dive's shimmer swells into the cut; a pan gets a soft, airy sweep. Both stay well under the music. */}
      {exit && "dive" in exit && <Sfx name="shimmer" at={scene.duration - OVERLAP - 23} volume={0.22} />}
      {exit && "pan" in exit && <Sfx name="sweep" at={scene.duration - OVERLAP - 8} volume={0.2} />}
      {children}
    </AbsoluteFill>
  );
};

export const LaunchVideo: React.FC<{ music?: boolean; sfx?: boolean }> = ({ music = true, sfx = true }) => (
  <AbsoluteFill style={{ backgroundColor: "#070707" }}>
    {music && <Html5Audio src={staticFile("music/launch-bed.mp3")} volume={MUSIC_VOLUME} />}
    <SceneSpeed.Provider value={1 / STEPS_PER_FRAME}>
      <SfxEnabled.Provider value={sfx}>
        <SfxGain.Provider value={SFX_GAIN}>
          {LAUNCH_SCENES.map((scene, i) => (
            <Sequence key={scene.id} from={scene.start * STEPS_PER_FRAME} durationInFrames={scene.duration * STEPS_PER_FRAME} name={scene.id}>
              <Shell scene={scene} first={i === 0}>
                <scene.component />
              </Shell>
            </Sequence>
          ))}
        </SfxGain.Provider>
      </SfxEnabled.Provider>
    </SceneSpeed.Provider>
  </AbsoluteFill>
);
